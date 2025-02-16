<script>
  import { onMount } from "svelte";
  import mermaid from "mermaid";
  import { page } from "$app/state";
  import { accept } from "$lib/plagroundPreviewSDK";

  let selectedScenario = $state(null);
  let connections = $state([]);
  let activities = $state([]);
  let mermaidGraph = $state("");

  async function fetchResource(resourceName) {
    try {
      const res = await fetch(`http://localhost:5173/api/${resourceName}`);
      if (!res.ok) throw new Error(`Failed to load ${resourceName}`);
      return res.json();
    } catch (error) {
      console.error(error);
    }
  }

  const scenarioID = page.params.id;

  const loadData = async () => {
    const { scenarioData, connectionsData, activitiesData } = await Promise.all(
      Object.entries({
        scenarioData: fetchResource(`scenarios/${scenarioID}`),
        connectionsData: fetchResource("connections"),
        activitiesData: fetchResource("activities"),
      }).map(async ([resource, request]) => [resource, await request])
    ).then(Object.fromEntries);

    selectedScenario = scenarioData;
    connections = connectionsData.filter(
      ({ scenario }) => selectedScenario.uri === scenario
    );
    activities = activitiesData.filter(({ uri }) =>
      connections.some(
        ({ previous_activity, next_activity }) =>
          previous_activity === uri || next_activity === uri
      )
    );

    generateMermaidDiagram();
  };

  function generateMermaidDiagram() {
    let graphDefinition = `flowchart LR\n`;
    const activityMap = new Map();

    activities.forEach((activity, index) => {
      activityMap.set(activity.uri, `A${index}`);
    });

    connections.forEach(({ previous_activity, next_activity }) => {
      if (
        activityMap.has(previous_activity) &&
        activityMap.has(next_activity)
      ) {
        const prevId = activityMap.get(previous_activity);
        const nextId = activityMap.get(next_activity);
        const prevName = activities.find(a => a.uri === previous_activity).name;
        const nextName = activities.find(a => a.uri === next_activity).name;

        graphDefinition += `\u0020\u0020\u0020\u0020${prevId}[${prevName}]-->${nextId}[${nextName}]\n`;
      }
    });

    mermaidGraph = graphDefinition;
  }

  $effect(() => {
    if (mermaidGraph) {
      setTimeout(() => {
        mermaid.init();
      }, 0);
    }
  });

  onMount(async () => {
    accept(
      [
        "https://demo-rest-playground.servantcities.eu",
        "http://localhost:4000",
      ],
      loadData
    );
  });
</script>

{#if mermaidGraph}
  <h2>Fetched {selectedScenario.name}</h2>

  <pre class="mermaid">
    {mermaidGraph}
  </pre>
{:else}
  <div class="loader-wrapper">
    <div class="loader"></div>
  </div>
{/if}

<style>
  pre {
    border: white solid 2px;
    border-radius: 8px;
    padding: 10px;
    overflow-x: auto;
  }
  .mermaid {
    background-color: #fff;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ddd;
  }
  .loader-wrapper {
    height: 100%;
    width: 100%;
    padding-top: 10%;
  }
  .loader {
    margin: 0 auto;
    width: 40px;
    aspect-ratio: 1;
    position: relative;
  }
  .loader:before,
  .loader:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    margin: -8px 0 0 -8px;
    width: 16px;
    aspect-ratio: 1;
    background: #3fb8af;
    animation:
      l1-1 2s infinite,
      l1-2 0.5s infinite;
  }
  .loader:after {
    background: #ff3d7f;
    animation-delay: -1s, 0s;
  }
  @keyframes l1-1 {
    0% {
      top: 0;
      left: 0;
    }
    25% {
      top: 100%;
      left: 0;
    }
    50% {
      top: 100%;
      left: 100%;
    }
    75% {
      top: 0;
      left: 100%;
    }
    100% {
      top: 0;
      left: 0;
    }
  }
  @keyframes l1-2 {
    80%,
    100% {
      transform: rotate(0.5turn);
    }
  }
</style>
