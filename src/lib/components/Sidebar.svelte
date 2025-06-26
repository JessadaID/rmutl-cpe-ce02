<!-- src/lib/components/Sidebar.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	const dispatch = createEventDispatcher();

	let selectedItemId = '';

	// --- State ---
	// The sidebar's open/closed state. Exported to be controlled by a parent component.
	// Defaults to `false` for a mobile-first approach.
	export let isOpen = false;

	// Menu items
	export let menuItems = [];
	export let title = '';

	// --- Functions ---
	// Toggles the sidebar state. Exported for parent component use (e.g., a hamburger button).
	export function toggleSidebar() {
		isOpen = !isOpen;
	}

	function handleItemClick(item) {
		selectedItemId = item.id;
		dispatch('itemclick', item);
		// On mobile (screens smaller than lg breakpoint), close the sidebar after selection for better UX.
		if (typeof window !== 'undefined' && window.innerWidth < 1024) {
			isOpen = false;
		}
	}
</script>

<!-- Backdrop for mobile overlay. Closes the sidebar when clicked. -->
{#if isOpen}
	<div
		class="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
		on:click={toggleSidebar}
		transition:fade={{ duration: 200 }}
		aria-hidden="true"
	/>
{/if}

<!-- Sidebar Container -->
<div
	class="fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-gray-200/60 bg-white/95 text-gray-800 shadow-xl shadow-gray-100/50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:transition-all"
	class:translate-x-0={isOpen}
	class:-translate-x-full={!isOpen}
	class:lg:w-64={isOpen}
	class:lg:w-16={!isOpen}
>
	<!-- Header Section -->
	{#if isOpen}
		<div class="px-6 py-5 border-b border-gray-100" transition:slide={{ duration: 200 }}>
			<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
			<p class="text-sm text-gray-500 mt-1">Navigation Menu</p>
		</div>
	{/if}

	<!-- Toggle Button -->
	<!-- This button is only visible on large screens to collapse/expand the sidebar -->
	<button
		class="absolute -right-3 top-6 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition-all duration-200 hover:shadow-lg hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:flex"
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
				{#if item.id == 'sprade_teacher'}
					<div class="relative flex items-center justify-center my-4 {isOpen == false ? 'hidden' : ''}">
						<div class="absolute inset-x-0 top-1/2 h-0.5 bg-gray-300 -translate-y-1/2"></div>
						<span class="relative z-10 px-2 bg-white text-sm text-gray-500">ส่วนของอาจารย์</span>
					</div>
				{:else if item.id == "sprade_subject_teacher"}
					<div class="relative flex items-center justify-center my-4 {isOpen == false ? 'hidden' : ''}">
						<div class="absolute inset-x-0 top-1/2 h-0.5 bg-gray-300 -translate-y-1/2"></div>
						<span class="relative z-10 px-2 bg-white text-sm text-gray-500">ส่วนของอาจารย์ประจำวิชา</span>
					</div>
				{:else}
				{@const isActive = selectedItemId === item.id}
				<button
					class={`
						w-full flex items-center 
						${isOpen ? 'px-4 py-3' : 'justify-center px-2 py-3'}
						transition-all duration-200 
						group font-medium text-sm
						relative overflow-hidden
						${isActive
							? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
					`}
					on:click={() => handleItemClick(item)}
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
				{/if}
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