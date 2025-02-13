<script>
	import { onMount } from 'svelte';

	let scenarios = $state([]);
	let activities = $state([]);
	let triggers = $state([]);
	let connections = $state([]);

	async function fetchResource(resourceName, state) {
		try {
			const res = await fetch(`http://localhost:5173/${resourceName}`);
			if (!res.ok) throw new Error(`Failed to load ${resourceName}`);
			state.set(await res.json()); // Update the state
		} catch (error) {
			console.error(error);
		}
	}

	onMount(() => {
		fetchResource('scenarios', scenarios);
		fetchResource('activities', activities);
		fetchResource('triggers', triggers);
		fetchResource('connections', connections);
	});
</script>

<style>
	pre {
		background: #f4f4f4;
		padding: 10px;
		border-radius: 5px;
		overflow-x: auto;
	}
</style>

<h1>Fetched Resources</h1>

<h2>Scenarios</h2>
<pre>{JSON.stringify(scenarios, null, 2)}</pre>

<h2>Activities</h2>
<pre>{JSON.stringify(activities, null, 2)}</pre>

<h2>Triggers</h2>
<pre>{JSON.stringify(triggers, null, 2)}</pre>

<h2>Connections</h2>
<pre>{JSON.stringify(connections, null, 2)}</pre>
