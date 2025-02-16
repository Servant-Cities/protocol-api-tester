<script>
  import { onMount } from "svelte";
  import mermaid from "mermaid";
  import { page } from "$app/state";
  import { accept } from "$lib/plagroundPreviewSDK";

  let scenarios = $state([]);
  let connections = $state([]);
  let activities = $state([]);
  let triggers = $state([]);
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
    const { scenariosData, connectionsData, activitiesData, triggersData } =
      await Promise.all(
        Object.entries({
          scenariosData: fetchResource("scenarios"),
          connectionsData: fetchResource("connections"),
          activitiesData: fetchResource("activities"),
          triggersData: fetchResource("triggers"),
        }).map(async ([resource, request]) => [resource, await request])
      ).then(Object.fromEntries);

    scenarios = scenariosData.filter(({ uri }) =>
      uri.endsWith(`/${scenarioID}`)
    );
    connections = connectionsData.filter(({ scenario }) =>
      scenario.endsWith(`/${scenarioID}`)
    );
    activities = activitiesData.filter(({ uri }) =>
      connections.some(
        ({ previous_activity, next_activity }) =>
          previous_activity === uri || next_activity === uri
      )
    );
    triggers = triggersData.filter(({ uri }) =>
      activities.some(({ trigger }) => trigger === uri)
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

<h2>Fetched Resources for scenario {scenarioID}</h2>

<!-- Dynamically Rendered Mermaid Diagram -->
<pre class="mermaid">
  {mermaidGraph}
</pre>

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
</style>
