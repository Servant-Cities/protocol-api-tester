let messageHandler: (event: MessageEvent) => void;

export const getRerouteURL = (
  url: string,
  origin: string,
  pathsMap: Record<string, string>
): string => {
  let rerouteURL = url;
  let urlPath: string;
  console.log(JSON.stringify({ url, origin, pathsMap }));

  try {
    urlPath = new URL(url).pathname;
  } catch {
    urlPath = url.startsWith("/") ? url : "";
  }

  const matcher = Object.keys(pathsMap).find(pathToMatch => {
    const routePattern = new RegExp(
      "^" + pathToMatch.replace(/\*/g, ".*") + "$"
    );
    return routePattern.test(urlPath);
  });

  if (matcher) {
    const newPath = pathsMap[matcher];
    if (newPath !== "SKIP") {
      rerouteURL = `${origin}${newPath.replace(/\*/g, "")}${urlPath.replace(/^\/api\//, "")}`;
    }
  }

  console.log(`Using override fetch to reroute ${url} to ${rerouteURL}`);
  return rerouteURL;
};

export interface Params {
  origin: string;
  initialFetch: typeof fetch;
  pathsMap: Record<string, string>;
  secret: string;
}

export type FetchOverrideCreator = ({
  origin,
  initialFetch,
  pathsMap,
  secret,
}: Params) => typeof fetch;

export const createFetchOverride: FetchOverrideCreator =
  ({ origin, initialFetch, pathsMap, secret }) =>
  async (...args) => {
    let [firstArg, ...otherArgs] = [...args];
    const url = typeof firstArg === "string" ? firstArg : firstArg.url;

    if (url) {
      const reroute = getRerouteURL(url, origin, pathsMap);
      const init =
        (typeof firstArg === "string" ? otherArgs[0] : firstArg) || {};

      const modifiedInit = {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${secret}`,
        },
      };

      try {
        return initialFetch(
          reroute,
          typeof firstArg === "string" ? modifiedInit : [firstArg, ...otherArgs]
        );
      } catch (err) {
        console.error(err);
      }
    }

    console.log(`Using iframe fetch for: ${url}`);
    return initialFetch(...args);
  };

export const createMessageHandler = (
  origin: string,
  refresh: () => Promise<void>
) => {
  messageHandler = async (event: MessageEvent) => {
    if (event.data.type === "REQUEST_PREVIEW_SDK") {
      const { preview, secret } = event.data;
      const { pathsMap } = JSON.parse(preview);
      const iFrameFetch = window.fetch;
      window.fetch = createFetchOverride({
        origin: event.origin,
        initialFetch: iFrameFetch,
        pathsMap,
        secret,
      });
      return await refresh();
    }
  };
};

export const accept = (origin: string, refresh: () => void) => {
  createMessageHandler(origin, refresh);
  window.addEventListener("message", messageHandler);
  console.log("accepted : ", origin);
};

export const revoke = () => {
  window.removeEventListener("message", messageHandler);
};
