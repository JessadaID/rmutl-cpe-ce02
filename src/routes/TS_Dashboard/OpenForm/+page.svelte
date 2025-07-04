<script lang="ts">
    import { db } from "$lib/firebase";
    import {
      collection,
      getDocs,
      doc,
      updateDoc,
      serverTimestamp,
      writeBatch,
      deleteDoc,
    } from "firebase/firestore";
    import { onMount } from "svelte";
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import Modal from '$lib/components/Modal.svelte'; // Import the Modal component
    import { dangerToast } from "$lib/customtoast.js";
    import Loading from "$lib/components/loading.svelte";
    import { successToast } from "$lib/customtoast.js";

    let terms = [];
    let loading = true;

    // State for the new unified Modal
    let showTermModal = false;
    let modalMode: 'create' | 'edit' = 'create'; // To distinguish between create and edit
    let currentTermName = ""; // Bound to the modal's input
    let currentEditingTerm = null; // Stores the term object when editing
    let currentProjectLimit: number | null = null; // For the new input
    let currentDirectorScoreLimit: number | null = null; // For directorScoreLimit
    let adviserScoreLimitValue = 0; // For adviserScoreLimit
    let subjectScoreLimitValue = 0; // For subjectScoreLimit
    let isCheckedLastermTask = false; // For the checkbox

    let modalTitle = "";
    
    let messageBody = "";
    let title = "";

    let showConfirmModal = false;
    let confirmModalMessage = "";
    let confirmModalOnConfirm: () => void = () => {};
    let confirmModalConfirmButtonClass = "bg-blue-600 hover:bg-blue-700 text-white";
    
    onMount(async () => {
      loadTerms();
    });
  
    async function loadTerms() {
 
      try {
        loading = true;

        const response = await fetch('/api/form-data?createdAt=desc', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=30'
          }
        });
        const data = await response.json();
        if (data.error) {
          console.error("Error fetching data:", data.error);
          return;
        }
        terms = data.data;
      } catch (error) {
        console.error("Error fetching data:", error);
      }finally {
        loading = false;
      }
    }
  
    function openTermModalForEdit(term) {
      modalMode = 'edit';
      modalTitle = `แก้ไขข้อมูลเทอม: ${term.term}`;
      currentTermName = term.term;
      currentProjectLimit = term.projectLimit === undefined ? 5 : term.projectLimit; // Default to 5 if not set
      currentDirectorScoreLimit = term.directorScoreLimit === undefined ? 0 : term.directorScoreLimit; // Default to 0 if not set
      adviserScoreLimitValue = term.adviserScoreLimit === undefined ? 0 : term.adviserScoreLimit; // Default to 0 if not set
      subjectScoreLimitValue = term.subjectScoreLimit === undefined ? 0 : term.subjectScoreLimit; // Default to 0 if not set
      currentEditingTerm = term;
      showTermModal = true;
    }

    function openTermModalForCreate() {
      modalMode = 'create';
      modalTitle = 'สร้างเทอมใหม่';
      currentTermName = "";
      currentProjectLimit = 5; // Default project limit for new terms
      currentDirectorScoreLimit = 40; // Default director score limit
      adviserScoreLimitValue = 40; // Default adviser score limit
      subjectScoreLimitValue = 30; // Default subject score limit
      currentEditingTerm = null;
      showTermModal = true;
    }
  
    async function toggleForm(termId, isOpen) {
      const actionText = isOpen ? "ปิด" : "เปิด";
      confirmModalMessage = `คุณแน่ใจหรือไม่ ที่จะ${actionText}ให้กรอกแบบฟอร์มสำหรับเทอมนี้?`;
      confirmModalConfirmButtonClass = isOpen 
        ? "bg-red-600 hover:bg-red-700 text-white" // ปิดฟอร์ม (แดง)
        : "bg-green-600 hover:bg-green-700 text-white"; // เปิดฟอร์ม (เขียว)

      confirmModalOnConfirm = async () => {
        try {
        loading = true;
        const batch = writeBatch(db);
        const formsRef = collection(db, "forms");
        const snapshot = await getDocs(formsRef);
  
        if (!isOpen) {
          snapshot.docs.forEach((doc) => {
            if (doc.id !== termId && doc.data().isOpen) {
              const docRef = doc.ref;
              batch.update(docRef, {
                isOpen: false,
                updatedAt: serverTimestamp(),
              });
            }
          });
        }
  
        const termRef = doc(db, "forms", termId);
        batch.update(termRef, {
          isOpen: !isOpen,
          updatedAt: serverTimestamp(),
        });
  
        await batch.commit();
        await loadTerms();

        sendNotification(isOpen);
      } catch (error) {
        console.error("Error toggling form:", error);
        alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะฟอร์ม");
        } finally {
          loading = false;
        }
      };
      showConfirmModal = true;
    }
    async function processUpdateTerm(updatedName: string, projectLimit: number | null, directorScoreLimit: number | null , adviserScoreLimitValue: number | null = 0, subjectScoreLimitValue: number | null = 0) {
      if (!currentEditingTerm || !updatedName.trim()) return;
  
      loading = true;
      try {
        const termRef = doc(db, "forms", currentEditingTerm.id);
        await updateDoc(termRef, {
          term: updatedName.trim(),
          projectLimit: projectLimit === null ? 0 : Number(projectLimit),
          directorScoreLimit: directorScoreLimit === null ? 0 : Number(directorScoreLimit),
          adviserScoreLimit: adviserScoreLimitValue === null ? 0 : Number(adviserScoreLimitValue),
          subjectScoreLimit: subjectScoreLimitValue === null ? 0 : Number(subjectScoreLimitValue),
          updatedAt: serverTimestamp(),
        });
        await loadTerms();
        return true; // Indicate success
      } catch (error) {
        console.error("Error updating term:", error);
        alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        return false; // Indicate failure
      } finally {
        loading = false;
      }
    }


    async function processCreateTerm(newTermName: string, projectLimit: number | null, directorScoreLimit: number | null, adviserScoreLimitValue: number | null = 0, subjectScoreLimitValue: number | null = 0) {
  if (!newTermName.trim()) return;

  loading = true;
  try {
    const batch = writeBatch(db);
    const formsRef = collection(db, "forms");
    const snapshot = await getDocs(formsRef);
    
    // ปิดฟอร์มทั้งหมดที่เปิดอยู่
    snapshot.docs.forEach((doc) => {
      if (doc.data().isOpen) {
        batch.update(doc.ref, {
          isOpen: false,
          updatedAt: serverTimestamp(),
        });
      }
    });

    // สร้างเทอมใหม่
    const newFormRef = doc(collection(db, "forms"));
    batch.set(newFormRef, {
      term: newTermName.trim(),
      projectLimit: projectLimit === null ? 0 : Number(projectLimit),
      directorScoreLimit: directorScoreLimit === null ? 0 : Number(directorScoreLimit),
      adviserScoreLimit: adviserScoreLimitValue === null ? 0 : Number(adviserScoreLimitValue),
      subjectScoreLimit: subjectScoreLimitValue === null ? 0 : Number(subjectScoreLimitValue),
      isOpen: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // ถ้ามีการเช็ค isCheckedLastermTask ให้คัดลอกงานจากเทอมล่าสุด
    if (isCheckedLastermTask) {
      await copyTasksFromLatestTerm(newTermName.trim());
    }

    await loadTerms();
    return true; // Indicate success
  } catch (error) {
    console.error("Error creating new term:", error);
    alert("เกิดข้อผิดพลาดในการสร้างเทอมใหม่");
    return false; // Indicate failure
  } finally {
    loading = false;
  }
}

// ฟังก์ชันสำหรับคัดลอกงานจากเทอมล่าสุด
async function copyTasksFromLatestTerm(newTermName: string) {
  try {
    // ดึงข้อมูลเทอมล่าสุด
    const latestTermResponse = await fetch('/api/form-data?createdAt=desc', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const latestTermData = await latestTermResponse.json();
    
    if (latestTermData.error || !latestTermData.data || latestTermData.data.length < 2) {
      console.log("ไม่พบเทอมก่อนหน้าสำหรับคัดลอกงาน");
      return;
    }

    // เทอมล่าสุดคือเทอมที่เพิ่งสร้าง (index 0) ดังนั้นเอาเทอมที่ 2 (index 1)
    const previousTerm = latestTermData.data[1];
    
    // ดึงข้อมูลงานทั้งหมดจากเทอมก่อนหน้า
    const tasksResponse = await fetch(`/api/tasks-data?term=${encodeURIComponent(previousTerm.term)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const tasksData = await tasksResponse.json();
    
    if (tasksData.error || !tasksData.data || tasksData.data.length === 0) {
      console.log("ไม่พบงานจากเทอมก่อนหน้าสำหรับคัดลอก");
      return;
    }

    // เตรียมข้อมูลงานใหม่สำหรับเทอมใหม่
    const newTasks = tasksData.data.map(task => ({
      ...task,
      term: newTermName, // เปลี่ยนเทอมเป็นเทอมใหม่
      id: undefined, // ให้ Firebase สร้าง ID ใหม่
      createdAt: undefined, // ให้ Firebase สร้าง timestamp ใหม่
      updatedAt: undefined, // ให้ Firebase สร้าง timestamp ใหม่
      // รีเซ็ตข้อมูลที่เกี่ยวข้องกับการสมัครหรือสถานะ (หากมี)
      // applications: [], // ถ้ามี field นี้
      // status: 'open', // ถ้ามี field นี้
    }));

    // สร้างงานใหม่ทั้งหมด
    const createTasksPromises = newTasks.map(async (taskData) => {
      try {
        const response = await fetch('/api/tasks-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData)
        });
        
        const result = await response.json();
        if (result.error) {
          console.error("Error creating task:", result.error);
        }
      } catch (error) {
        console.error("Error creating task:", error);
      }
    });

    await Promise.all(createTasksPromises);
    
    //console.log(`คัดลอกงานจากเทอม "${previousTerm.term}" มาสู่เทอม "${newTermName}" เรียบร้อยแล้ว (${newTasks.length} งาน)`);
    
  } catch (error) {
    console.error("Error copying tasks from latest term:", error);
    // ไม่ต้อง throw error เพื่อไม่ให้ขัดจังหวะการสร้างเทอม
  }
}

    function handleDeleteRequest() { // Renamed to avoid conflict if needed, called by Modal's delete event
      if (!currentEditingTerm) return;

      confirmModalMessage = `คุณแน่ใจหรือไม่ที่จะลบเทอม "${currentEditingTerm.term}"?\nการกระทำนี้ไม่สามารถย้อนกลับได้`;
      confirmModalConfirmButtonClass = "bg-red-600 hover:bg-red-700 text-white"; // ลบ (แดง)
      confirmModalOnConfirm = async () => {
        if (!currentEditingTerm) return;
        try {
          loading = true;
          await deleteDoc(doc(db, "forms", currentEditingTerm.id));
          await loadTerms();
          closeTermModal(); // Close the main term modal after deletion
          successToast(`เทอม ถูกลบเรียบร้อยแล้ว`);
        } catch (error) {
          console.error("Error deleting term:", error);
          dangerToast("เกิดข้อผิดพลาดในการลบข้อมูล" + error.message);
        } finally {
          loading = false;
        }
      };
      showConfirmModal = true;
    }

    // Updated to handle an object from the modal's save event
    async function handleModalSave(eventDetail: { termName: string, projectLimit: number | null, directorScoreLimit: number | null , adviserScoreLimit: number | null, subjectScoreLimit: number | null }) {
      let success = false;
      if (modalMode === 'create') {
        success = await processCreateTerm(eventDetail.termName, eventDetail.projectLimit, eventDetail.directorScoreLimit, eventDetail.adviserScoreLimit, eventDetail.subjectScoreLimit);
      } else if (modalMode === 'edit') {
        success = await processUpdateTerm(eventDetail.termName, eventDetail.projectLimit, eventDetail.directorScoreLimit, eventDetail.adviserScoreLimit, eventDetail.subjectScoreLimit);
      }
      if (success) {
        closeTermModal();
        successToast(`เทอม "${eventDetail.termName}" ได้รับการ ${modalMode === 'create' ? 'สร้าง' : 'แก้ไข'} สำเร็จ`);
      }
    }

    function closeTermModal() {
      showTermModal = false;
      currentTermName = "";
      currentProjectLimit = null;
      currentDirectorScoreLimit = 0;
      adviserScoreLimitValue = 0;
      subjectScoreLimitValue = 0;
      currentEditingTerm = null;
      // modalMode and modalTitle will be reset when opening the modal next time
    }

    // This function is now only for the button click
    function triggerCreateNewTerm() {
      openTermModalForCreate();
    }

  async function sendNotification(isOpen) {
    const actionText = isOpen ? "ปิด" : "เปิด";
    
    try {
      messageBody = `ฟอร์มเทอม ${terms[0].term} ได้${actionText}ให้กรอกข้อมูลแล้ว`;
      title = `ฟอร์มเปิดได้${actionText}ให้กรอกข้อมูลแล้ว`;

      const payload  = { title,messageBody };

      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

    } catch (error: any) {
      console.error("Error sending notification:", error);
      dangerToast("เกิดข้อผิดพลาดในการส่งการแจ้งเตือน"+error.message);
    } finally {
      loading = false;
    }
  }
  
    loadTerms();
  </script>
  
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800">จัดการเปิด/ปิดฟอร์ม</h1>
      <div class="flex items-center gap-3">
        <button
          on:click={triggerCreateNewTerm}
          disabled={loading}
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
          สร้างเทอมใหม่
        </button>
        <a
          href="OpenForm/manage_teacher"
          role="button"
          aria-disabled={loading}
          on:click={(e) => { if (loading) e.preventDefault(); }}
          class={`py-2 px-4 rounded-lg font-semibold text-white transition-colors duration-200 flex items-center gap-2
            ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-teal-500 hover:bg-teal-600'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.75.75 0 01-.312-.653c.0-1.7.0-3.185.0-4.674.0-.414.336-.75.75-.75h16.144a.75.75 0 01.75.75c.0 1.489.0 2.975.0 4.673a.75.75 0 01-.312.653l-2.437 1.218a.75.75 0 01-.676 0l-2.533-1.267a.75.75 0 00-.676 0l-2.533 1.267a.75.75 0 01-.676 0l-2.437-1.218z" />
          </svg>
          จัดการรายชื่ออาจารย์ (ฟอร์ม)
        </a>
      </div>
    </div>
  
    {#if loading}
      <Loading />
    {:else}
      <div class="grid gap-4">
        {#each terms as term}
          <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <h3 class="text-xl font-semibold text-gray-800">
                  เทอม : {term.term}
                </h3>
                <span
                  class={`px-3 py-1 rounded-full text-sm font-medium 
                              ${
                                term.isOpen
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                >
                  สถานะ : {term.isOpen ? "เปิด" : "ปิด"}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  on:click={() => toggleForm(term.id, term.isOpen)}
                  disabled={loading}
                  class={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5
                                  ${
                                    term.isOpen
                                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                                      : "bg-green-50 text-green-600 hover:bg-green-100"
                                  }`}
                  title={term.isOpen ? "ปิดฟอร์ม" : "เปิดฟอร์ม"}
                >
                  {#if term.isOpen}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                    </svg>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                  {term.isOpen ? "ปิดฟอร์ม" : "เปิดฟอร์ม"}
                </button>
                <button
                  on:click={() => openTermModalForEdit(term)}
                  disabled={loading}
                  class="px-3 py-2 rounded-lg font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  title="แก้ไขข้อมูลเทอม"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                  </svg>
                  แก้ไข
                </button>
              </div>
            </div>
            
        {#if term.createdAt || term.updatedAt}
          <p class="text-sm text-gray-500 mt-2">
            อัปเดตเมื่อ: {term.updatedAt}
          </p>
          <p class="text-sm text-gray-500 mt-2">
            สร้างเมื่อ: {term.createdAt}
          </p>
          <p class="text-sm text-gray-600 mt-1">
            จำนวนโครงงานที่รับได้ (ของที่ปรึกษา): {term.projectLimit !== undefined ? term.projectLimit : 'ไม่ได้กำหนด'}
          </p>
          <p class="text-sm text-gray-600 mt-1">
            คะแนน (กรรมการ: {term.directorScoreLimit !== undefined ? term.directorScoreLimit : 'ไม่ได้กำหนด'} % , ที่ปรึกษา: {term.adviserScoreLimit !== undefined ? term.adviserScoreLimit : 'ไม่ได้กำหนด'} % , อาจารย์ประจำวิชา: {term.subjectScoreLimit !== undefined ? term.subjectScoreLimit : 'ไม่ได้กำหนด'} %) 
          
          </p>
        {/if}

        
          </div>
        {:else}
          <div class="text-center py-8 text-gray-500">ไม่พบข้อมูลเทอม</div>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Unified Modal for Create and Edit -->
  <Modal
    bind:show={showTermModal}
    title={modalTitle}
    bind:value={currentTermName}
    bind:projectLimitValue={currentProjectLimit}
    bind:directorScoreLimitValue={currentDirectorScoreLimit}
    bind:adviserScoreLimitValue={adviserScoreLimitValue}
    bind:subjectScoreLimitValue={subjectScoreLimitValue}
    bind:isCheckedLastermTask={isCheckedLastermTask}
    loading={loading}
    showDelete={modalMode === 'edit'}
    on:save={(e) => handleModalSave(e.detail)}
    on:cancel={closeTermModal}
    on:delete={handleDeleteRequest}
  />

  <ConfirmModal
    bind:show={showConfirmModal}
    message={confirmModalMessage}
    confirmButtonClass={confirmModalConfirmButtonClass}
    on:confirm={() => {
      if (confirmModalOnConfirm) confirmModalOnConfirm();
      showConfirmModal = false; 
    }}
    on:cancel={() => {
      showConfirmModal = false;
    }}
  />
  