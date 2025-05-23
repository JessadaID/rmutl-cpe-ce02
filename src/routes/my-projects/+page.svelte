<script>
    import { onMount } from "svelte";
    import { goto } from '$app/navigation';
    import { createJWT } from '$lib/jwt';
    // Make sure you have a client-side Firebase initialization file.
    // This file should initialize the Firebase app and export the 'auth' object.
    // For example, you might have src/lib/firebaseClient.js (imported as $lib/firebaseClient).
    //
    // Example content for src/lib/firebaseClient.js:
    //
    // import { initializeApp, getApps, getApp } from 'firebase/app';
    // import { getAuth } from 'firebase/auth';
    //
    // const firebaseConfig = {
    //   apiKey: "YOUR_API_KEY",
    //   authDomain: "YOUR_AUTH_DOMAIN",
    //   projectId: "YOUR_PROJECT_ID",
    //   storageBucket: "YOUR_STORAGE_BUCKET",
    //   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    //   appId: "YOUR_APP_ID"
    //   // Make sure to replace these with your actual Firebase project configuration!
    // };
    //
    // let app;
    // if (!getApps().length) { // Ensure app is not initialized multiple times
    //   app = initializeApp(firebaseConfig);
    // } else {
    //   app = getApp(); // Use existing app
    // }
    //
    // export const auth = getAuth(app);
    //
    // It's generally better to use a dedicated client-side Firebase init for browser environments.
    // If '$lib/firebase' exports the client-side 'auth', this is fine.
    // Otherwise, consider creating '$lib/firebaseClient.js' and importing from there.
    import { auth } from '$lib/firebase'; // Assuming this is your CLIENT-SIDE Firebase auth instance
    import { onAuthStateChanged } from 'firebase/auth';

    let allFetchedProjects = [];
    let currentUserEmail = null;
    let isLoading = true; // Start in loading state
    let errorMessage = null;
    let groupedProjects = {}; // { "term1": [projA, projB], "term2": [projC] }
    let sortedTerms = [];     // ["term2", "term1"] (sorted for display)

    // Custom sort function for terms like "1/2567", "2/2566"
    // Sorts by year descending, then by semester descending
    function sortTerms(termA, termB) {
        const [semA, yearA] = termA.split('/').map(Number);
        const [semB, yearB] = termB.split('/').map(Number);

        if (yearA !== yearB) {
            return yearB - yearA; // Sort by year descending
        }
        return semB - semA; // Sort by semester descending
    }

    function processProjects(projectsData) {
        const groups = {};
        if (projectsData && projectsData.data && Array.isArray(projectsData.data)) {
            projectsData.data.forEach(project => {
                const term = project.term || "Uncategorized";
                if (!groups[term]) {
                    groups[term] = [];
                }
                groups[term].push(project);
            });
            // Sort projects within each term by name (Thai)
            for (const term in groups) {
                groups[term].sort((a, b) => a.project_name_th.localeCompare(b.project_name_th, 'th'));
            }
        }
        groupedProjects = groups;
        sortedTerms = Object.keys(groups).sort(sortTerms);
    }

    async function fetchUserProjects(email) {
        if (!email) {
            errorMessage = "User email is not available to fetch projects.";
            isLoading = false;
            return;
        }
        try {
            // Ensure the email is properly encoded for the URL query string
            const response = await fetch(`/api/project-data?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any other headers you might need, like authorization tokens
                },
            });
            if (response.ok) {
                allFetchedProjects = await response.json();
                processProjects(allFetchedProjects);
                errorMessage = null; // Clear any previous error message
                // console.log("Fetched and grouped projects:", groupedProjects);
            } else {
                console.error("Failed to fetch projects:", response.status, await response.text());
                errorMessage = `Failed to load projects (status: ${response.status}). Please try again later.`;
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
                allFetchedProjects = [];
                groupedProjects = {};
                sortedTerms = [];
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
    <title>โครงงานของฉัน</title>
    <meta name="description" content="ดูและจัดการโครงงานของคุณที่นี่" />
    <link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="container mx-auto px-4 py-8 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">โครงงานของฉัน</h1>

    {#if isLoading}
        <div class="flex justify-center items-center py-10">
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-lg text-gray-600">กำลังโหลดโครงงานของคุณ...</p>
        </div>
    {:else if errorMessage}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md max-w-lg mx-auto" role="alert">
            <p class="font-bold">เกิดข้อผิดพลาด</p>
            <p>{errorMessage}</p>
        </div>
    {:else if sortedTerms.length > 0}
        <div class="space-y-10">
            {#each sortedTerms as term (term)}
                <section>
                    <h2 class="text-2xl font-semibold text-indigo-700 mb-4 pb-2 border-b-2 border-indigo-200">
                        ภาคเรียน: {term === "Uncategorized" ? "ไม่ได้ระบุภาคเรียน" : term}
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
                                {#each groupedProjects[term] as project (project.id)}
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
            {/each}
        </div>
    {:else}
        <div class="text-center py-10">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 class="mt-2 text-xl font-medium text-gray-900">ไม่พบโครงงาน</h3>
            <p class="mt-1 text-sm text-gray-500">
                {#if currentUserEmail}
                    ดูเหมือนว่าคุณยังไม่มีโครงงานที่ส่งเข้ามาสำหรับอีเมล {currentUserEmail}
                {:else}
                    ไม่พบข้อมูลโครงงาน.
                {/if}
            </p>
             {#if currentUserEmail}
            <div class="mt-6">
                <a href="/cpe02" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    สร้างโครงงานใหม่
                </a>
            </div>
             {/if}
        </div>
    {/if}
</div>
