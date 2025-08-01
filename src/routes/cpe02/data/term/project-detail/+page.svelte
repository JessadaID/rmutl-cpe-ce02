<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation'; // Import goto for navigation
    import {
      collection,
      query,
      where,
      getDocs,
      doc,
      getDoc,
      deleteDoc,
    } from "firebase/firestore";
    import { ref, deleteObject } from 'firebase/storage';
    import { db, storage } from "$lib/firebase.js";
    import { checkAuthStatus } from "$lib/auth"; // Assuming this returns user info or null
    import { dangerToast, successToast, warningToast } from "$lib/customtoast";
    import Loading from "$lib/components/loading.svelte";
    import { getCookie } from 'cookies-next';
    import Process from "./Process.svelte"; // Adjust the import path as necessary
    import { verifyJWT ,createJWT } from "$lib/jwt"; // Adjust the import path as necessary
  import StudentSelect from './student_select.svelte';
  import ProjectScore from './Project_score.svelte';
  
    let userEmail = null; // Store user email from auth check
    let project = null;
    let currentProject = null; // Current version of project
    let projectVersions = []; // Array to store all versions
    let selectedVersion = 'current'; // Track which version is selected
    let isNotFound = false;
    let role = ""; // Assuming role comes from auth check or another source
    let isLoading = true; // Start loading initially
    let isLoadingVersions = false; // Loading state for versions
    let isDeleting = false; // Specific loading state for delete action
    let can_edit = false; // This should likely be determined based on role/email
    let can_edit_tasks = false; // Renamed for clarity (plural tasks)
    let status = []; // Initialize as empty array
    let termTasks = []; // Renamed to avoid conflict with potential 'Task' type/component name
    let visibleStates = [];
    let comment = []; // Initialize as empty array
    let showModal = false;
    let selectedImage = null;
    let projectId = null;
    let showTask = false; // Control visibility of task section
      
    // New state variables for clarity within the right panel
    let shouldShowProcessComponent = false;
    let canViewDirectorScores = false;
    let activeTaskView = ''; // 'process' or 'scores', determines which view is active in the right panel

    let activeMainView = 'current'; // 'current' or 'previous_version'

    let form_data ;
    // Function to open image modal
    function openImageModal(image) {
      selectedImage = image;
      showModal = true;
    }
  
    // Function to navigate to edit page
    async function goToEditPage(projectId) {
      if (checkAuthStatus()) {

				const payload = { projectId };
				const token = await createJWT(payload);
				goto(`./project-detail/edit?token=${token}`); // Use relative path
		
      } else {
        console.log('User is not authenticated, redirecting to login.');
        warningToast('กรุณาเข้าสู่ระบบก่อนดูรายละเอียดโครงงาน');
      }
    }
    
        // Function to load project versions
   async function loadProjectVersions() {
      if (!projectId) return;

      isLoadingVersions = true;
      try {
        const versionsRef = collection(db, "project-approve", projectId, "project_versions");
        //const form_respond = await fetch("/api/form-data?term="+project.term);
        const form_respond = await fetch(`/api/form-data/${project.term}`);
        
        form_data = (await form_respond.json()).data;
        //console.log("Form Data:", form_data);
        //console.log("Form Data:", form_data);

        const versionsSnapshot = await getDocs(versionsRef);

        projectVersions = versionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        //console.log('Project Versions:', projectVersions);

        //console.log(projectVersions);
      } catch (error) {
        //console.error("Error loading project versions:", error);
        warningToast("เกิดข้อผิดพลาดในการโหลดประวัติเวอร์ชัน: " + error.message);
      } finally {
        isLoadingVersions = false;
      }
    }


    // Function to select a version to display
    function selectVersion(versionId) {
      activeMainView = versionId;
      selectedVersion = versionId;
      if (versionId === 'current') {
        project = currentProject;
      } else {
        const selectedVersionData = projectVersions[0];
        if (selectedVersionData) {
          project = selectedVersionData;
        }
      }
      // Update task-related data when version changes
      updateTaskData();
    }

    // Function to update task-related data when version changes
    function updateTaskData() {
      if (shouldShowProcessComponent && project) {
        // Initialize status and comment arrays based on selected version
        status = termTasks.map((_, index) => project.Tasks?.[index]?.status || "");
        comment = termTasks.map((_, index) => project.Tasks?.[index]?.comment || "");
      } else {
        status = [];
        comment = [];
      }
    }


    onMount(async () => {
      isLoading = true;
      const token = $page.url.searchParams.get('token');
      if (!token) {
        console.error('No token found in URL');
        dangerToast('ไม่พบข้อมูล');
        goto('/cpe02/data'); // Redirect to login page
        return; // Stop further execution
      }

      try {
        const payload = await verifyJWT(token);
        projectId = payload.projectId; // Extract term from payload
        //console.log('Decoded payload:', payload);
      } catch (err) {
        console.error('Invalid or expired token:', err);
        dangerToast('ข้อมูลภาคการศึกษาไม่ถูกต้อง หรือหมดอายุ');
        goto('/cpe02/data'); // Redirect to login page
        return; // Stop further execution
      }


      try {
        // Check Auth Status and get user info
        if (checkAuthStatus()) {
          userEmail = getCookie("email");
          role = getCookie("role");// Make sure checkAuthStatus provides role if needed
          //console.log(userEmail,role)
        } else {
           // Handle case where user is not logged in, maybe redirect or show limited view
           console.warn("User not authenticated.");
           // Optionally redirect: goto('/login');
        }
  
        // Fetch project data
        const projectRef = doc(db, "project-approve", projectId);
        const projectSnap = await getDoc(projectRef);
  
        if (projectSnap.exists()) {
          project = projectSnap.data();
          currentProject = projectSnap.data();
          can_edit = role === 'admin' || (userEmail && project.email === userEmail);
  
          // Determine if the user can edit tasks (admin or advisor for this project)
          const isAdvisor = project.adviser && project.adviser.some(adv => adv.email === userEmail);
          can_edit_tasks = role === 'admin' || isAdvisor;

          // Determine if the Process component (term tasks) should be shown and its data loaded
          shouldShowProcessComponent = can_edit_tasks || project.email === userEmail;

          // Determine if the Director Scores section should be shown
          const hasDirectorData = project.directors && Array.isArray(project.directors) && project.directors.length > 0;
          canViewDirectorScores = hasDirectorData && (
            role === 'admin' ||
            project.email === userEmail ||
            (userEmail && project.directors.some(d => d.email === userEmail))
          );
          
          // Overall visibility of the right-hand column
          showTask = shouldShowProcessComponent || canViewDirectorScores; 

          if (shouldShowProcessComponent){
            const taskQuery = query(
              collection(db, "Task"),
              where("term", "==", project.term)
            );
            const querySnapshot = await getDocs(taskQuery);
            termTasks = querySnapshot.docs
              .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
              .sort((a, b) => a.index - b.index);
    
            // Initialize visibility states for Process component
            visibleStates = Array(termTasks.length).fill(false);

            // Initialize status and comment arrays based on fetched tasks and project data
            status = termTasks.map((_, index) => project.Tasks?.[index]?.status || "");
            comment = termTasks.map((_, index) => project.Tasks?.[index]?.comment || "");
          } else {
            // If not showing tasks, ensure status and comment are empty
            status = [];
            comment = [];
          }

          await loadProjectVersions();

          // Set the default active view for the right panel
          if (shouldShowProcessComponent) {
            activeTaskView = 'process';
          } else if (canViewDirectorScores) {
            activeTaskView = 'scores';
          } 
          
  
        } else {
          console.error("Project not found in project-approve");
          isNotFound = true;
          dangerToast("ไม่พบข้อมูลโครงงานที่ระบุ");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        dangerToast("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message);
        isNotFound = true; // Assume not found on error as well
      } finally {
        isLoading = false;
      }
    });
  
    async function deleteProject(id) {
      // Re-check auth status just before sensitive action
      if (role !== 'admin' && userEmail !== project?.email) {
          dangerToast("คุณไม่มีสิทธิ์ในการลบข้อมูลนี้");
          return;
      }
  
      if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโครงงานนี้และข้อมูลที่เกี่ยวข้องทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
        isDeleting = true; // Use specific loading state for delete
  
        try {
          const docRef = doc(db, "project-approve", id);
          const docRefavailability = doc(db, "project-availability", id);
          const docSnap = await getDoc(docRef); // Re-fetch just before delete is safer
  
          if (docSnap.exists()) {
            const projectData = docSnap.data();
  
            // Delete associated images from Firebase Storage
            if (projectData.images && Array.isArray(projectData.images)) {
              const deletePromises = projectData.images
                .filter(image => image && image.url) // Ensure image and url exist
                .map(async (image) => {
                  try {
                    // Extract storage path from URL more robustly
                    const url = new URL(image.url);
                    const storagePath = decodeURIComponent(url.pathname.split('/o/')[1]); // Path after /o/
  
                    if (storagePath) {
                      const imageRef = ref(storage, storagePath);
                      await deleteObject(imageRef);
                      console.log(`Deleted image: ${image.name || storagePath}`);
                    }
                  } catch (error) {
                    // Log specific image deletion error but continue
                    console.error(`Failed to delete image ${image.name || image.url}:`, error);
                    warningToast(`ไม่สามารถลบรูปภาพบางส่วนได้: ${image.name || 'รูปภาพ'}`);
                  }
                });
  
              await Promise.all(deletePromises); // Wait for all deletions
            }
  
            // Delete the project document from Firestore
            await deleteDoc(docRef);
            await deleteDoc(docRefavailability); // Delete availability document if it exists
            successToast("ลบข้อมูลโครงงานและรูปภาพเรียบร้อยแล้ว!");
            goto(`/cpe02/data`); // Navigate back to the list page
          } else {
             warningToast("ไม่พบข้อมูลโครงงานที่จะลบ (อาจถูกลบไปแล้ว)");
          }
        } catch (error) {
          console.error("Error deleting project:", error);
          dangerToast("เกิดข้อผิดพลาดในการลบข้อมูล: " + error.message);
        } finally {
          isDeleting = false;
        }
      }
    }
  </script>
  
  <svelte:head>
    <title>รายละเอียดโครงงาน</title>
    <meta name="description" content="รายละเอียดโครงงาน" />
    <link rel="icon" href="/favicon.ico" />
  </svelte:head>

  {#if isLoading}
    <div class="flex justify-center items-center min-h-[60vh]">
      <Loading />
    </div>
  {:else if isNotFound}
    <div class="container mx-auto px-4 py-16 text-center">
      <h1 class="text-4xl font-bold text-red-600 mb-4">404 - ไม่พบโครงงาน</h1>
      <p class="text-lg text-gray-600 mb-6">ขออภัย ไม่พบข้อมูลโครงงานที่คุณกำลังค้นหา</p>
      <a href="/cpe02/data" class="text-indigo-600 hover:text-indigo-800 hover:underline">
        &larr; กลับไปที่รายการโครงงานทั้งหมด
      </a>
    </div>
  {:else if project}
    <div class="container mx-auto w-full min-h-screen bg-gray-100 px-4 pb-20 pt-6">
      
      <!-- Main Content Grid -->
      <div class="md:flex md:gap-8 ">
  
        <!-- Left Column: Project Details -->
          <div class="{showTask ? 'md:w-7/12 lg:w-8/12' : 'md:w-10/12 lg:w-8/12 mx-auto'} mb-8 md:mb-0 ">
             <!-- Main Navigation Tabs -->     
            <div class="px-6 py-0  bg-white">
              <div class="flex overflow-x-auto overflow-y-hidden border-b border-gray-200">
                <button
                  on:click={() => selectVersion("current")}

                  class="py-4 px-6 -mb-px font-medium text-sm focus:outline-none whitespace-nowrap {activeMainView === 'current' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-indigo-500 border-b-2 border-transparent hover:border-gray-300'}"
                >
                  <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  เวอร์ชันปัจจุบัน
                </button>
                <button
                  on:click={() => selectVersion("previous_version")}
                  class="py-4 px-6 -mb-px font-medium text-sm focus:outline-none whitespace-nowrap {activeMainView === 'previous_version' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-indigo-500 border-b-2 border-transparent hover:border-gray-300'} {projectVersions.length === 0 ? 'cursor-not-allowed opacity-50' : ''}"
                  disabled={projectVersions.length === 0}
                >
                  <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  เวอร์ชันก่อนหน้า
                </button>
              </div>
            </div>

            <div class="h-full rounded-b-lg bg-white p-4 shadow-lg sm:p-6 md:p-8"> <!-- Consider adding h-full if content height varies -->

              
              <!-- Project Title -->
              <div class="mb-6 pb-4 border-b border-gray-200">
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{project.project_name_th}</h1>
                <p class="text-lg text-gray-600">{project.project_name_en}</p>
                <p class="text-sm text-gray-500 mt-1">ภาคเรียน: {project.term}</p>
              </div>
  
            <!-- Project Members & Advisors -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 class="text-lg font-semibold text-gray-700 mb-2">ผู้เสนอโครงงาน</h2>
                <ul class="list-disc list-inside pl-4 space-y-1 text-gray-600">
                  {#each project.members as member}
                    <li>{member}</li>
                  {/each}
                </ul>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-700 mb-2">อาจารย์ที่ปรึกษา</h2>
                <ul class="list-disc list-inside pl-4 space-y-1 text-gray-600">

                  {#if project.adviser.length === 0}
                    <li class="italic">ยังไม่มีที่ปรึกษา</li>
                  {/if}
                  {#each project.adviser as advisor}
                      {#if advisor.name != null} 
                        <li>{advisor.name}</li>
                      {/if}
                  {/each}
                  {#if project.External_consultant}
                    <li class="mt-1 italic">{project.External_consultant} (ที่ปรึกษาภายนอก)</li>
                  {/if}
                </ul>
              </div>
            </div>
  
            <!-- Detailed Sections -->
            <div class="space-y-6">
              <div>
                <h2 class="text-lg font-semibold text-gray-700 mb-2">4. ที่มาและความสำคัญ</h2>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.project_problem || 'ไม่มีข้อมูล'}</p>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-700 mb-2">5. วัตถุประสงค์</h2>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.project_Objective || 'ไม่มีข้อมูล'}</p>
              </div>
               <div>
                <h2 class="text-lg font-semibold text-gray-700 mb-2">6. เอกสาร/งานวิจัยที่เกี่ยวข้อง</h2>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.research_data || 'ไม่มีข้อมูล'}</p>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-700 mb-2">7. ทฤษฎีและหลักการ</h2>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.Theory_principles || 'ไม่มีข้อมูล'}</p>
              </div>
  
              <!-- Image Gallery -->
              {#if project.images && project.images.length > 0}
              <div>
                  <h2 class="text-lg font-semibold text-gray-700 mb-3">รูปภาพประกอบ</h2>
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {#each project.images as image}
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                      <div class="text-center group">
                          <img
                              src={image.url}
                              alt={image.title || 'Project Image'}
                              class="h-32 w-full object-cover rounded-md border border-gray-200 mb-1 cursor-pointer hover:opacity-80 transition-opacity shadow-sm group-hover:shadow-md"
                              on:click={() => openImageModal(image)}
                          />
                          <p class="text-xs text-gray-600 truncate px-1">{image.title || 'Untitled Image'}</p>
                      </div>
                      {/each}
                  </div>
              </div>
              {/if}
              
              {#if project.scope}
              <div>
                <h2 class="text-lg font-semibold text-gray-700 mb-2">8. ขอบเขตโครงงาน</h2>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.scope || 'ไม่มีข้อมูล'}</p>
              </div>
              {/if}
  
              <!-- Method of Operation Table (Gantt Chart) -->
              {#if project.Operation_Schedule}
              <div>
                  <h2 class="text-lg font-semibold text-gray-700 mb-3">9. แผนและระยะเวลาดำเนินงาน ({project.Operation_Schedule.tableTitle || 'Timeline'})</h2>
                  <div class="overflow-x-auto border border-gray-300 rounded-md shadow-sm">
                      <table class="w-full min-w-[600px] border-collapse text-sm">
                      <thead>
                          <tr class="bg-gray-100 text-left">
                          <th class="border-b border-gray-300 p-3 font-semibold text-gray-700 w-1/3 sm:w-1/4">กิจกรรม</th>
                          {#each project.Operation_Schedule.monthLabels as month}
                              <th class="border-b border-l border-gray-300 p-3 font-semibold text-gray-700 text-center whitespace-nowrap">{month}</th>
                          {/each}
                          </tr>
                      </thead>
                      <tbody class="bg-white">
                          {#each project.Operation_Schedule.activities as activity (activity.id)}
                          <tr class="hover:bg-gray-50 transition-colors duration-150 ">
                              <td class="border-b border-gray-300 p-3 text-gray-700 align-top">
                              {activity.name}
                              </td>
                              
                              {#each project.Operation_Schedule.monthLabels as month,i}
                              <td class="border-b border-l border-gray-300 p-0 text-center h-full">
                                  <div class="h-full w-full py-3 " style:background-color={activity.months[i] ? activity.color : 'transparent'}>&nbsp;</div>
                                </td>
                              {/each}
                          </tr>
                          {/each}
                      </tbody>
                      </table>
                  </div>
              </div>
              {/if}
              
              {#if project.benefits}
                <div>
                  <h2 class="text-lg font-semibold text-gray-700 mb-2">10. ประโยชน์ที่คาดว่าจะได้รับ</h2>
                  <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.benefits || 'ไม่มีข้อมูล'}</p>
                </div>
              {/if}


              {#if project.budgetItems && project.budgetItems.length > 0}
              <div>
                <h2 class="text-lg font-semibold text-gray-700 mb-2">11. งบประมาณ</h2>
                {#each project.budgetItems as bugget ,i}
                  <div class="flex justify-between items-center border-b border-gray-200 py-2">
                    <span class="text-gray-700">{i + 1}. {bugget.description}</span>
                    <span class="text-gray-700">{bugget.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
                  </div>
                {/each}
              </div>
              {/if}

              {#if project.refer}
              <div>
                <h2 class="text-lg font-semibold text-gray-700 mb-2">12. เอกสารอ้างอิง</h2>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.refer || 'ไม่มีข้อมูล'}</p>
              </div>
              {/if}

            </div>
  
            <!-- Action Buttons -->
            {#if can_edit && activeMainView === 'current'}
              <div class="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                      class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
                      on:click={()=> goToEditPage(projectId)}
                      disabled={isDeleting}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                      แก้ไขข้อมูล
                  </button>
                  <button
                      class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      on:click={() => deleteProject(projectId)}
                      disabled={isDeleting}
                  >
                      {#if isDeleting}
                          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          กำลังลบ...
                      {:else}
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                          ลบข้อมูล
                      {/if}
                  </button>
              </div>
            {/if}
  
          </div>
        </div>
        
        {#if showTask}
          <!-- Right Column: Process Component and/or Director Scores with Fixed Sticky Positioning -->
          <div class="md:w-5/12 lg:w-4/12">
            <div class="sticky top-20 overflow-y-auto h-[calc(100vh-5rem)]">
              {#if shouldShowProcessComponent && canViewDirectorScores}
                <!-- Both views available, show tabs -->
                <div class="bg-white shadow-lg rounded-lg">
                  <div class="px-4 pt-6 pb-0 sm:px-6">
                    <div class="flex border-b border-gray-200">
                      <button
                        on:click={() => activeTaskView = 'process'}
                        class="py-3 px-4 -mb-px font-medium text-sm focus:outline-none whitespace-nowrap {activeTaskView === 'process' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-indigo-500 border-b-2 border-transparent hover:border-gray-300'}"
                      >
                        สถานะและการดำเนินการ
                      </button>
                      <button
                        on:click={() => activeTaskView = 'exam'}
                        class="py-3 px-4 -mb-px font-medium text-sm focus:outline-none whitespace-nowrap {activeTaskView === 'exam' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-indigo-500 border-b-2 border-transparent hover:border-gray-300'}"
                      >
                        เลือกวัน-เวลาสอบ
                      </button>
                      <button
                        on:click={() => activeTaskView = 'scores'}
                        class="py-3 px-4 -mb-px font-medium text-sm focus:outline-none whitespace-nowrap {activeTaskView === 'scores' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-indigo-500 border-b-2 border-transparent hover:border-gray-300'}"
                      >
                        คะแนนจากกรรมการ
                      </button>
                    </div>
                  </div>

                  <div class="p-6">
                    {#if activeTaskView === 'process'}
                      <Process
                          {project}
                          isLoading={false} 
                          can_edit_task={activeMainView === 'current' ? can_edit_tasks : false} 
                          Task={termTasks} 
                          isLoadingtext={false} 
                          {visibleStates}
                          {status}
                          {projectId}
                          {comment}
                          {role}
                      />
                    {:else if activeTaskView === 'scores'}
                      <ProjectScore project={project} form_data={form_data}/>

                    {:else if activeTaskView === 'exam'}
                    <StudentSelect projectId={projectId}/>
                    {/if}
                  </div>
                </div>
              {:else if shouldShowProcessComponent}
                <!-- Only Process component -->
                  <div class="bg-white shadow-lg rounded-lg p-6">
                      <h2 class="text-xl font-semibold text-gray-800 mb-4">สถานะและการดำเนินการ</h2>
                      <Process {project} isLoading={false} can_edit_task={activeMainView === 'current' ? can_edit_tasks : false}  Task={termTasks} isLoadingtext={false} {visibleStates} {status} {projectId} {comment} {role} />
                  </div>
              {:else if canViewDirectorScores}
                <!-- Only Director scores -->
                  <ProjectScore project={project} form_data={form_data}/>
              {/if}
            </div>
          </div>
          {/if}


      </div>
    </div>
  {/if}
  
  <!-- Image Modal -->
  {#if showModal && selectedImage}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      on:click={() => (showModal = false)}
    >
      <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden" on:click|stopPropagation>
         <img
          src={selectedImage.url}
          alt={selectedImage.title || 'Enlarged Image'}
          class="block max-w-full max-h-[calc(90vh-60px)] object-contain"
        />
         <p class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-center p-2 text-sm">
             {selectedImage.title || 'Untitled Image'}
         </p>
        <button
          type="button"
          class="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 hover:bg-opacity-100 transition-colors"
          aria-label="Close image viewer"
          on:click={() => (showModal = false)}
        >
          ✕
        </button>
      </div>
    </div>
  {/if}
  