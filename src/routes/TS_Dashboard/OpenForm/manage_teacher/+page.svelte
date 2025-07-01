<!-- src/routes/TeacherAssignment.svelte -->
<script>
  import { dangerToast, successToast } from '$lib/customtoast';
  import { onMount } from 'svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import { getrolename } from '$lib/Getrolename';
  import { get } from 'svelte/store';

  let teachersFromUsers = [];
  let teachersFromApi = [];
  let loading = true;
  let editingTeacher = null;
  let editForm = { id:'' ,name: '', email: '' };

  // State for manual teacher addition modal
  let showManualAddModal = false;
  let manualName = '';
  let manualEmail = '';
  let manualAddInProgress = false;

  // State for edit modal
  let showEditModal = false;
  let editInProgress = false;

  let showConfirmModal = false;
  let confirmModalMessage = "";
  let confirmModalOnConfirm = () => {};
  let confirmModalConfirmButtonClass = "bg-blue-600 hover:bg-blue-700 text-white";

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      // Fetch teachers from the 'users' collection
      const usersResponse = await fetch('/api/user?role=teacher,subject_teacher');
      if (usersResponse.ok) {
        teachersFromUsers = (await usersResponse.json());
      } else {
        console.error('Error fetching teachers from users:', usersResponse.status);
      }

      // Fetch teachers from the existing API endpoint
      const apiResponse = await fetch('/api/teacher-data');
      if (apiResponse.ok) {
        teachersFromApi = (await apiResponse.json()).data;
      } else {
        console.error('Error fetching teachers from API:', apiResponse.status);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      loading = false;
    }
  }

  async function addTeacherToApi(teacher) {
    try {
      const response = await fetch('/api/teacher-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teacher.name,
          email: teacher.email,
          id : teacher.id
        }),
      });

      if (response.ok) {
        const newTeacher = (await response.json()).data;

        //console.log(newTeacher );
        teachersFromApi = [...teachersFromApi, newTeacher];
        console.log(teachersFromApi);
        successToast('เพิ่มอาจารย์เรียบร้อยแล้ว');
      } else {
        console.error('Error adding teacher:', response.status);
        dangerToast('เกิดข้อผิดพลาดในการเพิ่มอาจารย์');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      dangerToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  }

  async function deleteTeacher(teacherId) {
    
    confirmModalMessage = `คุณแน่ใจหรือไม่ที่จะลบอาจารย์นี้?`;
    confirmModalConfirmButtonClass = "bg-red-600 hover:bg-red-700 text-white";
    showConfirmModal = true;
    confirmModalOnConfirm = async () => {
        try {
            const response = await fetch(`/api/teacher-data`, {
                method: 'DELETE',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: teacherId }),
            });

                if (response.ok) {
                    teachersFromApi = teachersFromApi.filter(t => t.id !== teacherId);
                    successToast('ลบอาจารย์เรียบร้อยแล้ว');
                } else {
                    console.error('Error deleting teacher:', response.status);
                    dangerToast('เกิดข้อผิดพลาดในการลบอาจารย์' + response.error);
                }
        } catch (error) {
            console.error('Error deleting teacher:', error);
            dangerToast('เกิดข้อผิดพลาดในการลบอาจารย์' + error);
        }finally{
            showConfirmModal = false;
        }
    };
  }

  function startEdit(teacher) {
    editingTeacher = teacher.id;
    editForm = {
        id: teacher.id || '',
      name: teacher.name || '',
      email: teacher.email || ''
    };
    showEditModal = true;
  }

  function cancelEdit() {
    editingTeacher = null;
    editForm = { id :'' ,name: '', email: '' };
    showEditModal = false;
    editInProgress = false;
  }

  async function saveEdit() {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      dangerToast('กรุณากรอกชื่อและอีเมล');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(editForm.email.trim())) {
      dangerToast('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    editInProgress = true;
    try {
      const response = await fetch(`/api/teacher-data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedTeacher = (await response.json()).data;
        teachersFromApi = teachersFromApi.map(t => 
          t.id === editingTeacher ? updatedTeacher : t
        );
        cancelEdit();
        successToast('แก้ไขข้อมูลอาจารย์เรียบร้อยแล้ว');
      } else {
        console.error('Error updating teacher:', response.status);
        dangerToast('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      dangerToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      editInProgress = false;
    }
  }

  function isTeacherAlreadyAdded(teacher) {
    return teachersFromApi.some(apiTeacher => 
      apiTeacher.email === teacher.email || 
      apiTeacher.userId === teacher.id
    );
  }

  function openManualAddModal() {
    manualName = '';
    manualEmail = '';
    manualAddInProgress = false;
    showManualAddModal = true;
  }

  function closeManualAddModal() {
    showManualAddModal = false;
  }

  async function submitManualAddTeacher() {
    if (!manualName.trim() || !manualEmail.trim()) {
      dangerToast('กรุณากรอกชื่อและอีเมล');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(manualEmail.trim())) {
      dangerToast('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    if (teachersFromApi.some(t => t.email === manualEmail.trim())) {
      dangerToast('มีอีเมลนี้ในรายชื่ออาจารย์ที่ได้รับมอบหมายแล้ว');
      return;
    }

    manualAddInProgress = true;
    try {
      const response = await fetch('/api/teacher-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName.trim(),
          email: manualEmail.trim(),
        }),
      });

      if (response.ok) {
        const newTeacher = (await response.json()).data;
        teachersFromApi = [...teachersFromApi, newTeacher];
        successToast('เพิ่มอาจารย์ (ด้วยตนเอง) เรียบร้อยแล้ว');
        closeManualAddModal();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'ไม่สามารถแยกวิเคราะห์ข้อผิดพลาดจากเซิร์ฟเวอร์ได้' }));
        console.error('Error adding teacher manually:', response.status, errorData);
        dangerToast(`เกิดข้อผิดพลาด: ${errorData.message || errorData.error || response.statusText || 'ไม่สามารถเพิ่มอาจารย์ได้'}`);
      }
    } catch (error) {
      console.error('Error adding teacher manually:', error);
      dangerToast('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error.message);
    } finally {
      manualAddInProgress = false;
    }
  }

  // Handle keyboard events for modals
  function handleEditModalKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  }

  function handleManualAddModalKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitManualAddTeacher();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeManualAddModal();
    }
  }
</script>

<svelte:window 
  on:keydown={(e) => {
    if (showEditModal) handleEditModalKeydown(e);
    if (showManualAddModal) handleManualAddModalKeydown(e);
  }}
/>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold text-gray-800">จัดการรายชื่ออาจารย์ (สำหรับแสดงในฟอร์ม)</h1>
    <button on:click={openManualAddModal} class="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
      เพิ่มรายชื่อเอง
    </button>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p class="ml-4 text-lg text-gray-600">กำลังโหลดข้อมูลอาจารย์...</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left side: Teachers from Users Collection -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
          รายชื่ออาจารย์ในระบบ
        </h2>
        <div class="space-y-3">
          {#each teachersFromUsers as teacher (teacher.id)}
            <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-semibold text-gray-800">{teacher.name}</h3>
                  <p class="text-sm text-gray-600">{teacher.email}</p>
                  <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                    {getrolename(teacher.role)}
                  </span>
                </div>
                <button
                  on:click={() => addTeacherToApi(teacher)}
                  disabled={isTeacherAlreadyAdded(teacher)}
                  class="px-4 py-2 rounded-md transition-colors duration-200 {
                    isTeacherAlreadyAdded(teacher)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }"
                >
                  {isTeacherAlreadyAdded(teacher) ? 'เพิ่มแล้ว' : 'เพิ่ม'}
                </button>
              </div>
            </div>
          {:else}
            <div class="text-center py-8">
              <p class="text-gray-500 text-lg">ไม่พบข้อมูลอาจารย์ในระบบ</p>
            </div>
          {/each}
        </div>
      </div>

      <!-- Right side: Teachers from API -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-b-2 border-green-500 pb-2">
          อาจารย์ที่ได้รับมอบหมาย ({teachersFromApi.length} คน)
        </h2>
        <p class="text-sm text-gray-600 mb-4 -mt-4">
          รายชื่ออาจารย์ในส่วนนี้จะถูกนำไปแสดงในหน้าฟอร์มให้นักศึกษาเลือกเป็นที่ปรึกษา
        </p>
        <div class="space-y-3">
          {#each teachersFromApi as teacher (teacher.id)}
            <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-semibold text-gray-800">{teacher.name || 'ไม่ระบุชื่อ'}</h3>
                  <p class="text-sm text-gray-600">{teacher.email || 'ไม่ระบุอีเมล'}</p>
                  {#if teacher.role}
                    <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                      {getrolename(teacher.role)}
                    </span>
                  {/if}
                </div>
                <div class="flex space-x-2">
                  <button
                    on:click={() => startEdit(teacher)}
                    class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
                    title="แก้ไข"
                  >
                    แก้ไข
                  </button>
                  <button
                    on:click={() => deleteTeacher(teacher.id)}
                    class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200"
                    title="ลบ"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          {:else}
            <div class="text-center py-8">
              <p class="text-gray-500 text-lg">ยังไม่มีอาจารย์ที่ได้รับมอบหมาย</p>
              <p class="text-sm text-gray-400 mt-2">เลือกอาจารย์จากรายชื่อด้านซ้ายเพื่อเพิ่ม</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<ConfirmModal 
  bind:show={showConfirmModal} 
  message={confirmModalMessage}
  confirmButtonClass={confirmModalConfirmButtonClass}
  on:confirm={confirmModalOnConfirm}
  on:cancel={() => showConfirmModal = false}
/>

<!-- Edit Teacher Modal -->
{#if showEditModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
    <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" on:click|stopPropagation>
      <h2 class="text-xl font-bold mb-6 text-gray-800">แก้ไขข้อมูลอาจารย์</h2>
      
      <div class="space-y-4">
        <div>
          <label for="editName" class="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล อาจารย์</label>
          <input
            type="text"
            id="editName"
            bind:value={editForm.name}
            placeholder="เช่น นายสมชาย ใจดี"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={editInProgress}
          />
        </div>
        <div>
          <label for="editEmail" class="block text-sm font-medium text-gray-700 mb-1">อีเมล อาจารย์</label>
          <input
            type="email"
            id="editEmail"
            bind:value={editForm.email}
            placeholder="เช่น somchai.j@example.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={editInProgress}
          />
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-8">
        <button
          on:click={cancelEdit}
          disabled={editInProgress}
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          on:click={saveEdit}
          disabled={editInProgress || !editForm.name.trim() || !editForm.email.trim()}
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {#if editInProgress}
            <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            กำลังบันทึก...
          {:else}
            บันทึก
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Manual Add Teacher Modal -->
{#if showManualAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
    <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" on:click|stopPropagation>
      <h2 class="text-xl font-bold mb-6 text-gray-800">เพิ่มรายชื่ออาจารย์เอง</h2>
      
      <div class="space-y-4">
        <div>
          <label for="manualName" class="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล อาจารย์</label>
          <input
            type="text"
            id="manualName"
            bind:value={manualName}
            placeholder="เช่น นายสมชาย ใจดี"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={manualAddInProgress}
          />
        </div>
        <div>
          <label for="manualEmail" class="block text-sm font-medium text-gray-700 mb-1">อีเมล อาจารย์</label>
          <input
            type="email"
            id="manualEmail"
            bind:value={manualEmail}
            placeholder="เช่น somchai.j@example.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={manualAddInProgress}
          />
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-8">
        <button
          on:click={closeManualAddModal}
          disabled={manualAddInProgress}
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          on:click={submitManualAddTeacher}
          disabled={manualAddInProgress || !manualName.trim() || !manualEmail.trim()}
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {#if manualAddInProgress}
            <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            กำลังบันทึก...
          {:else}
            บันทึก
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}