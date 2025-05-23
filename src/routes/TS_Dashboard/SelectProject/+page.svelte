<script>
  import { onMount } from "svelte";
  import {
    doc,
    getDoc,
    updateDoc,
  } from "firebase/firestore";
  import { db } from "$lib/firebase";
  import { goToProject_Details } from "$lib/NavigateWithToken";
  import { dangerToast, successToast, warningToast } from "$lib/customtoast";
  import { getCookie } from "cookies-next";
  import Loading from "$lib/components/loading.svelte";  
  // Initialize Firestore from your firebase config
  //const auth = getAuth();

  let projects = [];
  let filteredProjects = [];
  let loading = true;
  let error = null;
  let selectedProjects = [];
  let userEmail = "";
  let userName = ""; // To store teacher's name
  let saving = false;
  let projectLimit = null; // To store the project limit from openForm

  // Filter variables
  let searchQuery = "";
  let selectedTerm = null; // Will be set by the open form's term

  onMount(async () => {
    try {
      loading = true;
      
      // Get current user info and name from cookie
      userName = getCookie("name") || null; 
      userEmail = getCookie("email") || null;
      
      if (!userEmail) {
        throw new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
      }
      
      // Fetch form data and find the open form
      const formRes = await fetch(`../../api/form-data?isOpen=true`);
      const formDataResponse = await formRes.json();
      if (!formRes.ok) {
        throw new Error(formDataResponse.error || "ไม่สามารถโหลดข้อมูลฟอร์มได้");
      }
      const openForm = formDataResponse.data.find(form => form.isOpen == true);

      if (openForm && openForm.term) {
        selectedTerm = openForm.term; // Set the fixed term
        projectLimit = openForm.projectLimit !== undefined ? Number(openForm.projectLimit) : null; // Get project limit
        
        // Fetch project data for the fixed term
        const projectRes = await fetch(`../../api/project-data?term=${selectedTerm}`);
        const projectDataResponse = await projectRes.json();
        if (!projectRes.ok) {
          throw new Error(projectDataResponse.error || "ไม่สามารถโหลดข้อมูลโครงงานได้");
        }
        
        if (!projectDataResponse.data || !Array.isArray(projectDataResponse.data)) {
          throw new Error("ข้อมูลโครงงานไม่ถูกต้อง");
        }

        // Process projects and check if user is already a director
        // API should already filter by term, so no need for client-side term check here
        projects = projectDataResponse.data.map((project) => {
          const directors = project.directors || [];
          const isDirector = directors.some(director =>  director.email === userEmail);
          return {
            ...project,
            selected: isDirector, // Pre-select if already a director
          };
        });

      } else {
        // No open form or term found
        error = "ไม่พบภาคการศึกษาที่เปิดให้เลือกโครงงาน";
        projects = []; // Ensure projects is empty
        selectedTerm = null; // Ensure selectedTerm is null
      }

      // Apply filters (primarily for search query now)
      applyFilters();

      // Update selected projects list
      updateSelectedProjects();
    } catch (err) {
      console.error("Error loading projects:", err);
      error = err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน กรุณาลองใหม่อีกครั้ง";
      dangerToast(error);
    } finally {
      loading = false;
    }
  });

  // Toggle project selection
  function toggleSelect(project) {
    // For reactivity to work correctly in Svelte, we need to update the entire projects array
    projects = projects.map((p) => {
      if (p.id === project.id) {
        const newSelected = !p.selected;
        //console.log(`Toggling project ${p.id} selection to ${newSelected}`);
        return { ...p, selected: newSelected };
      }
      return p;
    });

    // Also update in filtered projects
    filteredProjects = filteredProjects.map((p) => {
      if (p.id === project.id) {
        return { ...p, selected: !p.selected };
      }
      return p;
    });

    updateSelectedProjects();
  }

  // Update selected projects array
  function updateSelectedProjects() {
    selectedProjects = projects.filter((project) => project.selected);
    //console.log("Selected projects updated:", selectedProjects.length);
    //console.log("Selected project IDs:", selectedProjects.map(p => p.id));
  }

  // Apply filters (search and term)
  function applyFilters() {
    filteredProjects = projects.filter((project) => {
      // Term filter is removed as projects are pre-filtered by the open form's term
      // Search filter (if search query exists)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();

        // Search in project name
        const nameMatch =
          project.project_name_th &&
          project.project_name_th.toLowerCase().includes(query);

        // Search in members
        const membersMatch =
          project.members &&
          project.members.some((member) => member.toLowerCase().includes(query));

        // Search in adviser
        const adviserMatch =
          project.adviser &&
          project.adviser.some((adviser) => 
            (adviser.name && adviser.name.toLowerCase().includes(query)) ||
            (adviser.email && adviser.email.toLowerCase().includes(query))
          );

        // Return true if any of the fields match
        return nameMatch || membersMatch || adviserMatch;
      }

      // If no search query or term matches, include project
      return true;
    });
  }

  // Handle search input changes
  function handleSearch() {
    applyFilters();
  }

  // Save selected projects to user's data and update project directors
  async function saveSelection() {
    if (selectedProjects.length === 0) {
      warningToast("กรุณาเลือกโครงงานอย่างน้อย 1 โครงงาน");
      return;
    }

    // Check against projectLimit
    if (projectLimit !== null && selectedProjects.length > projectLimit) {
      warningToast(`คุณสามารถเลือกโครงงานได้สูงสุด ${projectLimit} โครงงานเท่านั้น`);
      return;
    }

    if (!userName) {
      dangerToast("ไม่พบข้อมูลชื่อผู้ใช้ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    saving = true;

    try {
      loading = true;

      // Get all projects that need updating (both selected and deselected)
      const updatedProjects = projects.map((project) => ({
        id: project.id,
        selected: project.selected,
      }));

      console.log("Projects to update:", updatedProjects);
      
      // Process each project update as a separate operation
      const updatePromises = updatedProjects.map(async (project) => {
        const projectRef = doc(db, "project-approve", project.id);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
          throw new Error(`Project with ID ${project.id} not found`);
        }

        const currentData = projectDoc.data();
        const currentDirectors = currentData.directors || [];
        
        console.log(`Project ${project.id} - Current directors:`, currentDirectors);

        let updatedDirectors = [...currentDirectors]; // Create a copy to modify

        // Find if user is already a director
        const existingDirectorIndex = updatedDirectors.findIndex(
          director => director.email === userEmail
        );

        if (project.selected && existingDirectorIndex === -1) {
          // Add teacher if selected and not already a director
          updatedDirectors.push({
            email: userEmail,
            name: userName
          });
          console.log(`Adding ${userEmail} to project ${project.id}`);
        } else if (!project.selected && existingDirectorIndex !== -1) {
          // Remove teacher if deselected and currently a director
          updatedDirectors.splice(existingDirectorIndex, 1);
          console.log(`Removing ${userEmail} from project ${project.id}`);
        }

        console.log(`Project ${project.id} - Updated directors:`, updatedDirectors);
        
        // Only update if there were changes to the directors
        if (
          JSON.stringify(updatedDirectors) !== JSON.stringify(currentDirectors)
        ) {
          console.log(`Updating project ${project.id} in database`);
          await updateDoc(projectRef, {
            directors: updatedDirectors,
          });
        } else {
          console.log(`No changes for project ${project.id}`);
        }
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Update local state to match what was saved in the database
      projects = projects.map(project => {
        const foundUpdated = updatedProjects.find(up => up.id === project.id);
        if (foundUpdated) {
          return { ...project, selected: foundUpdated.selected };
        }
        return project;
      });
      
      // Update filtered projects too
      filteredProjects = filteredProjects.map(project => {
        const foundUpdated = updatedProjects.find(up => up.id === project.id);
        if (foundUpdated) {
          return { ...project, selected: foundUpdated.selected };
        }
        return project;
      });
      
      // Update selected projects
      updateSelectedProjects();
      
      successToast("บันทึกการเลือกโครงงานเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Error saving selection:", err);
      dangerToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง "+ err);
    } finally {
      saving = false;
      loading = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">เลือกเป็นกรรมการโครงงาน</h1>

  {#if loading}
    <div class="flex justify-center my-12">
      <Loading />
    </div>
  {:else if error}
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
      <p>{error}</p>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-md p-6 mb-6 relative">
      <div class="mb-4">
        <p>อาจารย์: <span class="font-medium">{userName || userEmail}</span></p>
        <p class="mt-2">
          โครงงานที่เลือก: <span class="font-bold"
            >{selectedProjects.length}</span
          > โครงงาน
          {#if projectLimit !== null}
            <span class="text-gray-600 ml-2">
              (เลือกได้สูงสุด: <b class="text-blue-800">{projectLimit}</b> โครงงาน)
            </span>
          {/if}
        </p>
      </div>

      <!-- Filters -->
      <div class="mb-6 space-y-4">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Term filter dropdown -->
          <div class="w-full md:w-1/3">
            <label
              for="term-select"
              class="block text-sm font-medium text-gray-700 mb-1"
              >ภาคการศึกษา</label
            >
            <div
              id="term-select"
              class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border bg-gray-100 cursor-not-allowed"
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

          <!-- Search input -->
          <div class="w-full md:w-2/3">
            <label
              for="search-input"
              class="block text-sm font-medium text-gray-700 mb-1"
              >ค้นหา (ชื่อโครงงาน, สมาชิก, อาจารย์ที่ปรึกษา)</label
            >
            <div class="relative">
              <input
                id="search-input"
                type="text"
                bind:value={searchQuery}
                on:input={handleSearch}
                placeholder="พิมพ์คำค้นหา..."
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 pl-3 pr-10 border"
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
      </div>

      <!-- Project list -->
      <div class="grid gap-4">
        {#if filteredProjects.length === 0}
          <div class="text-center py-8 text-gray-500">
            <p>ไม่พบโครงงานที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        {:else}
          {#each filteredProjects as project (project.id)}
            <div
              role="button"
              class="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 {project.selected
                ? 'bg-blue-50 border-blue-300'
                : ''}"
              on:click={() => toggleSelect(project)}
              tabindex="0"
            >
              <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-medium text-lg text-blue-600 hover:underline cursor-pointer" on:click={() => goToProject_Details(project.id)}>{project.project_name_th}</h3>
                  <p class="text-gray-600 mt-1">
                    ภาคการศึกษา: {project.term || "ไม่ระบุ"}
                  </p>
                  <div class="mt-2">
                    <p class="font-medium">สมาชิก:</p>
                    <ul class="list-disc list-inside ml-4">
                      {#each project.members || [] as member}
                        <li>{member}</li>
                      {/each}
                    </ul>
                  </div>
                  <p class="font-medium mt-3">อาจารย์ที่ปรึกษา: </p>

                  <ul class="list-disc list-inside ml-4">
                    {#each project.adviser as adviser}
                      <li>
                        {adviser.name || "ไม่ระบุ"}
                      </li>
                    {/each}
                  </ul>
              
                  {#if project.directors && project.directors.length > 0}
                    <div class="mt-2">
                      <p class="font-medium">กรรมการ:</p>
                      <ul class="list-disc list-inside ml-4">
                        {#each project.directors as director}
                          <li>{director.name || director.email || "ไม่ระบุ"}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                </div>
                <div class="flex items-center h-6">
                  <!-- Checkbox component that's properly bound to each project's selected state -->
                  <div
                    class="w-5 h-5 rounded border {project.selected
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-400'} flex items-center justify-center"
                  >
                    {#if project.selected}
                      <svg
                        class="w-3 h-3 text-white"
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
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div class="mt-6 flex justify-end absolute top-0 right-4">
        <button
          class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          on:click={saveSelection}
          disabled={saving}
        >
          {#if saving}
            <span
              class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
            ></span>
          {/if}
          บันทึกการเลือก
        </button>
      </div>
    </div>
  {/if}
</div>