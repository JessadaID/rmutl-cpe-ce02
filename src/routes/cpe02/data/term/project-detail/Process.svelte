<script>
  export let project, can_edit_task, Task, isLoading, isLoadingtext, visibleStates, status, projectId, comment, role;
  import { doc, updateDoc } from "firebase/firestore";
  import { db } from "$lib/firebase";
  import { successToast, dangerToast } from "$lib/customtoast"; // Assuming you have these

  // ฟังก์ชัน toggle
  function toggleTask(index) {
    visibleStates = visibleStates.map((state, i) => (i === index ? !state : state)); // Ensure reactivity
  }

  function isOverdue(dueDate) {
    if (!dueDate) return false; // Handle cases where dueDate might be missing
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare dates only, ignore time
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return today > due;
  }

  function updateStatus(event, index) {
    const newStatus = event.target.value;
    status[index] = newStatus; // Update local status array for radio button state and save payload
    status = [...status]; // Trigger reactivity for the status array itself (for radio button binding)
  }
  async function addTask(index) { // Removed comment, status args as they are bound
    const projectDocRef = doc(db, "project-approve", projectId);

    // Ensure status and comment for the specific index exist
    const currentStatus = status[index] || ""; // Default if undefined
    const currentComment = comment[index] || ""; // Default if undefined

    if (!currentStatus) {
        dangerToast("กรุณาเลือกสถานะ (แก้ไข หรือ ผ่าน)");
        return; // Prevent update if status is not selected
    }

    const taskKey = `Tasks.${index}`;
    const taskUpdate = {
      comment: currentComment,
      status: currentStatus,
    };

    try {
      isLoadingtext = true; // Consider making this specific to the button index if needed
      await updateDoc(projectDocRef, {
        [taskKey]: taskUpdate,
      });
      successToast("บันทึกความคิดเห็นและสถานะเรียบร้อยแล้ว!");

      // Update project.Tasks on the client-side AFTER successful save
      // to reflect the change in the UI via getStatusInfo.
      if (!project.Tasks) {
        project.Tasks = {};
      }
      if (!project.Tasks[index]) {
        project.Tasks[index] = {}; // Initialize if it doesn't exist
      }
      project.Tasks[index].status = currentStatus;
      project.Tasks[index].comment = currentComment; // Also update the comment in the project object
      project = { ...project }; // Trigger Svelte's reactivity for the project object
      // Optionally close the toggle after successful save
      // toggleTask(index);
    } catch (error) {
      console.error("Error adding/updating task: ", error);
      dangerToast("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } finally {
      isLoadingtext = false;
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) { // Check if date is valid
            return 'Invalid Date';
        }
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Error';
    }
  }

  // Helper to get status display text and style
  function getStatusInfo(taskIndex) {
    const taskStatus = project?.Tasks?.[taskIndex]?.status; // Safely access nested status
    switch (taskStatus) {
      case "wait":
        return { text: "รออนุมัติ", class: "bg-blue-100 text-blue-800" };
      case "improvement":
        return { text: "ต้องแก้ไข", class: "bg-yellow-100 text-yellow-800" };
      case "approve":
        return { text: "อนุมัติ", class: "bg-green-100 text-green-800" };
      default:
        return { text: "ยังไม่มีสถานะ", class: "bg-gray-100 text-gray-600" };
    }
  }

</script>

<!-- Removed outer container styling (md:m-5, p-3, md:bg-gray-200, etc.) -->
<!-- The parent component now handles the card and positioning -->
<div>
  <!-- Optional: Add a subtle title if needed within this component's context -->
  <!-- <h3 class="text-md font-medium text-gray-600 mb-4">ความคืบหน้า (ภาคเรียน: {project.term})</h3> -->

  {#if isLoading}
    <div class="text-center text-gray-500 py-6">
      <svg class="animate-spin h-5 w-5 mx-auto text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="mt-2 text-sm">กำลังโหลดข้อมูลความคืบหน้า...</p>
    </div>
  {:else if Task && Task.length > 0}
    <div class="space-y-4">
      {#each Task as task, index (task.id || index)}
        {@const statusInfo = getStatusInfo(index)}
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm relative transition-shadow duration-200 hover:shadow-md">
          <!-- Header Section -->
          <div class="p-4">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="text-base font-semibold text-gray-800">{task.title}</h4>
                <p class="text-sm text-gray-600 mt-1">{task.description}</p>
              </div>
              <!-- Toggle Button -->
              <button
                type="button"
                class="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition ml-2 flex-shrink-0"
                aria-label={visibleStates[index] ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}
                aria-expanded={visibleStates[index]}
                on:click={() => toggleTask(index)}
              >
                {#if visibleStates[index]}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                  </svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </button>
            </div>

            <!-- Status and Due Date -->
            <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
               <span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full {statusInfo.class}">
                 {statusInfo.text}
               </span>
               <span class="text-gray-500">
                 กำหนดส่ง: {formatDate(task.dueDate)}
               </span>
               {#if isOverdue(task.dueDate) && statusInfo.text !== 'อนุมัติ'}
                 <span class="text-red-600 font-medium flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                     <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd" />
                   </svg>
                   เกินกำหนด
                 </span>
               {/if}
            </div>
          </div>

          <!-- Collapsible Content -->
          {#if visibleStates[index]}
            <div class="mt-2 px-4 pb-4 border-t border-gray-200 pt-4">
              <label for="comment-{index}" class="block text-sm font-medium text-gray-700 mb-1">
                ความคิดเห็น / ข้อเสนอแนะ {role === "teacher" || role === "subject_teacher" || role === "admin" ? '(สำหรับอาจารย์)' : ''}
              </label>
              <textarea
                id="comment-{index}"
                class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm {can_edit_task ? '' : 'bg-gray-50 cursor-not-allowed'}"
                rows="4"
                readonly={!can_edit_task}
                bind:value={comment[index]}
                placeholder={can_edit_task ? "เพิ่มความคิดเห็นที่นี่..." : "ไม่มีความคิดเห็น"}
              ></textarea>
              
              {#if can_edit_task}
                <fieldset class="mt-4">
                  <legend class="block text-sm font-medium text-gray-700 mb-2">อัปเดตสถานะ:</legend>
                  <div class="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-x-6">
                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="improvement-{index}"
                        name="status-{index}"
                        value="improvement"
                        class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        checked={status[index] === "improvement"}
                        on:change={(event) => updateStatus(event, index)}
                      />
                      <label for="improvement-{index}" class="ml-2 block text-sm text-gray-700">แก้ไข</label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="approve-{index}"
                        name="status-{index}"
                        value="approve"
                        class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        checked={status[index] === "approve"}
                        on:change={(event) => updateStatus(event, index)}
                      />
                      <label for="approve-{index}" class="ml-2 block text-sm text-gray-700">ผ่าน</label>
                    </div>
                  </div>
                </fieldset>

                <button
                  class="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  on:click={() => addTask(index)}
                  disabled={isLoadingtext || !status[index]}
                >
                  {#if isLoadingtext}
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังบันทึก...
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    บันทึกการเปลี่ยนแปลง
                  {/if}
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center text-gray-500 py-6 px-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-700">ไม่พบข้อมูล Task</h3>
      <p class="mt-1 text-sm text-gray-500">ยังไม่มีการกำหนด Task สำหรับภาคเรียนนี้ หรือเกิดข้อผิดพลาดในการโหลด</p>
    </div>
  {/if}
</div>
