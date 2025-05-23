<script lang="ts">
    import { db } from "$lib/firebase";
    import {
      collection,
      getDocs,
      doc,
      updateDoc,
      addDoc,
      serverTimestamp,
      orderBy,
      query,
      writeBatch,
      deleteDoc,
    } from "firebase/firestore";
    import { onMount } from "svelte";
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import Modal from '$lib/components/Modal.svelte'; // Import the Modal component
    import { dangerToast } from "$lib/customtoast.js";
    import Loading from "$lib/components/loading.svelte";

    let terms = [];
    let loading = true;

    // State for the new unified Modal
    let showTermModal = false;
    let modalMode: 'create' | 'edit' = 'create'; // To distinguish between create and edit
    let currentTermName = ""; // Bound to the modal's input
    let currentEditingTerm = null; // Stores the term object when editing
    let currentProjectLimit: number | null = null; // For the new input
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
      currentEditingTerm = term;
      showTermModal = true;
    }

    function openTermModalForCreate() {
      modalMode = 'create';
      modalTitle = 'สร้างเทอมใหม่';
      currentTermName = "";
      currentProjectLimit = 5; // Default project limit for new terms
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

    async function processUpdateTerm(updatedName: string, projectLimit: number | null) {
      if (!currentEditingTerm || !updatedName.trim()) return;
  
      loading = true;
      try {
        const termRef = doc(db, "forms", currentEditingTerm.id);
        await updateDoc(termRef, {
          term: updatedName.trim(),
          projectLimit: projectLimit === null ? 0 : Number(projectLimit),
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

    async function processCreateTerm(newTermName: string, projectLimit: number | null) {
      if (!newTermName.trim()) return;

      loading = true;
      try {
        const batch = writeBatch(db);
        const formsRef = collection(db, "forms");
        const snapshot = await getDocs(formsRef);
        snapshot.docs.forEach((doc) => {
          if (doc.data().isOpen) {
            batch.update(doc.ref, {
              isOpen: false,
              updatedAt: serverTimestamp(),
            });
          }
        });
  
        const newFormRef = doc(collection(db, "forms"));
        batch.set(newFormRef, {
          term: newTermName.trim(),
          projectLimit: projectLimit === null ? 0 : Number(projectLimit),
          isOpen: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
  
        await batch.commit();
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
        } catch (error) {
          console.error("Error deleting term:", error);
          alert("เกิดข้อผิดพลาดในการลบข้อมูล");
        } finally {
          loading = false;
        }
      };
      showConfirmModal = true;
    }

    // Updated to handle an object from the modal's save event
    async function handleModalSave(eventDetail: { termName: string, projectLimit: number | null }) {
      let success = false;
      if (modalMode === 'create') {
        success = await processCreateTerm(eventDetail.termName, eventDetail.projectLimit);
      } else if (modalMode === 'edit') {
        success = await processUpdateTerm(eventDetail.termName, eventDetail.projectLimit);
      }
      if (success) {
        closeTermModal();
      }
    }

    function closeTermModal() {
      showTermModal = false;
      currentTermName = "";
      currentProjectLimit = null;
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
                  class={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                                  ${
                                    term.isOpen
                                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                                      : "bg-green-50 text-green-600 hover:bg-green-100"
                                  }`}
                >
                  {term.isOpen ? "ปิดฟอร์ม" : "เปิดฟอร์ม"}
                </button>
                <button
                  on:click={() => openTermModalForEdit(term)}
                  disabled={loading}
                  class="px-4 py-2 rounded-lg font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
            จำนวนโครงงานที่รับได้: {term.projectLimit !== undefined ? term.projectLimit : 'ไม่ได้กำหนด'}
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
  