<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import Dropdown from '$lib/components/Dropdown.svelte';
	let data = ['Flat Chest Press', 'Incline Chest Press', 'Jelq'];
</script>

<Label for="exercise" class="">Your current sets</Label>

<Dropdown {data} />
