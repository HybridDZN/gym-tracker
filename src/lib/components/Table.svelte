<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	export let data;
</script>

<Table.Root>
	<Table.Caption>Today's Workout</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head>Exercise</Table.Head>
			<Table.Head>Weight Type</Table.Head>
			<Table.Head>Weight</Table.Head>
			<Table.Head>Reps</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		<Table.Row>
			<Table.Cell>{data.exercise}</Table.Cell>
			<!-- <Table.Cell class="font-medium">Notes</Table.Cell>
			<Table.Cell>Created Time</Table.Cell>
			<Table.Cell>Credit Card</Table.Cell>
			<Table.Cell class="text-right">$250.00</Table.Cell> -->
		</Table.Row>
	</Table.Body>
</Table.Root>
