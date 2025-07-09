<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { verifyJWT } from "$lib/jwt";
    import { dangerToast, successToast, warningToast } from "$lib/customtoast";
    import Loading from "$lib/components/loading.svelte";

    let error = "";
    let projectId = "";
    let role = "";
    let isLoading = true;
    let maxScore = 0;
    let currentScore = 0;
    let isSaving = false;
    let projectname = "";

    onMount(async () => {
        const token = $page.url.searchParams.get('projectId');
        if (!token) {
            console.error('No token found in URL');
            dangerToast(`ไม่พบข้อมูลโครงงาน`);
            isLoading = false;
            return;
        }
        
        try {
            const payload = await verifyJWT(token);
            projectId = payload.projectId;
            role = payload.role;
            projectname = payload.projectname;
            
            
        } catch (err) {
            console.error('Invalid or expired token:', err);
            dangerToast(`ข้อมูลโครงงานไม่ถูกต้อง หรือหมดอายุ ${error}`);
            isLoading = false;
            return;
        }

        try {
            // Fetch form data to get maxScore
            const respond = await fetch('/api/form-data?isOpen=true');
            const data = await respond.json();
            if (data.data && data.data[0].subjectScoreLimit) {
                maxScore = parseInt(data.data[0].subjectScoreLimit);
            }

            // Load existing score from Firebase if available
            await loadExistingScore();
            
            isLoading = false;
        } catch (error) {
            console.error('Error loading data:', error);
            dangerToast(`เกิดข้อผิดพลาดในการโหลดข้อมูล ${error}` );
            isLoading = false;
        }
    });

    async function loadExistingScore() {
        try {
           const respond = await fetch(`/api/project-data/${projectId}`);
            const data = await respond.json();
            //console.log(data);
            if (data.data) {
                currentScore = data.data.score_from_subject_teacher || 0;
            }else {
                currentScore = 0;
            }

        } catch (error) {
            console.error('Error loading existing score:', error);
        }
    }

    async function saveProjectScore() {
        if (currentScore < 0 || currentScore > maxScore) {
            warningToast(`คะแนนต้องอยู่ระหว่าง 0 ถึง ${maxScore}`);
            return;
        }

        isSaving = true;

        try {

            // Send to API
            const response = await fetch(`/api/project-data/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    score_from_subject_teacher: currentScore,
                })
            });

            if (response.ok) {
                successToast("บันทึกข้อมูลสำเร็จ");
            } else {
                throw new Error('API Error');
            }
        } catch (error) {
            console.error('Error saving score:', error);
            dangerToast(`เกิดข้อผิดพลาดในการบันทึกข้อมูล ${error}`);
        } finally {
            isSaving = false;
        }
    }

    function goBack() {
        window.history.back();
    }

</script>

<div class="h-[calc(100vh-7rem)] bg-white flex items-center justify-center p-4 relative">
    <!-- Back Button -->
    <button 
        class="absolute top-6 left-6 z-10 group flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        on:click={goBack}
    >
        <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16l-4-4m0 0l4-4m-4 4h18"/>
        </svg>
        <span>ย้อนกลับ</span>
    </button>

    {#if isLoading}
        <div class="flex flex-col items-center gap-4">
            <Loading />
        </div>
    {:else}
        <div class="w-full max-w-4xl">
            <!-- Header -->
            <div class="text-center mb-16">
           
                <h1 class="text-2xl font-light text-gray-900">ให้คะแนนโครงงาน</h1>
            </div>

            <!-- Main Content -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <!-- Left Side - Scoring Section -->
                <div class="order-2 md:order-2">
                    <!-- Score Input -->
                    <div class="mb-12">
                        <div class="relative">
                            <input 
                                type="number" 
                                min="0" 
                                max={maxScore}
                                bind:value={currentScore}
                                class="w-full text-center text-6xl font-extralight text-gray-900 bg-transparent border-none outline-none placeholder-gray-300"
                                placeholder="0"
                            />
                            <div class="absolute inset-x-0 bottom-0 h-px bg-gray-200"></div>
                        </div>
                        <div class="text-center mt-4">
                            <span class="text-sm text-gray-400">จาก {maxScore} คะแนน</span>
                        </div>
                    </div>


                    <!-- Action Button -->
                    <div class="text-center">
                        <button 
                            class="group relative w-full py-4 text-sm shadow-lg font-medium text-gray-900 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 disabled:text-gray-400 disabled:border-gray-100 disabled:cursor-not-allowed"
                            on:click={saveProjectScore}
                            disabled={isSaving}
                        >
                            <div class="flex items-center justify-center gap-3 ">
                                {#if isSaving}
                                    <div class="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                    <span>กำลังบันทึก</span>
                                {:else}
                                    <span>บันทึกคะแนน</span>
                                    <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                                    </svg>
                                {/if}
                            </div>
                        </button>
                    </div>

                    <!-- Footer -->
                    <div class="text-center mt-8">
                        <p class="text-xs text-gray-400">ตรวจสอบคะแนนก่อนบันทึก</p>
                    </div>
                </div>

                <!-- Right Side - Project Information -->
                <div class="order-1 md:order-1">
                    <div class="space-y-8">
                        <div>
                            <h2 class="text-xs uppercase tracking-wide text-gray-400 mb-2">โครงงาน</h2>
                            <p class="text-xl font-light text-gray-900 leading-relaxed">{projectname}</p>
                        </div>
                        
                        <div class="h-px bg-gray-100"></div>
                        
                        <div>
                            <h3 class="text-xs uppercase tracking-wide text-gray-400 mb-2">คะแนนเต็ม</h3>
                            <p class="text-3xl font-extralight text-gray-900">{maxScore}</p>
                        </div>
                    
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>

    /* Remove input number arrows */
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }
</style>