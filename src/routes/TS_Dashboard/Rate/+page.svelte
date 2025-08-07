<script>
    import { onMount } from "svelte";
    import { getCookie } from 'cookies-next';
    import { goto } from '$app/navigation';
    import { createJWT } from "$lib/jwt";
    import Loading from "$lib/components/loading.svelte";

    let projects = [];
    let filteredProjects = [];
    let loading = false;
    let error = null;
    let currentUserEmail = "";
    let currentUserRole = "";

    let searchQuery = "";
    let selectedTerm = "all";
    let availableTerms = [];

    let selectedRole = null;
    let availableRoles = [];

    const allRoles = [
        { label: "อาจารย์ประจำวิชา", value: "subject_teacher" },
        { label: "อาจารย์ที่ปรึกษา", value: "adviser" },
        { label: "กรรมการ", value: "director" }
    ];

    onMount(async () => {
        try {
            loading = true;
            currentUserEmail = getCookie('email');
            currentUserRole = getCookie('role');
            if (!currentUserEmail || !currentUserRole) {
                throw new Error('User email or role not found in cookies');
            }

            const formRes = await fetch('/api/form-data?isOpen=true');
            if (!formRes.ok) throw new Error('Failed to fetch form Data');

            const formDataResponse = await formRes.json();
            const openForm = formDataResponse.data.find(form => form.isOpen);

            if (openForm && openForm.term) {
                selectedTerm = openForm.term;
                const project_response = await fetch(`/api/project-data?term=${selectedTerm}`);
                if (!project_response.ok) throw new Error('Failed to fetch project data');

                const project_data = await project_response.json();
                projects = project_data.data;

                // กำหนด availableRoles ตาม role ของ user
                const userRoles = new Set();
                
                // ตรวจสอบว่าเป็น subject_teacher หรือไม่
                if (currentUserRole === 'subject_teacher') {
                    userRoles.add("subject_teacher");
                }
                
                // ตรวจสอบว่ามีสิทธิ์เป็น adviser หรือ director ในโปรเจคไหนบ้าง
                projects.forEach(project => {
                    // ตรวจสอบว่าเป็น adviser หรือไม่
                    if (Array.isArray(project.adviser) && 
                        project.adviser.some(a => a.email === currentUserEmail)) {
                        userRoles.add("adviser");
                    }
                    
                    // ตรวจสอบว่าเป็น director หรือไม่
                    if (Array.isArray(project.directors) && 
                        project.directors.some(d => d.email === currentUserEmail)) {
                        userRoles.add("director");
                    }
                });

                availableRoles = allRoles.filter(role => userRoles.has(role.value));

                if (availableRoles.length === 0) {
                    error = "คุณไม่มีบทบาทในโครงงานใดๆ ในภาคการศึกษานี้";
                }
            } else {
                error = "ไม่พบภาคการศึกษาที่เปิดให้แสดงข้อมูลโครงงาน";
            }
        } catch (err) {
            error = "เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน กรุณาลองใหม่อีกครั้ง";
        } finally {
            loading = false;
        }
    });

    function applyFilters() {
        if (!selectedRole) return;

        filteredProjects = projects.filter((project) => {
            // กรองตาม role ที่เลือก
            let hasRole = false;
            
            if (selectedRole === "subject_teacher") {
                // อาจารย์ประจำวิชาเห็นได้หมดทุกโปรเจค เมื่อเลือก role subject_teacher
                hasRole = currentUserRole === 'subject_teacher';
            } else if (selectedRole === "adviser") {
                // ตรวจสอบว่าเป็น adviser ของโปรเจคนี้หรือไม่
                hasRole = Array.isArray(project.adviser) && 
                         project.adviser.some(a => a.email === currentUserEmail);
            } else if (selectedRole === "director") {
                // ตรวจสอบว่าเป็น director ของโปรเจคนี้หรือไม่
                hasRole = Array.isArray(project.directors) && 
                         project.directors.some(d => d.email === currentUserEmail);
            }

            if (!hasRole) return false;

            // กรองตาม term
            if (selectedTerm !== "all" && project.term !== selectedTerm) return false;

            // กรองตาม search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                return (
                    project.project_name_th?.toLowerCase().includes(query) ||
                    project.project_name_en?.toLowerCase().includes(query) ||
                    project.members?.some(member => 
                        typeof member === 'string' ? member.toLowerCase().includes(query) : 
                        member.name?.toLowerCase().includes(query) || member.email?.toLowerCase().includes(query)
                    ) ||
                    project.adviser?.some(adviser =>
                        adviser.name?.toLowerCase().includes(query) ||
                        adviser.email?.toLowerCase().includes(query)
                    ) ||
                    project.directors?.some(director =>
                        director.name?.toLowerCase().includes(query) ||
                        director.email?.toLowerCase().includes(query)
                    )
                );
            }

            return true;
        });
    }

    function handleRoleSelection(role) {
        selectedRole = role;
        applyFilters();
    }

    function handleSearch() {
        applyFilters();
    }

    async function goToRateProject(project) {
        if(selectedRole != "subject_teacher"){
            const payload = { projectId : project.id, role: selectedRole };
            const token = await createJWT(payload);
            goto(`/TS_Dashboard/Rate/Project_Rate?projectId=${token}`);
        }else{
            const payload = { projectId : project.id , role: selectedRole ,projectname: project.project_name_th };
            const token = await createJWT(payload);
            goto(`/TS_Dashboard/Rate/Project_score?projectId=${token}`);
        }
    }
    
    function goBack(){
        selectedRole = null;
        filteredProjects = [];
    }

    function goToProject_Details(project) {
        goto(`/cpe02/data/term/${project.term}/project-detail/${project.id}`);
    }
