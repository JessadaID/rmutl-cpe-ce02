<script>
    import { goto } from "$app/navigation";
    // Receive data from +page.server.js
    export let data;
    
    // Extract data from server
    let { projects, fixedTerm, maxDirectors, error } = data;
    
    // Client-side reactive variables
    let filteredProjects = projects;
    let searchQuery = "";

    // Reactive statement to filter projects when searchQuery changes
    $: {
        filteredProjects = projects.filter((project) => {
            // If search query is empty, include all projects
            if (!searchQuery || searchQuery.trim() === "") {
                return true;
            }
            
            const query = searchQuery.toLowerCase().trim();

            // Search in project name (with null check)
            const nameMatch = project.project_name_th && 
                            project.project_name_th.toLowerCase().includes(query);
            
            // Search in members (with array check)
            const membersMatch = Array.isArray(project.members) && 
                               project.members.some((member) => 
                                   member && member.toLowerCase().includes(query)
                               );
            
            // Search in advisers (with array check)
            const adviserMatch = Array.isArray(project.adviser) && 
                               project.adviser.some(adviser => {
                                   if (!adviser) return false;
                                   return (adviser.name && adviser.name.toLowerCase().includes(query)) ||
                                          (adviser.email && adviser.email.toLowerCase().includes(query));
                               });
            
            // Search in directors
            const directorMatch = Array.isArray(project.directorNames) && 
                                project.directorNames.some((director) => 
                                    director && director.toLowerCase().includes(query)
                                );

            return nameMatch || membersMatch || adviserMatch || directorMatch;
        });
    }

    function goBack() {
        goto('/cpe02');
    }

    function goToProject_Details(project) {
        goto(`/cpe02/data/term/${project.term}/project-detail/${project.id}`);
    }
</script>

<div class="max-w-4xl mx-auto mt-3">
    <button
        on:click={goBack}
        class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-2 rounded-lg shadow-sm transition duration-150 ease-in-out flex items-center"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="m15 6-6 6 6 6" />
        </svg>
    </button>

    <div class="flex justify-between items-center mb-6 mt-3">
        <h1 class="text-2xl font-bold text-gray-800">ตารางลงชื่อโครงงาน</h1>
    </div>

    {#if error}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="mb-8 space-y-4">
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="w-full md:w-1/3">
                        <label for="term-display" class="block text-sm font-medium text-gray-700 mb-1">ภาคการศึกษา</label>
                        <div
                            id="term-display"
                            class="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border bg-gray-100 cursor-not-allowed"
                        >
                            {#if fixedTerm}
                                {fixedTerm}
                            {:else}
                                <span class="text-gray-500">ไม่มีภาคการศึกษาที่ระบุ</span>
                            {/if}
                        </div>
                    </div>

                    <div class="w-full md:w-2/3">
                        <label for="search-input" class="block text-sm font-medium text-gray-700 mb-1">ค้นหา (ชื่อโครงงาน, สมาชิก, อาจารย์ที่ปรึกษา, กรรมการ)</label>
                        <div class="relative">
                            <input 
                                id="search-input" 
                                type="text" 
                                bind:value={searchQuery} 
                                placeholder="พิมพ์คำค้นหา..." 
                                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 pl-3 pr-10 border" 
                            />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                {#if filteredProjects.length === 0}
                    <div class="text-center py-8 text-gray-500">
                        <p>ไม่พบโครงงานที่ตรงกับเงื่อนไขการค้นหา</p>
                    </div>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ชื่อโครงงาน
                                    </th>
                                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                                        จำนวนกรรมการ
                                    </th>
                                    {#each Array(maxDirectors) as _, index}
                                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            กรรมการ {index + 1}
                                        </th>
                                    {/each}
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                {#each filteredProjects as project (project.id)}
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-4">
                                            <div class="text-sm text-blue-600 hover:underline cursor-pointer" on:click={() => goToProject_Details(project)}>
                                                {project.project_name_th}
                                            </div>
                                        </td>
                                        <td class="px-4 py-4 whitespace-nowrap text-center">
                                            <div class="text-sm text-gray-900">{project.directorCount}</div>
                                        </td>
                                        {#each Array(maxDirectors) as _, index}
                                            <td class="px-4 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900">
                                                    {#if project.directorNames && index < project.directorNames.length}
                                                        {project.directorNames[index]}
                                                    {:else}
                                                        <!-- Empty cell for missing directors -->
                                                    {/if}
                                                </div>
                                            </td>
                                        {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>