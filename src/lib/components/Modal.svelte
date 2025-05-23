<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let show = false;
  export let title = '';
  export let value = ''; // Use 'value' to bind to the input
  export let loading = false;
  export let showDelete = false; // Control visibility of delete button
  export let projectLimitValue = null;

  function handleSave() {
  dispatch('save', { 
    termName: value, // Assuming 'value' is the prop for term name
    projectLimit: projectLimitValue 
  });
}


  function handleCancel() {
    dispatch('cancel');
  }

  function handleDelete() {
    dispatch('delete');
  }

  // Allow closing with Escape key
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    on:keydown={handleKeydown}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div
      class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
      role="document"
      aria-label={title}
    >
      <h2 id="modal-title" class="text-xl font-bold mb-4 text-gray-800">{title}</h2>

      <div class="mb-4">
        <label for="termName" class="block text-sm font-medium text-gray-700 mb-2">
          ชื่อเทอม
        </label>
        <input
          type="text"
          id="termName"
          bind:value
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="เช่น 2024-2"
          disabled={loading}
        />


         <label for="projectLimitInput" class="block text-sm font-medium text-gray-700 mb-2 mt-2">จำนวนโครงงานที่รับได้</label>
        <input 
          id="projectLimitInput" 
          type="number" 
          bind:value={projectLimitValue} 
          placeholder="เช่น 5" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
          min="0"
        />
      </div>


      <div class="flex justify-between items-center">
        {#if showDelete}
          <button
            on:click={handleDelete}
            disabled={loading}
            class="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ลบ
          </button>
        {:else}
          <!-- Placeholder or empty div to maintain spacing if needed -->
          <div></div>
        {/if}

        <div class="space-x-2">
          <button
            on:click={handleSave}
            disabled={loading || !value.trim()}
            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            บันทึก
          </button>
          <button
            on:click={handleCancel}
            disabled={loading}
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
        </div>
      </div>


    </div>
  </div>
{/if}
