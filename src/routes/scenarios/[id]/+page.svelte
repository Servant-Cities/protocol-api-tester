<script>
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { accept } from "$lib/plagroundPreviewSDK";

  let scenarios = $state([]);
  let connections = $state([]);
  let activities = $state([]);
  let triggers = $state([]);

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
    const scenariosData = await fetchResource("scenarios");
    const connectionsData = await fetchResource("connections");
    const activitiesData = await fetchResource("activities");
    const triggersData = await fetchResource("triggers");

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
  };

  onMount(async () => {
    accept(
      [
        "https://demo-rest-playground.servantcities.eu",
        "http://localhost:4000", //unsafe for now, hardcode local grist-adapter
      ],
      loadData
    );
  });
</script>

<h1>Fetched Resources for Scenario {scenarioID}</h1>

<h2>Scenarios</h2>
<pre>{JSON.stringify(scenarios, null, 2)}</pre>

<h2>Connections</h2>
<pre>{JSON.stringify(connections, null, 2)}</pre>

<h2>Activities</h2>
<pre>{JSON.stringify(activities, null, 2)}</pre>

<h2>Triggers</h2>
<pre>{JSON.stringify(triggers, null, 2)}</pre>

<style>
  pre {
    border: white solid 2px;
    border-radius: 8px;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
  }
</style>
