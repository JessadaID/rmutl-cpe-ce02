<!-- src/lib/components/Sidebar.svelte -->
<script>
	import { goto } from '$app/navigation';
	import { slide } from 'svelte/transition';

	let selectedItemId = '';

	// --- State ---
	let isOpen = true;

	// Menu items
	export let menuItems = [];
	export let title = '';
	// --- Functions ---
	function toggleSidebar() {
		isOpen = !isOpen;
	}

	function selectMenuItem(item ) {
		selectedItemId = item.id;
		goto(`/TS_Dashboard/${item.id}`);
	}
</script>

<!-- Sidebar Container -->
<div class={`
	transition-all duration-300 ease-out
	${isOpen ? 'w-64' : 'w-16'} 
	bg-white/95 backdrop-blur-sm
	text-gray-800 
	relative flex flex-col h-full 
	border-r border-gray-200/60
	shadow-xl shadow-gray-100/50
`}>
	<!-- Header Section -->
	{#if isOpen}
		<div class="px-6 py-5 border-b border-gray-100" transition:slide={{ duration: 200 }}>
			<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
			<p class="text-sm text-gray-500 mt-1">Navigation Menu</p>
		</div>
	{/if}

	<!-- Toggle Button -->
	<button
		class="
			absolute -right-3 top-6 z-20 
			w-6 h-6 
			bg-white 
			border border-gray-200
			text-gray-600 
			hover:text-gray-900 hover:bg-gray-50
			focus:outline-none focus:ring-2 focus:ring-blue-500/20
			transition-all duration-200
			shadow-md hover:shadow-lg
			flex items-center justify-center
		"
		on:click={toggleSidebar}
		aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
	>
		{#if isOpen}
			<!-- Chevron Left -->
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		{:else}
			<!-- Chevron Right -->
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		{/if}
	</button>

	<!-- Sidebar Content -->
	<div class="flex-grow overflow-y-auto overflow-x-hidden px-4 py-6">
		<nav class="space-y-2">
			{#each menuItems as item (item.id)}
				{@const isActive = selectedItemId === item.id}
				<button
					class={`
						w-full flex items-center 
						${isOpen ? 'px-4 py-3' : 'px-2 py-3 justify-center'}
						
						transition-all duration-200 
						group font-medium text-sm
						relative overflow-hidden
						${isActive
							? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
					`}
					on:click={() => selectMenuItem(item)}
					aria-current={isActive ? 'page' : undefined}
				>
					<!-- Active indicator -->
					{#if isActive}
						<div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 "></div>
					{/if}

					<!-- Icon -->
					<span class={`
						flex-shrink-0 w-5 h-5 
						flex items-center justify-center 
						transition-all duration-200
						${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
					`}>
						{@html item.icon}
					</span>

					<!-- Label -->
					{#if isOpen}
						<span
							transition:slide={{ duration: 200, axis: 'x' }}
							class="ml-3 whitespace-nowrap flex-grow text-left font-medium"
						>
							{item.label}
						</span>
					{/if}

					<!-- Hover effect -->
					<div class="absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:from-blue-50/50 group-hover:to-transparent rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
				</button>
			{/each}
		</nav>
	</div>

</div>

<style>
	/* Custom scrollbar styling */
	:global(.sidebar-scroll::-webkit-scrollbar) {
		width: 4px;
	}
	
	:global(.sidebar-scroll::-webkit-scrollbar-track) {
		background: transparent;
	}
	
	:global(.sidebar-scroll::-webkit-scrollbar-thumb) {
		background-color: rgba(156, 163, 175, 0.3);
		border-radius: 2px;
	}
	
	:global(.sidebar-scroll::-webkit-scrollbar-thumb:hover) {
		background-color: rgba(107, 114, 128, 0.5);
	}

	/* Icon sizing */
	:global(.sidebar-icon svg) {
		width: 100%;
		height: 100%;
	}

	/* Backdrop blur support */
	@supports (backdrop-filter: blur(8px)) {
		.backdrop-blur-sm {
			backdrop-filter: blur(8px);
		}
	}
</style>