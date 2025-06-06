<script>
  import { dangerToast } from "$lib/customtoast";
  import { onMount } from "svelte";

  export let term;
  export let project_name_th;
  export let project_name_en;
  export let members;
  // Ensure adviser is initialized as an array (likely already is)
  export let adviser = []; // This array will now hold objects { name, email }
  export let External_consultant;

  function addMemberRow() {
    members = [...members, ""];
  }

  function deleteLastMember() {
    if (members.length > 1) {
      members = members.slice(0, -1);
    }
  }

  let adviserList = []; // This will hold { id, value (email), label (name), email, Approval }
  let isLoadingAdvisers = true; // To track loading state of adviser list
  let noAdviserYet = false; // New state for "No adviser selected yet"

  onMount(async () => {
    isLoadingAdvisers = true;
    try {
      const res = await fetch(`/api/teacher-data`);
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.data && Array.isArray(responseData.data)) {
          adviserList = responseData.data.map((teacher, index) => ({
            id: `adviser${index + 1}`,
            value: teacher.email, // Keep value for potential reference, but use email directly
            label: teacher.name,
            email: teacher.email
            // Approval property is no longer used for categorization here
          }));
        } else {
          adviserList = []; // Ensure list is empty if data is not as expected
          console.warn("Fetched teacher data is not in the expected format or is empty.");
        }
      } else {
         throw new Error(`Failed to fetch teacher data: ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching adviser list:", error);
      adviserList = []; // Ensure list is empty on error
      dangerToast(`ไม่สามารถดึงข้อมูลอาจารย์ที่ปรึกษาได้: ${error.message}`);
    } finally {
      isLoadingAdvisers = false;
    }
  });

  // Function to check if an adviser is currently selected (by email)
  function isAdviserSelected(advEmail) {
    return adviser.some(selected => selected.email === advEmail);
  }

  // Function to handle checkbox changes
  function handleAdviserChange(event, adv) {
    const isChecked = event.target.checked;
    const adviserObject = { name: adv.label, email: adv.email }; // Create the object { name, email }

    if (isChecked) {
      // Add the object if it's not already present
      if (!isAdviserSelected(adv.email)) {
        adviser = [...adviser, adviserObject];
      }
      if (noAdviserYet) { // If "no adviser" was checked, uncheck it
        noAdviserYet = false;
      }
    } else {
      // Remove the object based on email match
      adviser = adviser.filter(selected => selected.email !== adv.email);
    }
    // console.log("Updated advisers:", adviser); // For debugging
  }

  function handleNoAdviserToggle(event) {
    noAdviserYet = event.target.checked;
    if (noAdviserYet) {
      adviser = []; // Clear selected advisers if "no adviser" is checked
    }
  }

</script>

<!-- Use space-y-6 for consistent vertical spacing between sections -->
<div class="space-y-6">

  <!-- Section: Term -->
  <div>
    <label class="block text-sm font-medium text-gray-700"
      >ภาคเรียน <span class="text-red-500 font-bold">*</span></label
    >
    <p class="mt-1 text-base text-gray-900 bg-gray-100 px-3 py-2 rounded-md inline-block">{term}</p>
  </div>

  <!-- Section: Project Name TH -->
  <div>
    <label for="project_name_th" class="block text-sm font-medium text-gray-700"
      >ชื่อโครงงาน (ภาษาไทย) <span class="text-red-500 font-bold">*</span></label
    >
    <input
      type="text"
      id="project_name_th"
      placeholder="ระบุชื่อโครงงานภาษาไทย"
      required
      class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      bind:value={project_name_th}
    />
  </div>

  <!-- Section: Project Name EN -->
  <div>
    <label for="project_name_en" class="block text-sm font-medium text-gray-700"
      >ชื่อโครงงาน (ภาษาอังกฤษ) <span class="text-red-500 font-bold">*</span></label
    >
    <input
      type="text"
      id="project_name_en"
      placeholder="ระบุชื่อโครงงานภาษาอังกฤษ"
      required
      class="mt-1 p-2  block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      bind:value={project_name_en}
    />
  </div>

  <!-- Section: Members -->
  <div>
    <div class="flex justify-between items-center mb-2">
      <label class="block text-sm font-medium text-gray-700"
        >ชื่อผู้เสนอโครงงาน <span class="text-red-500 font-bold">*</span>
      </label>
      <div class="flex space-x-2">
         <button
            type="button"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            on:click={addMemberRow}
          >
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
             </svg>
            เพิ่ม
          </button>
          {#if members.length > 1}
          <button
            type="button"
            on:click={deleteLastMember}
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
            disabled={members.length <= 1}
          >
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
               <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
             </svg>
            ลบแถว
          </button>
          {/if}
      </div>
    </div>
    <!-- Grid layout for member inputs -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
      {#each members as member, index}
        <input
          type="text"
          bind:value={members[index]}
          placeholder="ชื่อ-สกุล ผู้เสนอโครงงาน {index + 1}"
          required
          class="block p-2  w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      {/each}
    </div>
     {#if members.length === 1 && members[0] === ""}
        <p class="mt-1 text-xs text-gray-500">กรุณากรอกชื่อผู้เสนอโครงงานอย่างน้อย 1 คน</p>
     {/if}
  </div>

  <!-- Section: Advisers -->
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
      <!-- Adviser List -->
      <div class="mt-1 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50 space-y-3">
        {#if isLoadingAdvisers}
          <p class="text-gray-500 text-sm">กำลังโหลดรายชื่ออาจารย์...</p>
        {:else if adviserList.length === 0}
          <p class="text-gray-500 text-sm">ไม่มีข้อมูลอาจารย์ในระบบ</p>
        {:else}
          {#each adviserList as adv (adv.id)}
            <div class="relative flex items-start">
              <div class="flex h-5 items-center">
                <input
                  type="checkbox"
                  id={adv.id}
                  value={adv.email}
                  checked={isAdviserSelected(adv.email)}
                  on:change={(event) => handleAdviserChange(event, adv)}
                  disabled={noAdviserYet}
                  class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div class="ml-3 text-sm">
                <label for={adv.id} class="font-medium text-gray-700 cursor-pointer">
                  {adv.label || adv.email}
                </label>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
     {#if adviser.length === 0 && !noAdviserYet}
        <p class="mt-1 text-xs text-red-500">กรุณาเลือกอาจารย์ที่ปรึกษาอย่างน้อย 1 ท่าน หรือทำเครื่องหมายที่ "ยังไม่มีที่ปรึกษา"</p>
     {/if}
  </div>

  <!-- Section: External Consultant -->
  <div>
    <label for="external_consultant" class="block text-sm font-medium text-gray-700"
      >ที่ปรึกษาภายนอก <span class="text-gray-500 text-xs">(ถ้ามี)</span>
    </label>
    <input
      type="text"
      id="external_consultant"
      placeholder="ระบุชื่อ-สกุล และหน่วยงาน (ถ้ามี)"
      class="mt-1  p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      bind:value={External_consultant}
    />
  </div>

</div>
