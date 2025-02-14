<script>
  import { accept } from "$lib/plagroundPreviewSDK";
  import { onMount } from "svelte";

  let scenarios = $state([]);
  let activities = $state([]);
  let triggers = $state([]);
  let connections = $state([]);

  async function fetchResource(resourceName) {
    try {
      const res = await fetch(`http://localhost:5173/api/${resourceName}`);
      if (!res.ok) throw new Error(`Failed to load ${resourceName}`);
      return res.json();
    } catch (error) {
      console.error(error);
    }
  }

  const loadData = async () => {
    scenarios = await fetchResource("scenarios");
    activities = await fetchResource("activities");
    triggers = await fetchResource("triggers");
    connections = await fetchResource("connections");
  };

  onMount(async () => {
    accept(["https://demo-rest-playground.servantcities.eu", "https://docs.getgrist.com"], loadData);
  });
</script>

<h1>Fetched Resources</h1>

<h2>Scenarios</h2>
<pre>{JSON.stringify(scenarios, null, 2)}</pre>

<h2>Activities</h2>
<pre>{JSON.stringify(activities, null, 2)}</pre>

<h2>Triggers</h2>
<pre>{JSON.stringify(triggers, null, 2)}</pre>

<h2>Connections</h2>
<pre>{JSON.stringify(connections, null, 2)}</pre>

<style>
  * {
    color: white;
  }
  pre {
    background: black;
    border: white solid 2px;
    border-radius: 8px;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
  }
</style>