</script>

<div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">ให้คะแนนโครงงาน</h1>

    {#if loading}
        <Loading />
    {:else if error}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
        </div>
    {:else if !selectedRole}
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 class="text-lg font-semibold mb-4">เลือกบทบาทที่คุณต้องการให้คะแนน</h2>
            {#if availableRoles.length > 0}
                <div class="flex justify-center gap-4 flex-wrap">
                    {#each availableRoles as role}
                        <button
                            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                            on:click={() => handleRoleSelection(role.value)}
                        >
                            {role.label}
                        </button>
                    {/each}
                </div>
            {:else}
                <p class="text-gray-500">ไม่พบบทบาทที่สามารถให้คะแนนได้</p>
            {/if}
        </div>
    {:else}
        <div class="mb-4">
            <button 
                on:click={goBack}
                class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                ← ย้อนกลับ
            </button>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="mb-6">
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
                    <div class="w-full md:w-1/3">
                        <label for="term-display" class="block text-sm font-medium text-gray-700 mb-1">บทบาทที่เลือก</label>

                        <div
                            id="term-display"
                            class="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border bg-blue-100 cursor-not-allowed"
                        >
                                <span class="text-gray-700 ">{allRoles.find(r => r.value === selectedRole)?.label || selectedRole}</span>
                        </div>
                    </div>
                    <div class="w-full md:w-1/3">
                        <label for="search-input" class="block text-sm font-medium text-gray-700 mb-1">ค้นหา (ชื่อโครงงาน)</label>

                        <input 
                                id="search-input" 
                                type="text" 
                                bind:value={searchQuery} 
                                on:input={handleSearch}

                                placeholder="พิมพ์คำค้นหา..." 
                                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 pl-3 pr-10 border" 
                            />
                       
                    </div>
                </div>
            </div>

            <div class="grid gap-4">
                {#if filteredProjects.length === 0}
                    <div class="text-center text-gray-500 py-6">
                        ไม่พบโครงงานที่ตรงกับเงื่อนไข
                    </div>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อโครงงาน</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สมาชิก</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                {#each filteredProjects as project (project.id)}
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4">
                                            <div
                                                class="text-blue-600 hover:underline cursor-pointer font-medium"
                                                on:click={() => goToProject_Details(project)}
                                            >
                                                {project.project_name_th}
                                            </div>
                                            {#if project.project_name_en}
                                                <div class="text-sm text-gray-500 mt-1">
                                                    {project.project_name_en}
                                                </div>
                                            {/if}
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900">
                                                {#if Array.isArray(project.members)}
                                                    {project.members.map(member => 
                                                        typeof member === 'string' ? member : member.name || member.email
                                                    ).join(', ')}
                                                {:else}
                                                    {project.members || 'ไม่มีข้อมูล'}
                                                {/if}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <button
                                                on:click={() => goToRateProject(project)}
                                                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                                            >
                                                ให้คะแนน
                                            </button>
                                        </td>
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