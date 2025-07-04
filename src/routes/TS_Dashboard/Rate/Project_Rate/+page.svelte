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

    // Replaced directorEntry with more specific role checking
    let currentUserIsAdviser = false; // Is the current user an adviser for THIS project
    let currentUserIsDirector = false; // Is the current user a director for THIS project
    let roleForRating = null; // 'adviser', 'director', or null if not authorized for rating

    let currentUserRating = null;
    let currentUserComments = "";

    let isLoading = true;
    let isSaving = false;

    // Score limits
    let totalDirectorScoreLimit = 0; // The total score for all directors (e.g., 40)
    let adviserMaxScore = 0;
    let perDirectorMaxScore = 0; // The calculated score for a single director
    $: currentUserMaxScore = roleForRating === 'adviser' ? adviserMaxScore : perDirectorMaxScore;

    onMount(async () => {
        isLoading = true;
        const token = $page.url.searchParams.get('projectId');
		if (!token) {
			console.error('No token found in URL');
        }
        
		try {
			const payload = await verifyJWT(token);
			projectId = payload.projectId;
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
            await fetchProjectDetailsAndDetermineRole();
            await fetchFormSettings(); // Fetch form settings for max score
        }
        
        isLoading = false;
    });

    async function fetchProjectDetailsAndDetermineRole() {
        try {
            const projectRef = doc(db, "project-approve", projectId);
            const projectSnap = await getDoc(projectRef);

            if (projectSnap.exists()) {
                projectData = { id: projectSnap.id, ...projectSnap.data() };

                // Ensure adviser and directors arrays exist and are arrays
                projectData.adviser = Array.isArray(projectData.adviser) ? projectData.adviser : [];
                projectData.directors = Array.isArray(projectData.directors) ? projectData.directors : [];

                const adviserEntryForCurrentUser = projectData.adviser.find(a => a.email === currentUserEmail);
                const directorEntryForCurrentUser = projectData.directors.find(d => d.email === currentUserEmail);

                currentUserIsAdviser = !!adviserEntryForCurrentUser;
                currentUserIsDirector = !!directorEntryForCurrentUser;

                if (currentUserIsAdviser) {
                    roleForRating = 'adviser';
                    currentUserRating = adviserEntryForCurrentUser.score !== undefined ? adviserEntryForCurrentUser.score : null;
                    currentUserComments = adviserEntryForCurrentUser.comments || "";
                } else if (currentUserIsDirector) {
                    roleForRating = 'director';
                    currentUserRating = directorEntryForCurrentUser.score !== undefined ? directorEntryForCurrentUser.score : null;
                    currentUserComments = directorEntryForCurrentUser.comments || "";
                } else {
                    error = 'คุณไม่ได้รับสิทธิ์ในการให้คะแนนโครงงานนี้ (ไม่พบอีเมลของคุณในรายชื่อกรรมการหรืออาจารย์ที่ปรึกษาของโครงงานนี้)';
                    roleForRating = null;
                }
            } else {
                error = 'ไม่พบข้อมูลโครงงาน';
                roleForRating = null;
            }
        } catch (err) {
            console.error("Error fetching project data:", err);
            error = 'เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน: ' + err.message;
            roleForRating = null;
        }
    }

    async function fetchFormSettings() {
        try {
            // Assuming you have an endpoint to get form settings, potentially by term?
            // Or maybe a general settings document. For now, a generic API call:
            const response = await fetch('/api/form-data?isOpen=true'); // Replace with your actual endpoint
            const formDataResponse = await response.json();
            const openForm = formDataResponse.data.find(form => form.isOpen === true);

            if (response.ok) {
                if (openForm) {
                    totalDirectorScoreLimit = Number(openForm.directorScoreLimit ?? 0);
                    adviserMaxScore = Number(openForm.adviserScoreLimit ?? 0);

                    // Calculate the score limit for each director
                    const numberOfDirectors = projectData?.directors?.length || 0;
                    if (numberOfDirectors > 0) {
                        // Using toFixed(2) to handle potential floating point issues, then converting back to number
                        perDirectorMaxScore = parseFloat((totalDirectorScoreLimit / numberOfDirectors).toFixed(2));
                    } else {
                        // Fallback if for some reason there are no directors assigned, though this shouldn't happen for a director rating.
                        perDirectorMaxScore = totalDirectorScoreLimit; 
                    }
                }
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
        // Check if user is authorized to rate (roleForRating would be set)
        if (!roleForRating) {
            dangerToast('ไม่สามารถบันทึกคะแนนได้: ไม่ได้รับสิทธิ์หรือมีข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
            return;
        }

        isSaving = true;
        try {
            const projectRef = doc(db, "project-approve", projectId);
            let dataToUpdateFirestore = {};

            if (roleForRating === 'adviser') {
                const updatedAdvisers = projectData.adviser.map(adv => {
                    if (adv.email === currentUserEmail) {
                        return {
                            ...adv,
                            score: Number(currentUserRating),
                            comments: currentUserComments || "",
                            ratedAt: new Date().toISOString()
                        };
                    }
                    return adv;
                });
                dataToUpdateFirestore.adviser = updatedAdvisers;
                projectData.adviser = updatedAdvisers; // Update local reactive data

            } else if (roleForRating === 'director') {
                const updatedDirectors = projectData.directors.map(dir => {
                    if (dir.email === currentUserEmail) {
                        return {
                            ...dir,
                            score: Number(currentUserRating),
                            comments: currentUserComments || "",
                            ratedAt: new Date().toISOString()
                        };
                    }
                    return dir;
                });
                dataToUpdateFirestore.directors = updatedDirectors;
                projectData.directors = updatedDirectors; // Update local reactive data
            }

            if (Object.keys(dataToUpdateFirestore).length > 0) {
                await updateDoc(projectRef, dataToUpdateFirestore);
                successToast('บันทึกคะแนนเรียบร้อยแล้ว');
            } else {
                warningToast('ไม่มีบทบาทที่ถูกต้องสำหรับการบันทึกคะแนน'); // Should ideally not be reached if roleForRating is validated
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

    // Create a list of committee members for display, ensuring all advisers are included
    let committeeMembersForDisplay = [];
    $: {
        let members = [];
        const adviserEmails = new Set();
        const allAdvisersFromProjectData = [];

        // 1. Collect all adviser details and their emails from projectData.adviser
        if (projectData?.adviser && Array.isArray(projectData.adviser)) {
            projectData.adviser.forEach(adv => {
                if (adv && adv.email) {
                    adviserEmails.add(adv.email);
                    allAdvisersFromProjectData.push({ email: adv.email, name: adv.name || adv.email , score: adv.score});
                }
            });
        }

        // 2. Process directors from projectData.directors
        if (projectData?.directors) {
            members = projectData.directors.map(d => ({
                ...d,
                isAdviser: adviserEmails.has(d.email) // Mark if this director is also an adviser
            }));
        }

        // 3. Add advisers (from allAdvisersFromProjectData) who are not already in the members list
        // (i.e., they are advisers but not listed as directors)
        allAdvisersFromProjectData.forEach(adv => {
            if (!members.some(m => m.email === adv.email)) {
                members.push({
                    email: adv.email,
                    name: adv.name, // Use adviser's name (or email if name is not present)
                    score: adv.score || undefined, // Adviser-only entry won't have a director's score from this form
                    isAdviser: true, // They are an adviser
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
                                            <p class="text-xs text-gray-600">{currentUserEmail}</p>
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
                                    {:else}
                                        <span class="text-sm text-gray-500 ml-2">(เต็ม {currentUserMaxScore} คะแนน)</span>
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
                                                        <br><span class="text-blue-600">(ที่ปรึกษา)</span>
                                                    {/if}
                                                </p>
                                                {#if member.score !== undefined && member.score !== null}
                                                    <p class="text-xs text-gray-600">คะแนน: {member.score}/{member.isAdviser ? adviserMaxScore : perDirectorMaxScore}</p>
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

        <!-- If not loading, no error, but still no projectData or no roleForRating, show fallback. -->
        <!-- Auth errors (like not being an adviser/director for the project) are handled by the main #if error block -->
        {:else if !isLoading} 
            <!-- Fallback State -->
            <div class="text-center py-24">
                <h1 class="text-2xl font-bold text-gray-900 mb-4">Project ID: {projectId}</h1>
                <p class="text-gray-500">กำลังเตรียมข้อมูล...</p>
            </div>
        {/if}
    </div>
</div>