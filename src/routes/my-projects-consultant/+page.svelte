<script>
    import { onMount } from "svelte";
    import { goto } from '$app/navigation';
    import { createJWT } from '$lib/jwt';
    
    import { auth } from '$lib/firebase'; // Assuming this is your CLIENT-SIDE Firebase auth instance
    import { onAuthStateChanged } from 'firebase/auth';

    let currentUserEmail = null;
    let isLoading = true; // Start in loading state
    let errorMessage = null;
    let selectedTerm = null;  // The term to be used for fetching projects
    let projects = [];        // All projects fetched for the current user

    async function fetchUserProjects(email) {
        if (!email) {
            errorMessage = "User email is not available to fetch projects.";
            isLoading = false;
            return;
        }
        try {
            
            // Fetch form data and find the open form
            const formRes = await fetch(`../../api/form-data?isOpen=true`);
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
                errorMessage = "ไม่พบภาคการศึกษาที่เปิดให้เลือกโครงงาน";
                projects = []; // Ensure projects is empty
                selectedTerm = null; // Ensure selectedTerm is null
            }

        } catch (err) {
            console.error("Error fetching projects:", err);
            errorMessage = "An error occurred while fetching projects. Please check your network connection.";
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
                errorMessage = "Please log in to view your projects.";
                isLoading = false;
            }
        });

        // Important: Unsubscribe from the listener when the component is destroyed
        return () => unsubscribe();
    });

    async function viewProjectDetails(projectId) {
        if (!projectId) {
            errorMessage = "Project ID is missing.";
            return;
        }
        try {
            const payload = { projectId };
            const token = await createJWT(payload);
            goto(`/cpe02/data/term/project-detail?token=${token}`);
        } catch (err) {
            console.error('Error creating JWT or navigating:', err);
            errorMessage = "Could not navigate to project details.";
        }
    }

    function getStatusClass(status) {
        switch (status?.toLowerCase()) {
            case 'approve':
                return 'bg-green-100 text-green-800';
            case 'improvement':
                return 'bg-yellow-100 text-yellow-800';
            case 'wait':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    function getStatusText(status) {
        switch (status?.toLowerCase()) {
            case 'approve':
                return 'อนุมัติ';
            case 'improvement':
                return 'ปรับปรุง';
            case 'wait':
                return 'รอการอนุมัติ';
            default:
                return status || 'ไม่ระบุ';
        }
    }

    /**
	 * Gets the status from the latest task in the project.Tasks object.
	 * @param {object} tasks - The project.Tasks object (e.g., { "0": { status: "...", ... }, "1": { status: "...", ... } }).
	 * @returns {string} The status string (e.g., "approve", "wait") or "ไม่ระบุ".
	 */
	function getLatestTaskStatus(tasks) {
		if (!tasks || typeof tasks !== 'object' || Object.keys(tasks).length === 0) {
			return 'wait'; // Default status if no tasks or tasks is not an object
		}
		const taskIndices = Object.keys(tasks)
			.map(Number) // Convert keys to numbers
			.filter(key => !isNaN(key)) // Ensure they are valid numbers
			.sort((a, b) => a - b); // Sort numerically

		if (taskIndices.length === 0) {
			return 'wait'; // No valid numeric keys
		}

		const latestTaskIndex = taskIndices[taskIndices.length - 1];
		return tasks[latestTaskIndex]?.status || 'wait';
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
        <div class="flex justify-center items-center py-10">
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-lg text-gray-600">กำลังโหลดโครงงานของคุณ...</p>
        </div>
    {:else if errorMessage}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4  shadow-md max-w-lg mx-auto" role="alert">
            <p class="font-bold">เกิดข้อผิดพลาด</p>
            <p>{errorMessage}</p>
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
                                                {project.members.join(', ')}
                                            {:else}
                                                <span class="text-gray-400 italic">ไม่มี</span>
                                            {/if}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {#if project.adviser && project.adviser.length > 0}
                                                {project.adviser.map(adv => adv.name || adv).join(', ')}
                                            {:else}
                                                <span class="text-gray-400 italic">ไม่มี</span>
                                            {/if}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusClass(getLatestTaskStatus(project.Tasks))}">
                                                {getStatusText(getLatestTaskStatus(project.Tasks))}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                on:click={() => viewProjectDetails(project.id)}
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
