<script>
    import { onMount } from "svelte";
    import { getCookie } from 'cookies-next';
    import { goto } from '$app/navigation';
    import { goToProject_Details } from "$lib/NavigateWithToken";
    import Loading from "$lib/components/loading.svelte";

    let projects = [];
    let filteredProjects = [];
    let loading = true;
    let error = null;
    let currentUserEmail = "";

    let searchQuery = "";
    let selectedTerm = "all";

    onMount(async () => {
        try {
            loading = true;
            currentUserEmail = getCookie('email');
            if (!currentUserEmail) {
                throw new Error('User email not found in cookies');
            }

            const formRes = await fetch('/api/form-data?isOpen=true', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=60',
                },
            });


            if (!formRes.ok) {
                throw new Error('Failed to fetch form Data');
            }

            const formDataResponse = await formRes.json();
            const openForm = formDataResponse.data.find(form => form.isOpen === true);

            if (openForm && openForm.term) {
                selectedTerm = openForm.term;
                const project_response = await fetch(`/api/project-data?term=${selectedTerm}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'max-age=60',
                    },
                });

                if (project_response.ok) {
                    const project_data = await project_response.json();
                    projects = project_data.data.map(project => ({
                        ...project,
                        isDirector: Array.isArray(project.directors) && project.directors.some(director => director.email === currentUserEmail),
                    }));
                    applyFilters();
                } else {
                    const errorData = await project_response.json();
                    throw new Error(errorData.error || 'Failed to fetch project data');
                }
            } else {
                error = "ไม่พบภาคการศึกษาที่เปิดให้แสดงข้อมูลโครงงาน";
                projects = [];
            }
            
            
        } catch (err) {
            console.error("Error fetching projects:", err);
            error = "เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน กรุณาลองใหม่อีกครั้ง";
        }finally{
            loading = false;
        }
    });        
      

    function applyFilters() {
        filteredProjects = projects.filter((project) => {
            const isUserAdviser = Array.isArray(project.adviser) && project.adviser.some(adviser => adviser.email === currentUserEmail);
            
            // Check if the project has directors and if the current user is one of them
            const isUserDirector = project.isDirector;

            // Include projects where the user is either an advisor or a director
            if (!isUserAdviser && !isUserDirector) {
                return false;
            }

            if (selectedTerm !== "all" && project.term !== selectedTerm) {
                return false;
            }

            if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase().trim();
                const nameMatch = project.project_name_th && project.project_name_th.toLowerCase().includes(query);
                const membersMatch = project.members && project.members.some((member) => member.toLowerCase().includes(query));
                const adviserMatch = project.adviser && 
                                   project.adviser.some(adviser => 
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

    function goToAppointmentDetails(projectId) {
        goto(`/TS_Dashboard/Appointment/${projectId}`);
    }
</script>

<div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">นัดหมายการสอบ</h1>

    {#if loading}
        <Loading />
    {:else if error}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="mb-6 space-y-4">
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="w-full md:w-1/3">
                        <label for="term-display" class="block text-sm font-medium text-gray-700 mb-1">ภาคการศึกษา</label>
                        <div
                            id="term-display"
                            class="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border bg-gray-100 cursor-not-allowed"
                        >
                            {#if selectedTerm}
                                {selectedTerm}
                            {:else}
                                <span class="text-gray-500">ไม่มีภาคการศึกษาที่ระบุ</span>
                            {/if}
                        </div>
                    </div>

                    <div class="w-full md:w-2/3">
                        <label for="search-input" class="block text-sm font-medium text-gray-700 mb-1">ค้นหา (ชื่อโครงงาน, สมาชิก, อาจารย์ที่ปรึกษา)</label>
                        <div class="relative">
                            <input id="search-input" type="text" bind:value={searchQuery} on:input={handleSearch} placeholder="พิมพ์คำค้นหา..." class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 pl-3 pr-10 border" />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid gap-4">
                {#if filteredProjects.length === 0}
                    <div class="text-center py-8 text-gray-500">
                        <p>ไม่พบโครงงานที่ตรงกับเงื่อนไขการค้นหา</p>
                    </div>
                {:else}
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ชื่อโครงงาน
                                </th>
                                <th scope="col" class="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    นัดหมาย
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {#each filteredProjects as project (project.id)}
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-blue-600 hover:underline cursor-pointer" on:click={() => goToProject_Details(project.id)}>{project.project_name_th}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            on:click={() => goToAppointmentDetails(project.id)}
                                            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            นัดหมาย
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </div>
    {/if}
</div>
