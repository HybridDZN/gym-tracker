<script>
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	export let data;
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
		{selected}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content portalProps={{}} class="">
		<DropdownMenu.Group>
			{#each data as element}
				<DropdownMenu.Item class="">
					{element}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
