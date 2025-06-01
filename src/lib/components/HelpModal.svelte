<!-- src/lib/components/HelpModal.svelte -->
<script lang="ts">
  export let showModal: boolean;
  export let title: string = "วิธีการใช้งาน";
  export let onClose: () => void;
</script>

{#if showModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    on:click|self={onClose} 
  >
    <!-- Modal Box: Added flex, flex-col, and max-h for scrollability -->
    <div class="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[85vh]">
      <!-- Header: Added flex-shrink-0 -->
      <div class="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 class="text-xl font-semibold text-gray-800">{title}</h2>
        <button
          on:click={onClose}
          class="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>
      <!-- Scrollable Content Area: Added overflow-y-auto, flex-grow, and pr-2 for scrollbar space -->
      <div class="prose prose-sm sm:prose-base max-w-none text-gray-700 overflow-y-auto flex-grow pr-2">
        <slot /> <!-- Content will be passed here -->
      </div>
      <!-- Footer: Added flex-shrink-0, pt-4 and border-t for visual separation -->
      <div class="mt-6 text-right flex-shrink-0 pt-4 border-t border-gray-200">
        <button
          on:click={onClose}
          class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Optional: Add some basic prose styling if not using Tailwind Prose plugin */
  .prose :global(h3) {
    @apply text-lg font-semibold mt-4 mb-2 text-gray-700;
  }
  .prose :global(ul) {
    @apply list-disc pl-5 space-y-1;
  }
  .prose :global(p) {
    @apply mb-2;
  }
  .prose :global(strong) {
    @apply font-semibold;
  }

  /* Custom scrollbar styling for the content area (optional, WebKit browsers) */
  .prose::-webkit-scrollbar {
    @apply w-2; /* Width of the scrollbar */
  }
  .prose::-webkit-scrollbar-track {
    @apply bg-gray-100 rounded-full; /* Track color */
  }
  .prose::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded-full hover:bg-gray-500; /* Thumb color and hover state */
  }
</style>
