<script>
  import { onMount } from "svelte";
  import {
    doc,
    getDoc,
    updateDoc,
    deleteField,
    setDoc,
  } from "firebase/firestore";
  import { db } from "$lib/firebase";
  import { dangerToast, successToast, warningToast } from "$lib/customtoast";
  import { getCookie } from "cookies-next";
  import Loading from "$lib/components/loading.svelte";
  import HelpModal from "$lib/components/HelpModal.svelte";
  import MemberTooltip from "$lib/components/memberTooltip.svelte";
  import TeacherTooltip from "$lib/components/teacherTooltip.svelte";
  import { goto } from "$app/navigation";
  let projects = [];
  let filteredProjects = [];
  let loading = true;
  let error = null;
  let selectedProjects = [];
  let userEmail = "";
  let userName = "";
  let saving = false;
  let projectLimit = null;

  let searchQuery = "";
  let selectedTerm = null;

  let showHelpModal = false;
  const HELP_MODAL_STORAGE_KEY = "selectProjectAdviserHelpShown_v3";

  onMount(async () => {
    try {
      loading = true;

      userName = getCookie("name") || null;
      userEmail = getCookie("email") || null;

      if (!userEmail) {
        throw new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
      }

      const formRes = await fetch(`../../api/form-data?isOpen=true`);
      const formDataResponse = await formRes.json();
      if (!formRes.ok) {
        throw new Error(formDataResponse.error || "ไม่สามารถโหลดข้อมูลฟอร์มได้");
      }
      const openForm = formDataResponse.data.find((form) => form.isOpen == true);

      if (openForm && openForm.term) {
        selectedTerm = openForm.term;
        projectLimit =
          openForm.projectLimit !== undefined ? Number(openForm.projectLimit) : null;

        const projectRes = await fetch(`../../api/project-data?term=${selectedTerm}`);
        const projectDataResponse = await projectRes.json();
        if (!projectRes.ok) {
          throw new Error(
            projectDataResponse.error || "ไม่สามารถโหลดข้อมูลโครงงานได้"
          );
        }

        if (!projectDataResponse.data || !Array.isArray(projectDataResponse.data)) {
          throw new Error("ข้อมูลโครงงานไม่ถูกต้อง");
        }

        // Filter out projects where the current user is an adviser
        const availableProjects = projectDataResponse.data.filter(
          (project) => {
            const advisers = project.adviser || [];
            return !advisers.some((adviser) => adviser.email === userEmail);
          }
        );

        projects = availableProjects.map((project) => {
          const directors = project.directors || [];
          const isDirector = directors.some(
            (director) => director.email === userEmail
          );
          return {
            ...project,
            selected: isDirector,
          };
        });
      } else {
        error = "ไม่พบภาคการศึกษาที่เปิดให้เลือกโครงงาน";
        projects = [];
        selectedTerm = null;
      }

      applyFilters();

      updateSelectedProjects();
    } catch (err) {
      console.error("Error loading projects:", err);
      error =
        err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน กรุณาลองใหม่อีกครั้ง";
      dangerToast(error);
    } finally {
      loading = false;
      if (
        typeof localStorage !== "undefined" &&
        !localStorage.getItem(HELP_MODAL_STORAGE_KEY)
      ) {
        showHelpModal = true;
      }
    }
  });

  function closeHelpModalAndMarkAsSeen() {
    showHelpModal = false;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(HELP_MODAL_STORAGE_KEY, "true");
    }
  }

  function openHelpModalManually() {
    showHelpModal = true;
  }

  function toggleSelect(project) {
    projects = projects.map((p) => {
      if (p.id === project.id) {
        const newSelected = !p.selected;
        return { ...p, selected: newSelected };
      }
      return p;
    });

    filteredProjects = filteredProjects.map((p) => {
      if (p.id === project.id) {
        return { ...p, selected: !p.selected };
      }
      return p;
    });

    updateSelectedProjects();
  }

  function updateSelectedProjects() {
    selectedProjects = projects.filter((project) => project.selected);
  }

  function applyFilters() {
    filteredProjects = projects.filter((project) => {
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();

        const nameMatch =
          project.project_name_th &&
          project.project_name_th.toLowerCase().includes(query);

        const membersMatch =
          project.members &&
          project.members.some((member) => member.toLowerCase().includes(query));

        const adviserMatch =
          project.adviser &&
          project.adviser.some(
            (adviser) =>
              (adviser.name && adviser.name.toLowerCase().includes(query)) ||
              (adviser.email && adviser.email.toLowerCase().includes(query))
          );

        return nameMatch || membersMatch || adviserMatch;
      }

      return true;
    });
  }

  function handleSearch() {
    applyFilters();
  }

  async function saveSelection() {
  if (projectLimit !== null && selectedProjects.length > projectLimit) {
    warningToast(
      `คุณสามารถเลือกโครงงานได้สูงสุด ${projectLimit} โครงงานเท่านั้น`
    );
    return;
  }

  if (!userName) {
    dangerToast("ไม่พบข้อมูลชื่อผู้ใช้ กรุณาลองใหม่อีกครั้ง");
    return;
  }

  saving = true;

  try {
    loading = true;

    const updatedProjects = projects.map((project) => ({
      id: project.id,
      selected: project.selected,
    }));

    const updatePromises = updatedProjects.map(async (project) => {
      const projectRef = doc(db, "project-approve", project.id);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        console.warn(
          `Project with ID ${project.id} not found in project-approve. Skipping director update.`
        );
      } else {
        const currentData = projectDoc.data();
        const currentDirectors = currentData.directors || [];

        let updatedDirectors = [...currentDirectors];

        const existingDirectorIndex = updatedDirectors.findIndex(
          (director) => director.email === userEmail
        );

        if (project.selected && existingDirectorIndex === -1) {
          updatedDirectors.push({
            email: userEmail,
            name: userName,
          });
        } else if (!project.selected && existingDirectorIndex !== -1) {
          updatedDirectors.splice(existingDirectorIndex, 1);
        }

        if (JSON.stringify(updatedDirectors) !== JSON.stringify(currentDirectors)) {
          await updateDoc(projectRef, {
            directors: updatedDirectors,
          });
        }
      }

      const availabilityDocRef = doc(db, "project-availability", project.id);
      if (project.selected) {
        await setDoc(
          availabilityDocRef,
          {
            usersAvailability: {
              [userEmail]: { name: userName },
            },
          },
          { merge: true }
        );
      } else {
        try {
          const availabilityDocSnap = await getDoc(availabilityDocRef);
          if (availabilityDocSnap.exists()) {
            await updateDoc(availabilityDocRef, {
              [`usersAvailability.${userEmail}`]: deleteField(),
            });
          }
        } catch (e) {
          console.warn(
            `Could not update project-availability for ${project.id} to remove ${userEmail}. Error:`,
            e
          );
        }
      }
    });

    await Promise.all(updatePromises);

    // Update local state with directors changes after successful save
    projects = projects.map((project) => {
      const foundUpdated = updatedProjects.find((up) => up.id === project.id);
      if (foundUpdated) {
        let updatedDirectors = [...(project.directors || [])];
        
        const existingDirectorIndex = updatedDirectors.findIndex(
          (director) => director.email === userEmail
        );
        
        if (foundUpdated.selected && existingDirectorIndex === -1) {
          // Add current user as director
          updatedDirectors.push({
            email: userEmail,
            name: userName,
          });
        } else if (!foundUpdated.selected && existingDirectorIndex !== -1) {
          // Remove current user from directors
          updatedDirectors = updatedDirectors.filter(
            (director) => director.email !== userEmail
          );
        }
        
        return { 
          ...project, 
          selected: foundUpdated.selected,
          directors: updatedDirectors
        };
      }
      return project;
    });

    filteredProjects = filteredProjects.map((project) => {
      const foundUpdated = updatedProjects.find((up) => up.id === project.id);
      if (foundUpdated) {
        let updatedDirectors = [...(project.directors || [])];
        
        const existingDirectorIndex = updatedDirectors.findIndex(
          (director) => director.email === userEmail
        );
        
        if (foundUpdated.selected && existingDirectorIndex === -1) {
          // Add current user as director
          updatedDirectors.push({
            email: userEmail,
            name: userName,
          });
        } else if (!foundUpdated.selected && existingDirectorIndex !== -1) {
          // Remove current user from directors
          updatedDirectors = updatedDirectors.filter(
            (director) => director.email !== userEmail
          );
        }
        
        return { 
          ...project, 
          selected: foundUpdated.selected,
          directors: updatedDirectors
        };
      }
      return project;
    });

    updateSelectedProjects();

    successToast("บันทึกการเลือกโครงงานเรียบร้อยแล้ว");
  } catch (err) {
    console.error("Error saving selection:", err);
    dangerToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง " + err);
  } finally {
    saving = false;
    loading = false;
  }
}

