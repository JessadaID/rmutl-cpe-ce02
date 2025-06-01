<!-- src/routes/TeacherAssignment.svelte -->
<script>
  import { dangerToast, successToast } from '$lib/customtoast';
  import { onMount } from 'svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let teachersFromUsers = [];
  let teachersFromApi = [];
  let loading = true;
  let editingTeacher = null;
  let editForm = { id:'' ,name: '', email: '' };


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
      const usersResponse = await fetch('/api/user?role=teachersubject_teacher');
      if (usersResponse.ok) {
        teachersFromUsers = (await usersResponse.json()).data;
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
        alert('เพิ่มอาจารย์เรียบร้อยแล้ว');
      } else {
        console.error('Error adding teacher:', response.status);
        alert('เกิดข้อผิดพลาดในการเพิ่มอาจารย์');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
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
  }

  function cancelEdit() {
    editingTeacher = null;
    editForm = { id :'' ,name: '', email: '' };
  }

  async function saveEdit(teacherId) {
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
          t.id === teacherId ? updatedTeacher : t
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
    }
  }

  function isTeacherAlreadyAdded(teacher) {
    return teachersFromApi.some(apiTeacher => 
      apiTeacher.email === teacher.email || 
      apiTeacher.userId === teacher.id
    );
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8 text-center text-gray-800">ระบบจัดการอาจารย์</h1>

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
                    {teacher.role}
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
        <div class="space-y-3">
          {#each teachersFromApi as teacher (teacher.id)}
            <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              {#if editingTeacher === teacher.id}
                <!-- Edit Mode -->
                <div class="space-y-3">
                  <input
                    bind:value={editForm.name}
                    placeholder="ชื่อ"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    bind:value={editForm.email}
                    placeholder="อีเมล"
                    type="email"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div class="flex space-x-2">
                    <button
                      on:click={() => saveEdit(teacher.id)}
                      class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors duration-200"
                    >
                      บันทึก
                    </button>
                    <button
                      on:click={cancelEdit}
                      class="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              {:else}
                <!-- View Mode -->
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="font-semibold text-gray-800">{teacher.name || 'ไม่ระบุชื่อ'}</h3>
                    <p class="text-sm text-gray-600">{teacher.email || 'ไม่ระบุอีเมล'}</p>
                    {#if teacher.role}
                      <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                        {teacher.role}
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
              {/if}
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