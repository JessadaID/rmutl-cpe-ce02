<script>
    export let project , adviserList, noAdviserYet = false;
    let activeAdviserTab = 'approved'; // 'approved' or 'unapproved'
    

      // --------- Computed Properties ---------
  $: approvedAdvisers = adviserList.filter(adv => adv.Approval);
  $: unapprovedAdvisers = adviserList.filter(adv => !adv.Approval);

  // --------- Adviser Handling Functions ---------
  
  /**
   * ตรวจสอบว่าอาจารย์ท่านนี้ถูกเลือกเป็นที่ปรึกษาหรือไม่
   */
  function isAdviserSelected(advEmail) {
    if (!project || !Array.isArray(project.adviser)) {
      return false;
    }
    return project.adviser.some(selected => selected && selected.email === advEmail);
  }

  /**
   * จัดการการเปลี่ยนแปลงการเลือกอาจารย์ที่ปรึกษา
   */
  function handleAdviserChange(event, adv) {
    const isChecked = event.target.checked;
    const adviserObject = { name: adv.label, email: adv.email };

    if (isChecked) {
      // Add adviser if not already present
      if (!project.adviser.some(sa => sa.email === adv.email)) { 
        project.adviser = [...project.adviser, adviserObject];
      }
      
      // Uncheck "no adviser" option if it was checked
      if (noAdviserYet) {
        noAdviserYet = false;
      }
    } else {
      // Remove adviser based on email match
      project.adviser = project.adviser.filter(selected => selected.email !== adv.email);
    }
  }

  /**
   * จัดการการกดตัวเลือก "ยังไม่มีที่ปรึกษา"
   */
  function handleNoAdviserToggle(event) {
    noAdviserYet = event.target.checked;
    if (noAdviserYet) {
      project.adviser = []; // Clear selected advisers
    }
  }

  /**
   * เปลี่ยนแท็บของรายการอาจารย์ที่ปรึกษา
   */
  function switchAdviserTab(tabName) {
    activeAdviserTab = tabName;
  }

</script>

<div>
    <label class="block text-sm font-medium text-gray-700">
      อาจารย์ที่ปรึกษาโครงงาน <span class="text-red-500 font-bold">*</span>
    </label>

    <!-- "No Adviser Yet" Checkbox -->
    <div class="mt-2 flex items-center">
      <input
        id="no-adviser-yet"
        type="checkbox"
        bind:checked={noAdviserYet}
        on:change={handleNoAdviserToggle}
        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <label for="no-adviser-yet" class="ml-2 block text-sm text-gray-900 cursor-pointer">
        ยังไม่มีที่ปรึกษา / ยังไม่ได้เลือกที่ปรึกษา
      </label>
    </div>

    <!-- Adviser Selection Area (Tabs and List) -->
    <div class:opacity-50={noAdviserYet} class:pointer-events-none={noAdviserYet} class="mt-2">
      <!-- Tab Navigation -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-4" aria-label="Tabs">
          <button
            type="button"
            on:click={() => switchAdviserTab('approved')}
            disabled={noAdviserYet}
            class={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
              ${activeAdviserTab === 'approved' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            อาจารย์ที่อนุมัติแล้ว ({approvedAdvisers.length})
          </button>
          <button
            type="button"
            on:click={() => switchAdviserTab('unapproved')}
            disabled={noAdviserYet}
            class={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
              ${activeAdviserTab === 'unapproved' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            อาจารย์ที่ยังไม่อนุมัติ ({unapprovedAdvisers.length})
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="mt-1 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50 space-y-3">
        {#if activeAdviserTab === 'approved'}
          {#if approvedAdvisers.length === 0}
            <p class="text-gray-500 text-sm">{adviserList.length === 0 ? 'กำลังโหลดรายชื่ออาจารย์...' : 'ไม่มีอาจารย์ที่ได้รับการอนุมัติ'}</p>
          {:else}
            {#each approvedAdvisers as adv (adv.id)}
              <div class="relative flex items-start">
                <div class="flex h-5 items-center">
                  <input
                    type="checkbox"
                    id={`${adv.id}-approved`}
                    value={adv.email}
                    checked={isAdviserSelected(adv.email)}
                    on:change={(event) => handleAdviserChange(event, adv)}
                    disabled={noAdviserYet}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for={`${adv.id}-approved`} class="font-medium text-gray-700 cursor-pointer">
                    {adv.label || adv.email}
                  </label>
                </div>
              </div>
            {/each}
          {/if}
        {:else if activeAdviserTab === 'unapproved'}
          {#if unapprovedAdvisers.length === 0}
            <p class="text-gray-500 text-sm">{adviserList.length === 0 ? 'กำลังโหลดรายชื่ออาจารย์...' : 'ไม่มีอาจารย์ที่ยังไม่ได้รับการอนุมัติ'}</p>
          {:else}
            {#each unapprovedAdvisers as adv (adv.id)}
              <div class="relative flex items-start">
                <div class="flex h-5 items-center">
                  <input
                    type="checkbox"
                    id={`${adv.id}-unapproved`}
                    value={adv.email}
                    checked={isAdviserSelected(adv.email)}
                    on:change={(event) => handleAdviserChange(event, adv)}
                    disabled={noAdviserYet}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for={`${adv.id}-unapproved`} class="font-medium text-gray-700 cursor-pointer">
                    {adv.label || adv.email} <span class="italic text-gray-500">(ยังไม่ได้รับการอนุมัติ)</span>
                  </label>
                </div>
              </div>
            {/each}
          {/if}
        {/if}
      </div>
    </div>
     {#if project.adviser.length === 0 && !noAdviserYet}
        <p class="mt-1 text-xs text-red-500">กรุณาเลือกอาจารย์ที่ปรึกษาอย่างน้อย 1 ท่าน หรือทำเครื่องหมายที่ "ยังไม่มีที่ปรึกษา"</p>
     {/if}
  </div>