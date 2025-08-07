<script>
    import { onMount } from "svelte";
    import { goto } from '$app/navigation';
    import Loading from "$lib/components/loading.svelte";
    import { auth } from '$lib/firebase'; // Assuming this is your CLIENT-SIDE Firebase auth instance
    import { onAuthStateChanged } from 'firebase/auth';
    import MemberTooltip from "$lib/components/memberTooltip.svelte";
    import TeacherTooltip from "$lib/components/teacherTooltip.svelte";
  import { dangerToast } from "$lib/customtoast";

    let currentUserEmail = null;
    let isLoading = true; // Start in loading state
    let errorMessage = null;
    let selectedTerm = null;  // The term to be used for fetching projects
    let projects = [];        // All projects fetched for the current user

    async function fetchUserProjects(email) {
        if (!email) {
            dangerToast(`User email is not available to fetch projects.`)
            isLoading = false;
            return;
        }
        try {
            
            // Fetch form data and find the open form
            const formRes = await fetch(`/api/form-data?isOpen=true`);
            const formDataResponse = await formRes.json();
            if (!formRes.ok) {
                throw new Error(formDataResponse.error || "ไม่สามารถโหลดข้อมูลฟอร์มได้");
            }
            const openForm = formDataResponse.data.find(form => form.isOpen == true);
            
            if (openForm && openForm.term) {
                selectedTerm = openForm.term; // Set the fixed term

                // Fetch project data for the fixed term
                const projectRes = await fetch(`../../api/project-data?term=${selectedTerm}`);
                const projectDataResponse = await projectRes.json();
                if (!projectRes.ok) {
                throw new Error(projectDataResponse.error || "ไม่สามารถโหลดข้อมูลโครงงานได้");
                }
                
                if (!projectDataResponse.data || !Array.isArray(projectDataResponse.data)) {
                throw new Error("ข้อมูลโครงงานไม่ถูกต้อง");
                }
                
                const allProjectsForTerm = projectDataResponse.data; 
                
                if (email) { // email is currentUserEmail
                    const lowerCurrentUserEmail = email.toLowerCase();
                    //console.log("Lowercased email:", allProjectsForTerm);
                    projects = allProjectsForTerm.filter(p => 
                        p.adviser && 
                        Array.isArray(p.adviser) &&
                        p.adviser.some(adv => 
                            typeof adv === 'object' && 
                            adv.email && 
                            adv.email.toLowerCase() === lowerCurrentUserEmail
                        )
                    );
                } else {
                    // This case should ideally not be reached if onAuthStateChanged and currentUserEmail are set correctly
                    projects = []; 
                }
                // console.log("Fetched and filtered project data for consultant:", projects);

            } else {
                // No open form or term found
                dangerToast("ไม่พบภาคการศึกษาที่เปิดให้เลือกโครงงาน")
                projects = []; // Ensure projects is empty
                selectedTerm = null; // Ensure selectedTerm is null
            }

        } catch (err) {
            console.error("Error fetching projects:", err);
            dangerToast(`ERROR : ${err.message}}`)
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUserEmail = user.email;
                isLoading = true; // Set loading to true before fetching projects
                await fetchUserProjects(currentUserEmail);
            } else {
                // User is signed out
                currentUserEmail = null;
                isLoading = false;
            }
        });

        // Important: Unsubscribe from the listener when the component is destroyed
        return () => unsubscribe();
    });

    async function viewProjectDetails(project) {
        if (!project) {
            dangerToast("Project is missing.");
            return;
        }
        goto(`/cpe02/data/term/${project.term}/project-detail/${project.id}`); // Navigate to the project detail page
    }

     /**
	 * Gets a formatted status text based on status and taskIndex
	 * @param {string} status - The status value
	 * @param {number} taskIndex - The task index number
	 * @returns {string} Formatted status text in Thai
	 */
	function getFormattedStatus(status, taskIndex) {
		const round = taskIndex + 1; // Convert to 1-based for display
		
		if (status === 'approve') {
			return `อนุมัติงานที่ ${round}`;
		} else if (status === 'wait') {
			return `รออนุมัติงานที่ ${round}`;
		} else if (status === 'improvement') {
			return `แก้ไขงานที่ ${round}`;
		} else {
			return 'ไม่ระบุ';
		}
	}

    /**
	 * Gets the status from the latest task in the project.Tasks object.
	 * @param {object} tasks - The project.Tasks object (e.g., { "0": { status: "...", ... }, "1": { status: "...", ... } }).
	 * @returns {object} An object containing the status and taskIndex.
	 */
	function getLatestTaskStatus(tasks) {
		if (!tasks || typeof tasks !== 'object' || Object.keys(tasks).length === 0) {
			return { status: 'wait', taskIndex: 0 }; // Default if no tasks or tasks is not an object
		}
		const taskIndices = Object.keys(tasks)
			.map(Number) // Convert keys to numbers
			.filter(key => !isNaN(key)) // Ensure they are valid numbers
			.sort((a, b) => a - b); // Sort numerically

		if (taskIndices.length === 0) {
			return { status: 'wait', taskIndex: 0 }; // No valid numeric keys
		}

		const latestTaskIndex = taskIndices[taskIndices.length - 1];
		return { 
			status: tasks[latestTaskIndex]?.status || 'wait', 
			taskIndex: latestTaskIndex 
		};
	}
