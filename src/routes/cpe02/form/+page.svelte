<script>
  import { db, storage } from "$lib/firebase";
  import { collection, addDoc } from "firebase/firestore";
  import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getCookie } from "cookies-next/client";
  import { checkAuthStatus } from "$lib/auth";
  import { fade } from "svelte/transition";
  // Removed style.css import if styles are primarily Tailwind now
  // import "./style.css";
  import Topic1_3 from "./topic1_3.svelte";
  import Topic4_6 from "./topic4_6.svelte";
  import Topic7_9 from "./topic7_9.svelte";
  import Topic10_12 from "./topic10_12.svelte";
  import { warningToast , successToast, dangerToast} from "$lib/customtoast";
  import { verifyJWT , createJWT } from "$lib/jwt.ts"; // Import your JWT verification function
  import { page } from "$app/stores";

  export let data; // รับค่าจาก `+page.js`

  let term = data.termId; // กำหนดค่า term จาก URL
  let project_name_th = ""; //ชื่อโปรเจค ไทย
  let project_name_en = ""; //ชื่อโปรเจค eng
  let adviser = []; // ที่ปรึกษา
  let project_problem = ""; //4.	ที่มาและความสำคัญของปัญหา
  let email = "";
  let isLoading = false;
  let External_consultant = ""; // ที่ปรึกษาภายนอก
  let Tasks = {}; //comment advisor
  let scope = ""; //ขอบเขต
  let project_Objective = ""; //5.	วัตถุประสงค์ของโครงงาน
  let research_data = ""; //งานวิจัยที่เกี่ยวข้อง
  let Theory_principles = ""; //7.	ทฤษฎีและหลักการ
  let members = [""]; // ตัวแปรสำหรับเก็บสมาชิกที่เพิ่มเข้ามา
  let benefits = ""; // ผลที่คาดว่าจะได้รับ
  let currentStep = 0;
  let refer = ""; // อ้างอิง
  let budgetItems ; // รายการงบประมาณ

  let selectedFiles = [];
  let imagePreviews = [];
  let uploadedImageUrls = []; // เพิ่มตัวแปรสำหรับเก็บ URL ที่อัพโหลดแล้ว
  let fileInput;

  // Gantt Chart Data
  let tableTitle = "แผนและระยะเวลาดำเนินงาน (เดือน / พ.ศ.)"; // More descriptive default
  let monthLabels = ["ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ."]; // Shorter month names
  let activities = [
    {
      id: 1,
      name: "ศึกษาข้อมูลและหัวข้อโครงงาน", // Example initial activity
      months: Object.fromEntries(monthLabels.map((month, index) => [month, index < 2])), // Example initial state
      color: "#4F46E5", // Example color (Indigo)
    },
     {
      id: 2,
      name: "เสนอหัวข้อโครงงาน",
      months: Object.fromEntries(monthLabels.map((month, index) => [month, index === 2])),
      color: "#10B981", // Example color (Emerald)
    },
    {
      id: 3,
      name: "วิเคราะห์ ออกแบบและพัฒนาโครงงาน",
      months: Object.fromEntries(monthLabels.map((month, index) => [month, index > 2])),
      color: "#FBBF24", // Example color (Amber)
    },
    {
      id: 4,
      name: "ทดสอบ ปรับปรุงและประเมินผล",
      months: Object.fromEntries(monthLabels.map((month, index) => [month, index > 4])),
      color: "#EF4444", // Example color (Red)
    },
    {
      id: 5,
      name: "ทำปริญญานิพนธ์ และเอกสารอื่นๆ",
      months: Object.fromEntries(monthLabels.map((month, index) => [month, index > 5])),
      color: "#3B82F6", // Example color (Blue)
    },
  ];

  const steps = [
    { title: "ข้อมูลทั่วไป", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { title: "ปัญหาและวัตถุประสงค์", icon: "M9.663 3.581a1 1 0 011.674 0l8 11.999A1 1 0 0118.5 17H2.5a1 1 0 01-.837-1.42l8-11.999zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-4a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" },
    { title: "วิธีดำเนินงานและขอบเขต", icon: "M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm4 10h8v-2H8v2zm0-4h8v-2H8v2zm0-4h8V8H8v2z" },
    { title: "ผลที่คาดว่าจะได้รับและเอกสารอ้างอิง", icon: "M9 17v-2m3 2v-4m3 4v-6m-9 4h12M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" },
  ];

  

  function navigateStep(direction) {
    if (direction === "next" && currentStep < steps.length - 1) {
      if (validateStep()) {
        currentStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on step change
      }
    } else if (direction === "prev" && currentStep > 0) {
      currentStep--;
       window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on step change
    }
  }

  function validateStep() {
    switch (currentStep) {
      case 0:
        if(!project_name_th.trim()){
          warningToast("ขั้นตอนที่ 1: กรุณากรอกชื่อโครงงานภาษาไทย");
          return false;
        }
        if(!project_name_en.trim()){
          warningToast("ขั้นตอนที่ 1: กรุณากรอกชื่อโครงงานภาษาอังกฤษ");
          return false;
        }
        if(!term){
          warningToast("ขั้นตอนที่ 1: ไม่พบข้อมูลภาคเรียน"); // Changed message slightly
          return false;
        }
        if(members.some((m) => !m.trim())){
          warningToast("ขั้นตอนที่ 1: กรุณากรอกชื่อสมาชิกโครงงานให้ครบถ้วน (ห้ามเว้นว่าง)");
          return false;
        }
        /*
        if(adviser.length === 0){
          warningToast("ขั้นตอนที่ 1: กรุณาเลือกอาจารย์ที่ปรึกษาโครงงานอย่างน้อย 1 ท่าน");
          return false;
        }*/
        break;
      case 1:
        if (!project_problem.trim()) {
          warningToast("ขั้นตอนที่ 2: กรุณากรอกที่มาและความสำคัญของปัญหา");
          return false;
        }
        if (!project_Objective.trim()) {
          warningToast("ขั้นตอนที่ 2: กรุณากรอกวัตถุประสงค์ของโครงงาน");
          return false;
        }
        if (!research_data.trim()) {
          warningToast("ขั้นตอนที่ 2: กรุณากรอกข้อมูลงานวิจัยที่เกี่ยวข้อง");
          return false;
        }
        break;
      case 2:
         if (!Theory_principles.trim()) {
           warningToast("ขั้นตอนที่ 3: กรุณากรอกทฤษฎีและหลักการ");
           return false;
         }
         if (!scope.trim()) {
           warningToast("ขั้นตอนที่ 3: กรุณากรอกขอบเขตของโครงงาน");
           return false;
        }
        // Moved Gantt chart validation here
        if (activities.length === 0 || activities.some(a => !a.name.trim())) {
            warningToast("ขั้นตอนที่ 3: กรุณาเพิ่มกิจกรรมและใส่ชื่อกิจกรรมในแผนการดำเนินงาน");
            return false;
        }
         // Optional: Check if at least one image is selected if required
         // if (imagePreviews.length === 0) {
         //   alert("ขั้นตอนที่ 3: กรุณาอัปโหลดรูปภาพประกอบอย่างน้อย 1 รูป");
         //   return false;
         // }
        break;
      case 3:
        if(!benefits.trim()) {
          warningToast("ขั้นตอนที่ 4: กรุณากรอกประโยชน์ที่คาดว่าจะได้รับ");
          return false;
        }
        if(!refer.trim()) {
          warningToast("ขั้นตอนที่ 4: กรุณากรอกเอกสารอ้างอิง");
          return false;
        }
        if(!budgetItems || budgetItems.length === 0) {
          warningToast("ขั้นตอนที่ 4: กรุณากรอกข้อมูลรายการงบประมาณ");
          return false;
        }
        // Add validation for Topic10_12 content if needed
        // Example: if (!expectedOutcome.trim()) { warningToast("ขั้นตอนที่ 4: กรุณากรอกผลที่คาดว่าจะได้รับ"); return false; }
        break;
    }
    return true;
  }


  onMount(async () => {
    const isUserLoggedIn = await checkAuthStatus();
    const token = $page.url.searchParams.get('token');

    if (isUserLoggedIn) {
      email = getCookie("email");
    } else {
      warningToast("กรุณาเข้าสู่ระบบเพื่อกรอกข้อมูล");
      goto("/login"); // Redirect back after login
    }

	if (!token) {
		console.error('No token found in URL');
        goto("/cpe02"); // Redirect to login if token is missing
		dangerToast('ไม่พบข้อมูลภาคการศึกษา');
		return; // Stop further execution
	}
	try {
		const payload = await verifyJWT(token);
		term = payload.term; // Extract term from payload
		//console.log('Decoded payload:', payload);
	} catch (err) {
		console.error('Invalid or expired token:', err);
        goto("/cpe02"); // Redirect to login if token is invalid
        dangerToast('ข้อมูลภาคการศึกษาไม่ถูกต้อง');
		return; // Stop further execution
	}
  });

  async function navigateWithToken(projectId) {
		try {
			const payload = { projectId };
			const token = await createJWT(payload);
			//console.log('Token:', token);
			goto(`/cpe02/data/term/project-detail?token=${token}`);
		} catch (err) {
			console.error('Error creating JWT:', err);
			// Handle error appropriately, e.g., display an error message to the user
		}
	}

  function handleTab(event, bindVariableSetter) {
    // Keep your existing handleTab logic
    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = event.target;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      textarea.value = textarea.value.substring(0, start) + "\t" + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      bindVariableSetter(textarea.value);
    }
  }

  async function handleSubmit() {
    // Final validation before submitting
    if (!validateStep()) { // Validate the current (last) step
        return;
    }
    if(checkAuthStatus()){ // Double check auth
      isLoading = true;
      try {
        const imageUrls = await uploadImages();
        const Operation_Schedule = { tableTitle, monthLabels, activities };

        const docRef = await addDoc(collection(db, "project-approve"), {
          term,
          project_name_th: project_name_th.trim(),
          project_name_en: project_name_en.trim(),
          members: members.map(m => m.trim()).filter(m => m), // Trim and remove empty
          adviser: adviser, // Trim and remove empty
          project_problem: project_problem.trim(),
          email,
          External_consultant: External_consultant.trim(),
          Tasks, // Should be initialized properly if needed
          project_Objective: project_Objective.trim(),
          research_data: research_data.trim(),
          Theory_principles: Theory_principles.trim(),
          images: imageUrls,
          scope: scope.trim(),
          Operation_Schedule,
          benefits: benefits.trim(),
          refer: refer.trim(),
          budgetItems: budgetItems.map(item => ({
            ...item,
            amount: parseFloat(item.amount) || 0, // Ensure amount is a number
          })),
          createdAt: new Date() // Add a timestamp
        });

        // Use a more modern notification system if available (e.g., svelte-toast)
        successToast(`เพิ่มข้อมูลโครงงาน "${project_name_th}" สำเร็จ!`);
        // Consider redirecting to the newly created project page or the list view
        const projectId = docRef.id; // Get the document ID
        navigateWithToken(projectId); // Redirect to the term page with token

      } catch (error) {
        console.error("Error adding document: ", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
      } finally {
        isLoading = false;
      }
    } else {
         warningToast("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
         goto("/login?redirect=/cpe02/form/" + term);
    }
  }

  async function uploadImages() {
    // Keep your existing uploadImages logic, maybe add progress indication?
    const urls = [];
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    for (let preview of imagePreviews) {
      const file = preview.originalFile;
      if (file.size > MAX_SIZE_BYTES) {
        warningToast(`ไฟล์ "${file.name}" มีขนาดเกิน ${MAX_SIZE_MB}MB และไม่สามารถอัปโหลดได้`);
        continue;
      }
      const timestamp = Date.now();
      const uniqueFileName = `${email.split('@')[0]}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`; // Sanitize filename
      const storageRef = ref(storage, `project-images/${term}/${uniqueFileName}`); // Organize by term

      try {
        // Consider showing upload progress per file if needed
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        urls.push({
          url: downloadURL,
          name: uniqueFileName,
          title: preview.title || file.name, // Use original filename if no title
        });
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        // Consider collecting errors and showing a summary
        warningToast(`เกิดข้อผิดพลาดในการอัปโหลดไฟล์ "${file.name}": ${error.message}`);
        // Decide if you want to stop the whole process or just skip the file
        throw error; // Re-throw to stop the submission process if an upload fails
      }
    }
    return urls;
  }

</script>

<svelte:head>
  <title>กรอกแบบเสนอโครงงาน CE02</title>
  <meta name="description" content="แบบเสนอโครงงาน CE02 - จัดการแบบฟอร์มเสนอหัวข้อโครงงานคอมพิวเตอร์ของคุณ" />
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

<!-- Main container with padding and background -->
<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 py-8 md:py-12 px-4" transition:fade={{ duration: 300 }}>
  <!-- Form Card -->
  <form
    on:submit|preventDefault={handleSubmit}
    class="relative max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden"
  >
    <!-- Form Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 text-white">
        <h1 class="text-xl sm:text-2xl font-bold">แบบเสนอโครงงาน (CE02)</h1>
        <p class="text-sm text-indigo-100 mt-1">ภาคเรียน: {term}</p>
    </div>

    <!-- Progress Steps -->
    <nav aria-label="Progress" class="border-b border-gray-200">
      <ol role="list" class="flex justify-between">
        {#each steps as step, index}
          <li class={`flex-1 group ${index === 0 ? '' : 'border-l'} border-gray-200`}>
            <a
              href="#!"
              on:click|preventDefault={() => { /* Allow clicking previous steps? */ if (index < currentStep) currentStep = index; }}
              class="flex flex-col items-center p-3 sm:p-4 text-center transition-colors duration-200 ease-in-out h-full
                     ${currentStep === index
                       ? 'border-b-2 border-indigo-600 text-indigo-600'
                       : currentStep > index
                         ? 'text-green-600 hover:bg-green-50'
                         : 'text-gray-500 hover:bg-gray-50'}"
            >
              <svg class="w-6 h-6 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                 {#if currentStep > index}
                    <!-- Checkmark for completed -->
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 {:else}
                    <!-- Step Icon -->
                    <path stroke-linecap="round" stroke-linejoin="round" d={step.icon} />
                 {/if}
              </svg>
              <span class="text-xs sm:text-sm font-medium">{step.title}</span>
            </a>
          </li>
        {/each}
      </ol>
    </nav>

    <!-- Form Content Area -->
    <div class="p-5 sm:p-8">
      <!-- Use svelte:component for dynamic rendering based on step -->
      {#if currentStep === 0}
        <div in:fade={{ duration: 250 }}>
          <Topic1_3
            bind:term
            bind:project_name_th
            bind:project_name_en
            bind:members
            bind:adviser
            bind:External_consultant
            
          />
        </div>
      {:else if currentStep === 1}
        <div in:fade={{ duration: 250 }}>
          <Topic4_6 bind:project_problem bind:project_Objective {handleTab} bind:research_data/>
        </div>
      {:else if currentStep === 2}
        <div in:fade={{ duration: 250 }}>
          <Topic7_9
            
            bind:Theory_principles
            bind:imagePreviews
            bind:selectedFiles
            bind:fileInput
            bind:scope
            bind:tableTitle
            bind:monthLabels
            bind:activities
            {handleTab}
          />
        </div>
      {:else if currentStep === 3}
        <div in:fade={{ duration: 250 }}>
          <Topic10_12
          {handleTab}
          bind:benefits
          bind:refer
          bind:budgetItems
          />
        </div>
      {/if}
    </div>

    <!-- Navigation Buttons Footer -->
    <div class="px-5 sm:px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
      <button
        type="button"
        class={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-opacity duration-300
                    ${currentStep === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        on:click={() => navigateStep("prev")}
        disabled={currentStep === 0 || isLoading}
      >
         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
           <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
         </svg>
        ย้อนกลับ
      </button>

      <button
  type="button"
  class="inline-flex items-center justify-center px-6 py-2 rounded-md text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-70 disabled:cursor-not-allowed
                bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
  on:click={() => {
    if (currentStep < steps.length - 1) {
      navigateStep("next");
    } else {
      handleSubmit(); 
    }
  }}
  disabled={isLoading}
>
        {#if isLoading}
          {currentStep === steps.length - 1 ? "กำลังบันทึก..." : "กำลังโหลด..."}
        {:else if currentStep === steps.length - 1}
          บันทึกข้อมูล
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
             <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /> <!-- Check icon for save -->
          </svg>
        {:else}
          ถัดไป
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        {/if}
      </button>
    </div>

     <!-- Optional: Loading Overlay -->
     {#if isLoading}
       <div class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
       </div>
     {/if}

  </form>
</div>

<!-- Removed the custom SVG shape divider for a cleaner look -->
<!-- If you want it back, uncomment the style block and the div -->
<!--
<div class="custom-shape-divider-bottom-1737391877" transition:fade={{ duration: 500 }}>
  <svg ...> ... </svg>
</div>
<style> ... </style>
-->
