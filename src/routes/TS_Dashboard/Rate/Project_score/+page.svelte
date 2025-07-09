<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { verifyJWT } from "$lib/jwt";
    import {  doc,  getDoc } from 'firebase/firestore';
    import { db } from "$lib/firebase";

    let error = "";
    let projectId = "";
    let role = "";
    let isLoading = true;
    let maxScore = 0;
    let currentScore = 0;
    let feedback = "";
    let isSaving = false;
    let saveMessage = "";
    let projectname = "";

    onMount(async () => {
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
            role = payload.role;
            projectname = payload.projectname;
            
            
        } catch (err) {
            console.error('Invalid or expired token:', err);
            error = 'ข้อมูลโครงงานไม่ถูกต้อง หรือหมดอายุ';
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
            error = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
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
            alert(`คะแนนต้องอยู่ระหว่าง 0 ถึง ${maxScore}`);
            return;
        }

        isSaving = true;
        saveMessage = "";

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
                saveMessage = "บันทึกข้อมูลสำเร็จ";
                setTimeout(() => {
                    saveMessage = "";
                }, 3000);
            } else {
                throw new Error('API Error');
            }
        } catch (error) {
            console.error('Error saving score:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            isSaving = false;
        }
    }

</script>

<div class="container">
    {#if isLoading}
        <div class="loading">
            <div class="spinner"></div>
            <p>กำลังโหลดข้อมูล...</p>
        </div>
    {:else if error}
        <div class="error">
            <h2>เกิดข้อผิดพลาด</h2>
            <p>{error}</p>
        </div>
    {:else}
        <div class="scoring-form">
            <h1>ให้คะแนนโปรเจค</h1>
            
            <div class="project-info">
                <div class="info-item">
                    <label>ชื่อโครงงาน :</label>
                    <span>{projectname}</span>
                </div>
          
                <div class="info-item">
                    <label>คะแนนเต็ม :</label>
                    <span>{maxScore} คะแนน</span>
                </div>
            </div>

            <div class="score-section">
                <div class="score-input-group">
                    <label for="score">คะแนน:</label>
                    <input 
                        type="number" 
                        id="score"
                        min="0" 
                        max={maxScore}
                        bind:value={currentScore}
                        class="score-input"
                    />
                    <span class="score-limit">/ {maxScore}</span>
                </div>

                <div class="score-slider">
                    <input 
                        type="range" 
                        min="0" 
                        max={maxScore}
                        bind:value={currentScore}
                        class="slider"
                    />
                </div>

            </div>

            <div class="action-section">
                <button 
                    class="save-btn" 
                    on:click={saveProjectScore}
                    disabled={isSaving}
                >
                    {#if isSaving}
                        <span class="btn-spinner"></span>
                        กำลังบันทึก...
                    {:else}
                        บันทึกคะแนนโปรเจค
                    {/if}
                </button>

                {#if saveMessage}
                    <div class="save-message success">
                        {saveMessage}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        font-family: 'Kanit', sans-serif;
    }

    .loading {
        text-align: center;
        padding: 40px;
    }

    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error {
        background-color: #f8d7da;
        color: #721c24;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
    }

    .scoring-form {
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h1 {
        text-align: center;
        color: #2c3e50;
        margin-bottom: 30px;
        font-size: 2rem;
    }

    .project-info {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
    }

    .info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding: 8px 0;
        border-bottom: 1px solid #e9ecef;
    }

    .info-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
    }

    .info-item label {
        font-weight: 600;
        color: #495057;
    }

    .info-item span {
        color: #6c757d;
    }

    .score-section {
        margin-bottom: 30px;
    }

    .score-input-group {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .score-input-group label {
        font-weight: 600;
        color: #495057;
        min-width: 80px;
    }

    .score-input {
        padding: 8px 12px;
        border: 2px solid #e9ecef;
        border-radius: 6px;
        font-size: 1.1rem;
        width: 100px;
        text-align: center;
    }

    .score-input:focus {
        outline: none;
        border-color: #3498db;
    }

    .score-limit {
        font-size: 1.1rem;
        color: #6c757d;
        font-weight: 600;
    }

    .score-slider {
        margin-bottom: 20px;
    }

    .slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #e9ecef;
        outline: none;
        -webkit-appearance: none;
    }

    .slider::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #3498db;
        cursor: pointer;
    }

    .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #3498db;
        cursor: pointer;
        border: none;
    }

    .score-display {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .score-bar {
        flex: 1;
        height: 20px;
        background: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
    }

    .score-fill {
        height: 100%;
        background: linear-gradient(90deg, #e74c3c 0%, #f39c12 50%, #27ae60 100%);
        transition: width 0.3s ease;
    }

    .score-percentage {
        font-size: 1.2rem;
        font-weight: 600;
        color: #2c3e50;
        min-width: 50px;
    }

    .feedback-section {
        margin-bottom: 30px;
    }

    .feedback-section label {
        display: block;
        margin-bottom: 10px;
        font-weight: 600;
        color: #495057;
    }

    .feedback-textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid #e9ecef;
        border-radius: 6px;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        min-height: 100px;
    }

    .feedback-textarea:focus {
        outline: none;
        border-color: #3498db;
    }

    .action-section {
        text-align: center;
    }

    .save-btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 6px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .save-btn:hover:not(:disabled) {
        background: #2980b9;
    }

    .save-btn:disabled {
        background: #95a5a6;
        cursor: not-allowed;
    }

    .btn-spinner {
        border: 2px solid transparent;
        border-top: 2px solid white;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        animation: spin 1s linear infinite;
    }

    .save-message {
        margin-top: 15px;
        padding: 10px;
        border-radius: 6px;
        font-weight: 600;
    }

    .save-message.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    @media (max-width: 600px) {
        .container {
            padding: 10px;
        }

        .scoring-form {
            padding: 20px;
        }

        .score-input-group {
            flex-direction: column;
            align-items: stretch;
        }

        .score-input-group label {
            min-width: auto;
            margin-bottom: 5px;
        }

        .score-display {
            flex-direction: column;
            gap: 10px;
        }

        .score-percentage {
            text-align: center;
        }
    }
</style>