</script>

<svelte:head>
    <title>โครงงานที่ฉันเป็นที่ปรึกษา</title>
    <meta name="description" content="ดูโครงงานที่คุณเป็นที่ปรึกษา" />
    <link rel="icon" href="/favicon.ico" />
</svelte:head>


<div class="container mx-auto px-4 py-8 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">โครงงานที่ฉันเป็นที่ปรึกษา</h1>

    {#if isLoading}
        <div class="flex items-center justify-center h-64">
            <Loading />
        </div>
    {:else if projects.length > 0}
        <div class="space-y-10">
                <section>
                    <h2 class="text-2xl font-semibold text-indigo-700 mb-4 pb-2 border-b-2 border-indigo-200">
                        {#if selectedTerm}
                            ภาคเรียน: {selectedTerm}
                        {:else}
                            กำลังรอข้อมูลภาคเรียน...
                        {/if}
                    </h2>
                    <div class="bg-white shadow-md rounded-lg overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ชื่อโครงงาน (ไทย)
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ชื่อโครงงาน (Eng)
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        สมาชิก
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ที่ปรึกษา
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        สถานะ
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        การดำเนินการ
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                {#each projects as project (project.id)}
                                    <tr class="hover:bg-gray-50 transition-colors duration-150">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" title={project.project_name_th}>
                                            {project.project_name_th || '-'}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700" title={project.project_name_en}>
                                            {project.project_name_en || '-'}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {#if project.members && project.members.length > 0}
                                            <div class="text-sm text-gray-700 flex items-center space-x-1">
                                                    <span>{project.members[0] || 'N/A'}</span>
                                                        <MemberTooltip members={project.members} />
                                            </div>

                                            {:else}
                                                <span class="text-sm text-gray-500">ไม่มี</span>
                                            {/if}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {#if project.adviser && project.adviser.length > 0}
                                            <div class="text-sm text-gray-700 flex items-center space-x-1">
                                                    <span>{project.adviser[0].name || 'N/A'}</span>
                                                        <TeacherTooltip members={project.adviser} />
                                            </div>

                                            {:else}
                                                <span class="text-sm text-gray-500">ไม่มี</span>
                                            {/if}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            {#if project.Tasks}
                                                    {@const taskStatus = getLatestTaskStatus(project.Tasks)}
                                                    {#if taskStatus.status === 'approve'}
                                                        <span
                                                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                                                        >
                                                            {getFormattedStatus(taskStatus.status, taskStatus.taskIndex)}
                                                        </span>
                                                    {:else if taskStatus.status === 'wait'}
                                                        <span
                                                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                                                        >
                                                            {getFormattedStatus(taskStatus.status, taskStatus.taskIndex)}
                                                        </span>
                                                    {:else if taskStatus.status === 'improvement'}
                                                        <span
                                                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800"
                                                        >
                                                            {getFormattedStatus(taskStatus.status, taskStatus.taskIndex)}
                                                        </span>
                                                    {:else}
                                                        <span
                                                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800"
                                                        >
                                                            ไม่ระบุ
                                                        </span>
                                                    {/if}
                                                {:else}
                                                    <span
                                                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800"
                                                    >
                                                        ไม่ระบุ
                                                    </span>
                                                {/if}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                on:click={() => viewProjectDetails(project)}
                                                class="text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none"
                                            >
                                                ดูรายละเอียด
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                     </div>
                </section>
        </div>
    {:else}
        <div class="text-center py-10">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 class="mt-2 text-xl font-medium text-gray-900">
                {#if selectedTerm}
                    ไม่พบโครงงานที่คุณเป็นที่ปรึกษาในภาคเรียน {selectedTerm}
                {:else if errorMessage}
                    {errorMessage} <!-- Show specific error if projects array is empty due to it -->
                {:else}
                    ไม่พบโครงงานที่คุณเป็นที่ปรึกษา
                {/if}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
                {#if currentUserEmail}
                    {#if selectedTerm}
                        ดูเหมือนว่าคุณยังไม่ได้เป็นที่ปรึกษาให้กับโครงงานใดๆ ในภาคเรียน {selectedTerm} หรือยังไม่มีโครงงานที่ตรงเงื่อนไข
                    {:else if !errorMessage}
                        อาจยังไม่มีภาคการศึกษาที่เปิดให้ดูข้อมูล หรือคุณยังไม่ได้เป็นที่ปรึกษาให้กับโครงงานใดๆ
                    {/if}
                {:else}
                    กรุณาเข้าสู่ระบบเพื่อดูข้อมูล
                {/if}
            </p>
        </div>
    {/if}
</div>
