<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { verifyJWT } from "$lib/jwt";
    import { db } from "$lib/firebase";
    import { doc, getDoc, updateDoc } from "firebase/firestore";
    import { getCookie } from "cookies-next";
    import { successToast, dangerToast, warningToast } from "$lib/customtoast";
    import Loading from "$lib/components/loading.svelte";

    let error = "";
    let projectId = "";
    let projectData = null;
    let currentUserEmail = "";
    let currentUserName = "";

    // Role information from JWT
    let roleForRating = null; // 'adviser', 'director', or null if not authorized for rating
    let currentUserIsAdviser = false;
    let currentUserIsDirector = false;

    let currentUserRating = null;
    let currentUserComments = "";

    let isLoading = true;
    let isSaving = false;

    // Score limits
    let totalDirectorScoreLimit = 0;
    let totalAdviserScoreLimit = 0;
    let perDirectorMaxScore = 0;
    let perAdviserMaxScore = 0;

    $: currentUserMaxScore = roleForRating === 'adviser' ? perAdviserMaxScore : perDirectorMaxScore;

    onMount(async () => {
        isLoading = true;
        const token = $page.url.searchParams.get('projectId');
        if (!token) {
            console.error('No token found in URL');
            error = 'ไม่พบข้อมูลโครงงาน';
            isLoading = false;
            return;
        }
        
        try {
            const payload = await verifyJWT(token);
            projectId = payload.projectId;
            
            // Get role from JWT payload
            if (payload.role) {
                roleForRating = payload.role; // 'adviser' or 'director'
                currentUserIsAdviser = roleForRating === 'adviser';
                currentUserIsDirector = roleForRating === 'director';
            } else {
                error = 'ไม่พบข้อมูลบทบาทในการให้คะแนน';
                isLoading = false;
                return;
            }
            
        } catch (err) {
            console.error('Invalid or expired token:', err);
            error = 'ข้อมูลโครงงานไม่ถูกต้อง หรือหมดอายุ';
            isLoading = false;
            goto('/TS_Dashboard/Rate');
            return;
        }

        currentUserEmail = getCookie('email');
        currentUserName = getCookie('name') || currentUserEmail;

        if (!currentUserEmail) {
            error = 'ไม่สามารถระบุผู้ใช้งานได้ กรุณาเข้าสู่ระบบ';
            isLoading = false;
            goto('/login');
            return;
        }

        if (projectId) {
            await fetchProjectDetails();
            await fetchFormSettings();
        }
        
        isLoading = false;
    });

    async function fetchProjectDetails() {
        try {
            const projectRef = doc(db, "project-approve", projectId);
            const projectSnap = await getDoc(projectRef);

            if (projectSnap.exists()) {
                projectData = { id: projectSnap.id, ...projectSnap.data() };

                // Ensure adviser and directors arrays exist and are arrays
                projectData.adviser = Array.isArray(projectData.adviser) ? projectData.adviser : [];
                projectData.directors = Array.isArray(projectData.directors) ? projectData.directors : [];

                // Find current user's existing rating data based on role
                if (roleForRating === 'adviser') {
                    const adviserEntry = projectData.adviser.find(a => a.email === currentUserEmail);
                    if (adviserEntry) {
                        currentUserRating = adviserEntry.score !== undefined ? adviserEntry.score : null;
                        currentUserComments = adviserEntry.comments || "";
                    }
                } else if (roleForRating === 'director') {
                    const directorEntry = projectData.directors.find(d => d.email === currentUserEmail);
                    if (directorEntry) {
                        currentUserRating = directorEntry.score !== undefined ? directorEntry.score : null;
                        currentUserComments = directorEntry.comments || "";
                    }
                }

                // If user is not found in the respective array, we'll add them when saving
                // This handles cases where the user might be authorized via JWT but not yet in the project arrays
                
            } else {
                error = 'ไม่พบข้อมูลโครงงาน';
            }
        } catch (err) {
            console.error("Error fetching project data:", err);
            error = 'เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน: ' + err.message;
        }
    }

    async function fetchFormSettings() {
        try {
            const response = await fetch('/api/form-data?isOpen=true');
            const formDataResponse = await response.json();
            const openForm = formDataResponse.data.find(form => form.isOpen === true);

            if (response.ok && openForm) {
                totalDirectorScoreLimit = Number(openForm.directorScoreLimit ?? 0);
                totalAdviserScoreLimit = Number(openForm.adviserScoreLimit ?? 0);

                // Calculate the score limit for each director
                const numberOfDirectors = projectData?.directors?.length || 1;
                perDirectorMaxScore = parseFloat((totalDirectorScoreLimit / numberOfDirectors).toFixed(2));

                const numberOfAdvisers = projectData?.adviser?.length || 1;
                perAdviserMaxScore = parseFloat((totalAdviserScoreLimit / numberOfAdvisers).toFixed(2));
            }
        } catch (err) {
            console.error("Error fetching form settings:", err);
        }
    }

    async function handleSaveRating() {
        if (currentUserRating === null || currentUserRating < 0 || currentUserRating > currentUserMaxScore) {
            warningToast(`กรุณาให้คะแนนระหว่าง 0 ถึง ${currentUserMaxScore}`);
            return;
        }

        if (!roleForRating) {
            dangerToast('ไม่สามารถบันทึกคะแนนได้: ไม่ได้รับสิทธิ์หรือมีข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
            return;
        }

        isSaving = true;
        try {
            const projectRef = doc(db, "project-approve", projectId);
            let dataToUpdateFirestore = {};

            const ratingData = {
                email: currentUserEmail,
                name: currentUserName,
                score: Number(currentUserRating),
                comments: currentUserComments || "",
                ratedAt: new Date().toISOString()
            };

            if (roleForRating === 'adviser') {
                // Find existing adviser or add new one
                const adviserIndex = projectData.adviser.findIndex(adv => adv.email === currentUserEmail);
                if (adviserIndex >= 0) {
                    projectData.adviser[adviserIndex] = { ...projectData.adviser[adviserIndex], ...ratingData };
                } else {
                    projectData.adviser.push(ratingData);
                }
                dataToUpdateFirestore.adviser = projectData.adviser;

            } else if (roleForRating === 'director') {
                // Find existing director or add new one
                const directorIndex = projectData.directors.findIndex(dir => dir.email === currentUserEmail);
                if (directorIndex >= 0) {
                    projectData.directors[directorIndex] = { ...projectData.directors[directorIndex], ...ratingData };
                } else {
                    projectData.directors.push(ratingData);
                }
                dataToUpdateFirestore.directors = projectData.directors;
            }

            if (Object.keys(dataToUpdateFirestore).length > 0) {
                await updateDoc(projectRef, dataToUpdateFirestore);
                successToast('บันทึกคะแนนเรียบร้อยแล้ว');
            }
        } catch (err) {
            console.error("Error saving rating:", err);
            dangerToast('เกิดข้อผิดพลาดในการบันทึกคะแนน: ' + err.message);
        } finally {
            isSaving = false;
        }
    }

    // Calculate completion percentage
    $: completedCount = (projectData?.directors?.filter(d => d.score !== undefined && d.score !== null).length || 0) + (projectData?.adviser?.filter(a => a.score !== undefined && a.score !== null).length || 0);
    $: totalDirectors = (projectData?.directors?.length || 0) + (projectData?.adviser?.length || 0);
    $: completionPercentage = totalDirectors > 0 ? Math.round((completedCount / totalDirectors) * 100) : 0;

    // Create a list of committee members for display
    let committeeMembersForDisplay = [];
    $: {
        let members = [];
        const adviserEmails = new Set();
        const allAdvisersFromProjectData = [];

        // Collect all adviser details and their emails
        if (projectData?.adviser && Array.isArray(projectData.adviser)) {
            projectData.adviser.forEach(adv => {
                if (adv && adv.email) {
                    adviserEmails.add(adv.email);
                    allAdvisersFromProjectData.push({ email: adv.email, name: adv.name || adv.email , score: adv.score});
                }
            });
        }

        // Process directors
        if (projectData?.directors) {
            members = projectData.directors.map(d => ({
                ...d,
                isAdviser: adviserEmails.has(d.email)
            }));
        }

        // Add advisers who are not already in the members list
        allAdvisersFromProjectData.forEach(adv => {
            if (!members.some(m => m.email === adv.email)) {
                members.push({
                    email: adv.email,
                    name: adv.name,
                    score: adv.score || undefined,
                    isAdviser: true,
                });
            }
        });
        committeeMembersForDisplay = members;
    }
</script>

<svelte:head>
	<title>ให้คะแนนโครงงาน: {projectData ? projectData.project_name_th : projectId}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button 
                on:click={() => goto('/TS_Dashboard/Rate')} 
                class="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                กลับไปหน้ารายการโครงงาน
            </button>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {#if error}
            <!-- Error State -->
            <div class="max-w-2xl mx-auto">
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                            <p class="mt-1 text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            </div>

        {:else if isLoading}
            <Loading />

        {:else if projectData && roleForRating}
            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left Column - Rating Form -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-2xl shadow-lg p-8">
                        <!-- Project Header -->
                        <div class="border-b border-gray-100 pb-6 mb-8">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h1 class="text-3xl font-bold text-gray-900 mb-2">ให้คะแนนโครงงาน</h1>
                                    <h2 class="text-xl text-blue-600 font-semibold mb-4">{projectData.project_name_th}</h2>
                                    
                                    <!-- User Info Badge -->
                                    <div class="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                            <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="text-sm font-medium text-gray-900">{currentUserName}</p>
                                            <p class="text-xs text-gray-600">
                                                {currentUserEmail}
                                                {#if roleForRating === 'adviser'}
                                                    <span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">อาจารย์ที่ปรึกษา</span>
                                                {:else if roleForRating === 'director'}
                                                    <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">กรรมการ</span>
                                                {/if}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Rating Form -->
                        <form on:submit|preventDefault={handleSaveRating} class="space-y-8">
                            <!-- Score Input -->
                            <div class="space-y-4">
                                <label for="rating" class="block">
                                    <span class="text-lg font-semibold text-gray-900">คะแนน</span>
                                    {#if roleForRating === 'director'}
                                        <span class="text-sm text-gray-500 ml-2">(เต็ม {currentUserMaxScore} คะแนน, จาก {totalDirectorScoreLimit} คะแนน หาร {projectData?.directors?.length || 1} คน)</span>
                                    {:else if roleForRating === 'adviser'}
                                        <span class="text-sm text-gray-500 ml-2">(เต็ม {currentUserMaxScore} คะแนน , จาก {totalAdviserScoreLimit} คะแนน หาร {projectData?.adviser?.length || 1} คน)</span>
                                    {/if}
                                    <span class="text-red-500 ml-1">*</span>
                                </label>
                                
                                <div class="relative">
                                    <input
                                        type="number"
                                        id="rating"
                                        bind:value={currentUserRating}
                                        min="0"
                                        max={currentUserMaxScore}
                                        step="0.01"
                                        required
                                        class="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                                        placeholder="0 - {currentUserMaxScore}"
                                    />
                                    <div class="absolute inset-y-0 right-5 flex items-center pr-4 pointer-events-none">
                                        <span class="text-gray-400 text-sm">/ {currentUserMaxScore}</span>
                                    </div>
                                </div>

                                <!-- Score Visual Indicator -->
                                {#if currentUserRating !== null && currentUserRating >= 0 && currentUserMaxScore > 0}
                                    <div class="mt-3">
                                        <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
                                            <span>คะแนนที่ให้</span>
                                            <span>{((currentUserRating / currentUserMaxScore)*100).toFixed(2)}%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                class="h-2 rounded-full transition-all duration-300 {(currentUserRating / currentUserMaxScore)*100 >= 80 ? 'bg-green-500' : (currentUserRating / currentUserMaxScore)*100 >= 60 ? 'bg-yellow-500' : 'bg-red-500'}"
                                                style="width: {Math.min((currentUserRating / currentUserMaxScore)*100, 100)}%"
                                            ></div>
                                        </div>
                                    </div>
                                {/if}
                            </div>

                            <!-- Comments Input -->
                            <div class="space-y-4">
                                <label for="comments" class="block">
                                    <span class="text-lg font-semibold text-gray-900">ความคิดเห็นเพิ่มเติม</span>
                                    <span class="text-sm text-gray-500 ml-2">(ถ้ามี)</span>
                                </label>
                                <textarea
                                    id="comments"
                                    bind:value={currentUserComments}
                                    rows="5"
                                    class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 resize-none transition-colors"
                                    placeholder="ข้อเสนอแนะ จุดเด่น จุดที่ควรปรับปรุง หรือความคิดเห็นอื่นๆ..."
                                ></textarea>
                            </div>

                            <!-- Submit Button -->
                            <div class="pt-6">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    {#if isSaving}
                                        <div class="flex items-center justify-center">
                                            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                            กำลังบันทึก...
                                        </div>
                                    {:else}
                                        <div class="flex items-center justify-center">
                                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                            </svg>
                                            บันทึกคะแนน
                                        </div>
                                    {/if}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Right Column - Progress & Directors Status -->
                <div class="space-y-6">
                    <!-- Progress Card -->
                    <div class="bg-white rounded-2xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">ความคืบหน้าการให้คะแนน</h3>
                        
                        <div class="text-center mb-4">
                            <div class="text-3xl font-bold text-blue-600 mb-1">
                                {completedCount}/{totalDirectors}
                            </div>
                            <p class="text-sm text-gray-600">กรรมการให้คะแนนแล้ว</p>
                        </div>

                        <div class="mb-4">
                            <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>ความคืบหน้า</span>
                                <span>{completionPercentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    class="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                    style="width: {completionPercentage}%"
                                ></div>
                            </div>
                        </div>

                        {#if completionPercentage === 100}
                            <div class="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                </svg>
                                <span class="text-sm font-medium text-green-800">การให้คะแนนเสร็จสมบูรณ์</span>
                            </div>
                        {/if}
                    </div>

                    <!-- Directors Status -->
                    {#if committeeMembersForDisplay.length > 0}
                        <div class="bg-white rounded-2xl shadow-lg p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">สถานะกรรมการ</h3>
                            
                            <div class="space-y-3">
                                {#each committeeMembersForDisplay as member (member.email)}
                                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <p class="font-medium text-gray-900 text-sm">
                                                    {member.name || member.email}
                                                    {#if member.email === currentUserEmail}
                                                        <span class="text-blue-600">(คุณ)</span>
                                                    {/if}
                                                    {#if member.isAdviser}
                                                        <br><span class="text-green-600">(ที่ปรึกษา)</span>
                                                    {/if}
                                                </p>
                                                {#if member.score !== undefined && member.score !== null}
                                                    <p class="text-xs text-gray-600">คะแนน: {member.score}/{member.isAdviser ? perAdviserMaxScore : perDirectorMaxScore}</p>
                                                {/if}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            {#if member.score !== undefined && member.score !== null}
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                                    </svg>
                                                    เสร็จแล้ว
                                                </span>
                                            {:else}
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                                                    </svg>
                                                    รอดำเนินการ
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

        {:else if !isLoading} 
            <!-- Fallback State -->
            <div class="text-center py-24">
                <h1 class="text-2xl font-bold text-gray-900 mb-4">Project ID: {projectId}</h1>
                <p class="text-gray-500">กำลังเตรียมข้อมูล...</p>
            </div>
        {/if}
    </div>
</div>