function goToProject_Details(project) {
        goto(`/cpe02/data/term/${project.term}/project-detail/${project.id}`);
    }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-extrabold text-gray-900">เลือกเป็นกรรมการโครงงาน</h1>
    <button
      on:click={openHelpModalManually}
      class="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 py-2 px-3 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
      title="แสดงคำแนะนำ"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="w-4 h-4"
        ><path
          fill-rule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
          clip-rule="evenodd"
        /></svg
      >
      คำแนะนำ
    </button>
  </div>

  {#if loading}
    <div class="flex justify-center my-12">
      <Loading />
    </div>
  {:else if error}
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
      <p>{error}</p>
    </div>
  {:else}
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6 relative">
      <div class="mb-6 border-b pb-4">
        <p class="text-lg text-gray-700">
          อาจารย์: <span class="font-semibold text-gray-900"
            >{userName || userEmail}</span
          >
        </p>
        <p class="mt-2 text-lg text-gray-700">
          โครงงานที่เลือก:
          <span class="font-bold text-blue-700"
            >{selectedProjects.length}</span
          >
          โครงงาน
          {#if projectLimit !== null}
            <span class="text-gray-500 ml-2">
              (เลือกได้สูงสุด: <b class="text-blue-800">{projectLimit}</b> โครงงาน)
            </span>
          {/if}
        </p>
      </div>

      <div class="mb-8 space-y-4 md:space-y-0 md:flex md:gap-6">
        <div class="w-full md:w-1/3">
          <label for="term-select" class="block text-sm font-medium text-gray-700 mb-2"
            >ภาคการศึกษา</label
          >
          <div
            id="term-select"
            class="block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 cursor-not-allowed"
          >
            {#if selectedTerm}
              {selectedTerm}
            {:else}
              {#if loading}
                <span class="text-gray-500">กำลังโหลด...</span>
              {:else}
                <span class="text-gray-500">ไม่มีภาคการศึกษาที่เปิด</span>
              {/if}
            {/if}
          </div>
        </div>

        <div class="w-full md:w-2/3">
          <label for="search-input" class="block text-sm font-medium text-gray-700 mb-2"
            >ค้นหา (ชื่อโครงงาน, สมาชิก, อาจารย์ที่ปรึกษา)</label
          >
          <div class="relative">
            <input
              id="search-input"
              type="text"
              bind:value={searchQuery}
              on:input={handleSearch}
              placeholder="พิมพ์คำค้นหา..."
              class="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-base py-2 pl-3 pr-10"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                class="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg shadow-sm border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >ลำดับ</th
              >
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >ชื่อโครงงาน</th
              >
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >สมาชิก</th
              >
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >อาจารย์ที่ปรึกษา</th
              >
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >กรรมการ</th
              >
              <th
                scope="col"
                class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-slate-200"
                >เลือก</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#if filteredProjects.length === 0}
              <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                  ไม่พบโครงงานที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            {:else}
              {#each filteredProjects as project,i (project.id)}
                <tr
                  class="hover:bg-gray-50 transition-colors duration-200 {project.selected
                    ? 'bg-blue-50'
                    : ''}"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="text-sm text-gray-900">{i + 1}</span>
                  </td>
                  <td class="px-6 py-4">
                    <h3
                      class="text-sm text-blue-600 hover:underline cursor-pointer"
                      on:click={() => goToProject_Details(project)}
                    >
                      {project.project_name_th}
                    </h3>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-700 flex items-center space-x-1">
                        <span>{project.members?.[0] || 'N/A'}</span>
                        <MemberTooltip members={project.members} />
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-700 flex items-center space-x-1">
                        <span>{project.adviser?.[0]?.name || 'N/A'}</span>
                        <TeacherTooltip members={project.adviser} />
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    {#if project.directors && project.directors.length > 0}
                      <div class="text-sm text-gray-700 flex items-center space-x-1">
                        <span>{project.directors?.[0]?.name || 'N/A'}</span>
                        <TeacherTooltip members={project.directors} />
                    </div>
                    {:else}
                      <span class="text-gray-500 text-sm">ยังไม่มีกรรมการ</span>
                    {/if}
                  </td>
                  <td class="whitespace-nowrap bg-slate-100 h-full grid place-content-center py-4">
                    <div
                      role="button"
                      tabindex="0"
                      on:click={() => toggleSelect(project)}
                      class="flex items-center justify-center w-6 h-6 rounded border cursor-pointer {project.selected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-400'}"
                    >
                      {#if project.selected}
                        <svg
                          class="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>

      <div class="mt-8 flex justify-end">
        <button
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          on:click={saveSelection}
          disabled={saving}
        >
          {#if saving}
            <span
              class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
            ></span>
          {/if}
          บันทึกการเลือก
        </button>
      </div>
    </div>
  {/if}
</div>

<HelpModal bind:showModal={showHelpModal} title="วิธีการใช้งานระบบ" onClose={() => (showHelpModal = false)}>
  <h3 class="text-lg font-semibold text-blue-600 mb-2">สำหรับอาจารย์ที่ปรึกษา:</h3>
  <p class="mb-3 text-gray-700">
    หน้านี้จะไม่แสดงโครงงานที่ท่านเป็นอาจารย์ที่ปรึกษาอยู่แล้ว
    ท่านสามารถเลือกเป็น<strong>กรรมการสอบ</strong>ให้กับโครงงานอื่นๆ ที่ท่านสนใจ
  </p>
  <h3 class="text-lg font-semibold text-gray-700 mb-2">หน้านี้ใช้สำหรับ:</h3>
  <p class="text-gray-700">
    การเลือกเป็น<strong>กรรมการสอบ</strong>ให้กับโครงงานอื่นๆ ที่ท่านสนใจ หรือโครงงานที่ท่านไม่ได้เป็นอาจารย์ที่ปรึกษา
    เพื่อเข้าร่วมการประเมินและให้คะแนนโครงงานเหล่านั้น
  </p>

  <div class="mt-8 text-right">
    <button
      on:click={closeHelpModalAndMarkAsSeen}
      class="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium py-2 px-3 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
    >
      รับทราบ ไม่ต้องแสดงอีก
    </button>
  </div>
</HelpModal>

<style>
  /* You can add specific styles here if needed, but TailwindCSS handles most of it */
</style>