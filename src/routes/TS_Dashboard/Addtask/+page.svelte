<script>
    import { onMount } from "svelte";
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import { dangerToast, successToast } from "$lib/customtoast";

    // Variables
    let terms = [];
    let term = "";
    let projects = [];
    let selectedProject = null; // ตัวแปรสำหรับเก็บโปรเจกต์ที่ถูกเลือก
    let title = "";
    let description = "";
    let dueDate = "";
    let projectCount = 0;
    let isEditing = false;
    let isLoading = false;

    // Confirm Modal State
    let showDeleteConfirmModal = false;
    let projectToDelete = null; 
    let deleteConfirmMessage = "";
  
    async function fetchProjects() {
    if (term) {
      try {
        const task_respond = await fetch("/api/tasks-data?term=" + term, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const task_data = await task_respond.json();
        projects = task_data.data;
        projects.sort((a, b) => a.index - b.index);
  
        projectCount = projects.length; // นับจำนวนโปรเจกต์ทั้งหมด
      } catch (error) {
        console.error("Error fetching projects: ", error);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
      }
    }
  }
  
    // ฟังก์ชันสำหรับแสดง Modal ยืนยันการลบ
    function requestDeleteProject(project) {
      projectToDelete = project;
      deleteConfirmMessage = `คุณแน่ใจหรือไม่ว่าต้องการลบงาน "${project.title}"? การกระทำนี้ไม่สามารถย้อนกลับได้`;
      showDeleteConfirmModal = true;
    }

    // ฟังก์ชันยืนยันการลบโปรเจกต์ (หลังจากคลิกยืนยันใน Modal)
    async function confirmDeleteProject() {
      if (!projectToDelete) return;

      

      try {
        isLoading = true;
        const Delete_Task = await fetch("/api/tasks-data", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: projectToDelete.id,
        }),
      });

      const Delete_Task_data = await Delete_Task.json();
        if (!Delete_Task.ok) {
          dangerToast("ไม่สามารถลบข้อมูลได้ : " + Delete_Task_data.error);
          throw new Error(Delete_Task_data.error || "Failed to delete task");
        }else{
          successToast("ลบงานสำเร็จ");
        }
        fetchProjects(); // รีเฟรชข้อมูล

        if (selectedProject && selectedProject.id === projectToDelete.id) {
          resetForm(); // ถ้างานที่กำลังแก้ไขถูกลบ ให้รีเซ็ตฟอร์ม
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
        dangerToast("เกิดข้อผิดพลาดในการลบข้อมูล");
      } finally {
        isLoading = false;
        projectToDelete = null; // เคลียร์ค่าหลังจากดำเนินการ
        showDeleteConfirmModal = false; // ปิด Modal
      }
    }
    async function saveProject() {
    isLoading = true;  // ตั้งค่าสถานะเป็นกำลังโหลด
  
    if(term === "") {
      alert("กรุณาเลือกภาคการศึกษา");
      isLoading = false;
      return;
    }else if (!title || !description || !dueDate) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        isLoading = false;
        return;
    }else if (dueDate < new Date().toISOString().split("T")[0]) {
        alert("กรุณาเลือกวันที่ใหม่กว่าวันปัจจุบัน");
        isLoading = false;
        return;
    }else{
      try {
      if (selectedProject) {
        // หากเลือกโปรเจกต์แล้วให้ทำการอัปเดต
        const Edit_Task = await fetch("/api/tasks-data", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedProject.id,
            title,
            description,
            dueDate,
            index: projectCount,
            term,
          }),
        });
        const Edit_Task_data = await Edit_Task.json();
        if (!Edit_Task.ok) {
          dangerToast("ไม่สามารถแก้ไขข้อมูลได้ : " + Edit_Task_data.error);
          throw new Error(Edit_Task_data.error || "Failed to update task");
        }else{
          successToast("แก้ไขข้อมูลงานสำเร็จ");
        }
      } else {
        // หากไม่ได้เลือกโปรเจกต์ ให้เพิ่มข้อมูลใหม่ (ใช้ auto ID)
        const Add_Task = await fetch("/api/tasks-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            dueDate,
            index: projectCount ,
            term,
          }),
        });
        const Add_Task_data = await Add_Task.json();
        if (!Add_Task.ok) {
          dangerToast("ไม่สามารถเพิ่มข้อมูลได้ : " + Add_Task_data.error);
          throw new Error(Add_Task_data.error || "Failed to add task");
        }else{
          successToast("เพิ่มงานใหม่สำเร็จ");
        }
      }
    } catch (error) {
      console.error("Error saving project: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      // รีเฟรชข้อมูลและเคลียร์ฟอร์ม
      fetchProjects();
      resetForm();
      isLoading = false;  // ตั้งค่าสถานะโหลดเป็น false
    }
    }
  }
    // Load initial data (optional, if you want to load data on page load)
    onMount(() => {
      fetchProjects();
    });
  
    // ฟังก์ชันเมื่อคลิกที่รายการ
    function editProject(project) {
      selectedProject = project; // เก็บโปรเจกต์ที่ถูกเลือก
      title = project.title;
      description = project.description;
      dueDate = project.dueDate;
      isEditing = true; // ตั้งค่าเป็นโหมดแก้ไข
    }
  
    function resetForm() {
      selectedProject = null; // เคลียร์โปรเจกต์ที่เลือก
      title = "";
      description = "";
      dueDate = "";
      isEditing = false; // รีเซ็ตเป็นโหมดเพิ่มงาน
    }
  
  
      async function fetchTerms() {
          try {
            isLoading = true; // ตั้งค่าสถานะโหลดเป็น true
            const forms_data = await fetch("/api/form-data", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            })
            const forms_data_response = await forms_data.json();
            terms = forms_data_response.data;
            if (!forms_data.ok) {
              dangerToast("ไม่สามารถดึงข้อมูลเทอมได้ : " + forms_data_response.error);
              throw new Error(forms_data_response.error || "Failed to fetch terms");
            }
          } catch (error) {
              console.error("Error fetching terms: ", error);
              alert("เกิดข้อผิดพลาดในการดึงข้อมูลเทอม");
          } finally {
              isLoading = false; // ตั้งค่าสถานะโหลดเป็น false
          }
      }
  
      onMount(() => {
          fetchTerms();
      });
  </script>
  <div class="container mx-auto px-4 max-w-6xl">
    <div class="mb-5 p-6 bg-white rounded-lg shadow-lg">
      <label for="term-select" class="block text-xl font-semibold text-gray-800 mb-3">
          เลือกภาคการศึกษา:
      </label>
      <select
          id="term-select"
          bind:value={term}
          on:change={fetchProjects}
          class="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-700 text-base"
      >
          <option value="" disabled selected>-- กรุณาเลือกภาคการศึกษา --</option>
          {#each terms as termOption}
              <option value={termOption.term}>{termOption.term}</option>
          {/each}
      </select>
    </div>
  
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- คอลัมน์ซ้าย: รายการงาน -->
      <div class="lg:w-1/3 p-6 bg-white rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-b border-gray-200 pb-3">รายการงาน ({projectCount})</h2>
        {#if projects.length > 0}
          <ul class="space-y-4">
            {#each projects as project}
              <li
                on:click={() => editProject(project)}
                class="p-4 border border-gray-200 rounded-lg hover:bg-sky-50 hover:shadow-md cursor-pointer transition-all duration-150 ease-in-out"
                class:selected-task={selectedProject && selectedProject.id === project.id}
              >
            
                <h3 class="font-semibold text-slate-700 text-lg">{project.title}</h3>
                <p class="text-gray-600 text-sm my-1 truncate" title={project.description}>คำอธิบาย: {project.description}</p>
                <p class="text-gray-500 text-sm">กำหนดส่ง: {project.dueDate}</p>
                <div class="mt-3 flex justify-end">
                  <button
                    on:click|stopPropagation={() => requestDeleteProject(project)}
                    class="text-red-500 hover:text-red-800 text-sm font-medium py-1 px-5 rounded-md hover:bg-red-100 transition-colors duration-150"
                    disabled={isLoading}
                  >
                    ลบ
                  </button>
                </div>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="text-center py-10">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">{term ? 'ไม่พบงานในภาคการศึกษานี้' : 'กรุณาเลือกภาคการศึกษา'}</h3>
            <p class="mt-1 text-sm text-gray-500">
              {term ? 'ลองเพิ่มงานใหม่ หรือเลือกภาคการศึกษาอื่น' : 'เลือกภาคการศึกษาเพื่อแสดงรายการงาน'}
            </p>
          </div>
        {/if}
      </div>
  
      <!-- คอลัมน์ขวา: ฟอร์มจัดการข้อมูล -->
      <div class="lg:w-2/3 p-6 bg-white rounded-lg shadow-lg">
        <div class="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
            <h2 class="text-2xl font-semibold text-gray-800">
              {isEditing ? "แก้ไขงาน" : "เพิ่มงานใหม่"}
            </h2>
            <button
              type="button"
              on:click={resetForm}
              class="text-sm py-2 px-4 rounded-md font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-150 disabled:opacity-50"
              disabled={isLoading}
            >
              {isEditing ? 'ยกเลิกการแก้ไข' : 'ล้างฟอร์ม'}
            </button>
        </div>

        <form on:submit|preventDefault={saveProject} class="space-y-4">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">หัวข้อ:</label>
            <input
              id="title"
              type="text"
              bind:value={title}
              placeholder="เช่น งานนำเสนอความคืบหน้าครั้งที่ 1"
              class="w-full p-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-700"
              required
            />
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย:</label>
            <textarea
              id="description"
              bind:value={description}
              placeholder="กรอกรายละเอียดของงาน เช่น ขอบเขตงานที่ต้องส่ง, รูปแบบการนำเสนอ"
              rows="4"
              class="w-full p-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-700"
              required
            ></textarea>
          </div>
          <div>
            <label for="dueDate" class="block text-sm font-medium text-gray-700 mb-1">กำหนดส่ง:</label>
            <input
              id="dueDate"
              type="date"
              bind:value={dueDate}
              class="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-700"
              required
            />
          </div>
          <div class="flex justify-end pt-2">
            <button
              type="submit"
              class="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors duration-150 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {#if isLoading}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังบันทึก...
              {:else}
                {isEditing ? "บันทึกการแก้ไข" : "เพิ่มงานใหม่"}
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <ConfirmModal
    bind:show={showDeleteConfirmModal}
    title="ยืนยันการลบงาน"
    message={deleteConfirmMessage}
    confirmButtonText="ยืนยันการลบ"
    confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
    on:confirm={confirmDeleteProject}
    on:cancel={() => {
      showDeleteConfirmModal = false;
      projectToDelete = null;
    }}
  />

  <style>
    .selected-task {
      background-color: theme('colors.sky.100');
      border-color: theme('colors.sky.400');
      box-shadow: theme('boxShadow.lg');
    }
  </style>
  