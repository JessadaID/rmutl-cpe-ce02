<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let show = false;
  export let title = '';
  export let value = ''; // Use 'value' to bind to the input
  export let loading = false;
  export let showDelete = false; // Control visibility of delete button
  export let projectLimitValue = null;
  export let directorScoreLimitValue = 0;
  export let subjectScoreLimitValue = 0;
  export let adviserScoreLimitValue = 0;
  export let isCheckedLastermTask = false; // For the checkbox

  $: showisChecked = showDelete; // Local variable to manage checkbox state

  function handleSave() {
  dispatch('save', { 
    termName: value, // Assuming 'value' is the prop for term name
    projectLimit: projectLimitValue ,
    directorScoreLimit: directorScoreLimitValue,
    subjectScoreLimit: subjectScoreLimitValue,
    adviserScoreLimit: adviserScoreLimitValue,
    isCheckedLastermTask: isCheckedLastermTask
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


         <label for="projectLimitInput" class="block text-sm font-medium text-gray-700 mb-2 mt-2">จำนวนโครงงานที่รับได้ในเทอมนี้ (ของที่ปรึกษา)</label>
        <input 
          id="projectLimitInput" 
          type="number" 
          bind:value={projectLimitValue} 
          placeholder="เช่น 5" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
          min="0"
        />


        <div class="relative grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-2 border-gray-200 p-4 rounded-lg">
          <p class="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-sm text-gray-500 font-bold">เต็ม 100%</p>
          <div>
            <label for="subjectScoreLimitInput" class="block text-sm font-medium text-gray-700 mb-2">คะแนนอาจารย์ประจำวิชา (%)</label>
            <input 
              id="subjectScoreLimitInput" 
              type="number" 
              bind:value={subjectScoreLimitValue} 
              placeholder="เช่น 30" 
              class="w-full px-3 py-2 border border-gray-30" 
              min="0"
            />
            </div>


          <div>
            <label for="adviserScoreLimitInput" class="block text-sm font-medium text-gray-700 mb-2 ">คะแนนอาจารย์ที่ปรึกษา (%)</label>
            <input 
              id="adviserScoreLimitInput" 
              type="number" 
              bind:value={adviserScoreLimitValue} 
              placeholder="เช่น 30" 
              class="w-full px-3 py-2 border border-gray-30" 
              min="0"
            />
          </div>

          <div>
            <label for="directorScoreLimitInput" class="block text-sm font-medium text-gray-700 mb-2 ">คะแนนกรรมการ (%)</label>
        <input 
          id="directorScoreLimitInput" 
          type="number" 
          bind:value={directorScoreLimitValue} 
          placeholder="เช่น 30" 
          class="w-full px-3 py-2 border border-gray-30" 
          min="0"
        />
          </div>
        </div>


        {#if !showisChecked}
        <div class="mt-4 flex items-center">
          <input type="checkbox" name="" id="taskFromLastTerm" class="mr-2 cursor-pointer h-4 w-4" checked={isCheckedLastermTask} on:click={() => isCheckedLastermTask = !isCheckedLastermTask}/>
          <label for="taskFromLastTerm" class="text-sm font-medium text-gray-700">เพิ่มงานที่มอบหมายจากเทอมที่แล้ว</label>
        </div>
        {/if}

        

        
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
