<script>
    import { onMount } from 'svelte';

    export let tableTitle;
    export let monthLabels;
    export let activities;

    // ข้อมูลส่วนหัวที่แก้ไขได้

    onMount(() => {
        // This code runs once after the component is first rendered.
        // It converts activity.months to an array format if it's not already.
        if (!activities || !monthLabels) return;

        activities = activities.map(activity => {
            if (!activity) return activity; // Should ideally not happen with valid props

            let newMonthsArray;
            if (activity.months && typeof activity.months === 'object' && !Array.isArray(activity.months)) {
                // Convert from object format (e.g., {"Month 1": true}) to array [true, false, ...]
                newMonthsArray = monthLabels.map(label => !!activity.months[label]);
            } else if (Array.isArray(activity.months) && activity.months.length === monthLabels.length) {
                // Already in correct array format
                return activity; 
            } else {
                // Fallback: Initialize or re-initialize if format is unexpected or length mismatch
                newMonthsArray = Array(monthLabels.length).fill(false);
            }
            return { ...activity, months: newMonthsArray };
        });
    });

    function addActivity() {
      // Ensure unique ID, robust against deletions
      const newId = activities.length > 0 ? Math.max(0, ...activities.map(a => a.id)) + 1 : 1;
      activities = [
        ...activities,
        {
          id: newId,
          name: "",
          months: Array(monthLabels.length).fill(false), // Initialize months as an array of booleans
          color: "#11235A", // Preserving this property from original code
        },
      ];
    }
  
    function removeActivity(id) {
      activities = activities.filter((activity) => activity.id !== id);
    }
    /*
    function handleSubmit() {
      console.log("Submitted data:", {
        tableTitle,
        monthLabels,
        activities,
      });
    }*/
  
    // เพิ่มคอลัมน์เดือนใหม่
    function addMonth() {
      const newMonthName = `เดือน${monthLabels.length + 1}`; // Example name for the new month label
      monthLabels = [...monthLabels, newMonthName]; // Add new month name to labels
  
      // อัพเดทข้อมูลกิจกรรมเพื่อรองรับเดือนใหม่
      activities = activities.map(activity => {
        // activity.months should be an array. Append false for the new month.
        // Safeguard with (activity.months || []) in case it's undefined/null.
        const updatedMonths = [...(activity.months || []), false];
        return { ...activity, months: updatedMonths };
      });
    }
  
    function removeMonth(index) {
      monthLabels = monthLabels.filter((_, i) => i !== index);
  
      // อัปเดตกิจกรรมเพื่อเอาเดือนที่ลบออก
      activities = activities.map((activity) => {
        // activity.months should be an array. Splice it.
        // Safeguard with (activity.months || [])
        const newMonthsArray = [...(activity.months || [])];
        if (index >= 0 && index < newMonthsArray.length) { // Check bounds before splicing
          newMonthsArray.splice(index, 1);
        }
        return { ...activity, months: newMonthsArray };
      });
    }
  
    // The problematic reactive block that caused issues with duplicate month names has been removed.
    // It was attempting to rebuild `activity.months` based on month names, which is not needed
    // when `activity.months` is an array indexed by position.
</script>

<div>
    <label class="block text-sm font-medium text-gray-700"
      >9. วิธีการดำเนินงาน <span class="text-red-500 font-bold">*</span>
    </label>
    <p class="mt-1 text-sm text-gray-600">ตารางแผนและระยะเวลาดำเนินงาน (Gantt Chart) <b>(สามารถคลิกเพื่อแก้ไขได้ ทุกส่วน)</b></p>
    
    
<div class="mt-4">
  <div class="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
    <table class="min-w-full divide-y divide-gray-200">
      <thead>
        <tr class="bg-gray-50">
          <!-- Activity Header -->
          <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3 sm:w-1/4">
            กิจกรรม
          </th>
          <!-- Month Headers Container -->
          <th
            scope="col"
            class="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider"
            colspan={monthLabels.length + 1}
          >
            <!-- Table Title Input -->
            <div class="flex items-center justify-center px-2 py-1 relative group">
              <input
                type="text"
                bind:value={tableTitle}
                class="flex-1 p-1 text-center font-semibold text-gray-700 bg-transparent border-none focus:ring-0 focus:outline-none placeholder-gray-400"
                placeholder="ชื่อตารางแผนงาน"
              />
              <!-- Add Month Button -->
              <button
                type="button"
                on:click={addMonth}
                class="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-xs font-medium transition-colors absolute right-1 opacity-0 group-hover:opacity-100"
                title="เพิ่มเดือน"
              >
                + เดือน
              </button>
            </div>
          </th>
        </tr>
        <tr class="bg-gray-50">
          <!-- Empty cell for alignment -->
          <th scope="col" class="px-4 py-2"></th>
          <!-- Individual Month Labels -->
          {#each monthLabels as month, i}
            <th scope="col" class="px-1 py-1 text-center text-xs font-medium text-gray-500 relative group">
              <div class="flex items-center justify-center">
                <input
                  type="text"
                  bind:value={monthLabels[i]}
                  class="w-full px-1 py-1 text-center bg-transparent border-none focus:ring-1 focus:ring-indigo-300 rounded-sm focus:outline-none"
                  placeholder="ชื่อเดือน"
                />
                <!-- Remove Month Button (Icon) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-red-400 hover:text-red-600 cursor-pointer absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  on:click={() => removeMonth(i)}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  title="ลบเดือนนี้"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each activities as activity (activity.id)}
          <tr class="hover:bg-gray-50 group">
            <!-- Activity Name Input -->
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 relative">
              <div class="flex items-center">
                <input
                  type="text"
                  bind:value={activity.name}
                  class="flex-grow p-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="ชื่อกิจกรรม"
                  required
                />
                <!-- Remove Activity Button (Icon) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-red-400 hover:text-red-600 cursor-pointer ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  on:click={() => removeActivity(activity.id)}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  title="ลบกิจกรรมนี้"
                >
                   <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </td>
            <!-- Month Checkboxes -->
            {#each monthLabels as month, i (i)} <!-- Use index i for key and for accessing activity.months -->
              <td class="px-1 py-2 text-center">
                <input
                  type="checkbox"
                  bind:checked={activity.months[i]} 
                  class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Add Activity Button and Helper Text -->
  <div class="mt-4 flex items-center space-x-4">
    <button
      type="button"
      on:click={addActivity}
      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
    >
       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
         <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
       </svg>
      เพิ่มกิจกรรม
    </button>
    <!-- Helper text for validation -->
    {#if activities.length === 0 || activities.some(a => !a.name.trim())}
      <p class="mt-1 text-xs text-gray-500">กรุณาเพิ่มกิจกรรมและใส่ชื่อกิจกรรมในแผนการดำเนินงาน</p>
    {/if}
  </div>
</div>

</div>