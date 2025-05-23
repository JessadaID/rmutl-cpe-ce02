<script>
  // @ts-ignore
  import { onMount } from "svelte";
  import { doc, setDoc, getDoc } from "firebase/firestore";
  import { db, storage } from "$lib/firebase.js";
  import { checkAuthStatus } from "$lib/auth";
  import { getCookie } from "cookies-next";
  import { goto } from "$app/navigation";
  import {
    ref,
    deleteObject,
    uploadBytes,
    getDownloadURL,
  } from "firebase/storage";
  import Loading from "$lib/components/loading.svelte";
  import { warningToast, successToast, dangerToast } from "$lib/customtoast";
  import { page } from "$app/stores";
  import { verifyJWT, createJWT } from "$lib/jwt.ts";
  import { handleTab } from "./controller";
  import AdviserSelection from "./AdviserSelection.svelte";
  import Topic9 from "../../../../form/component/topic9.svelte";
  import Topic11 from "../../../../form/component/topic11.svelte";
  // --------- State Variables ---------
  let projectId = null;
  let project = null;
  let isNotFound = false;
  let isLoading = false;
  let email = "";
  let role = "";
  let selectedFiles = [];
  let previewUrls = [];
  let imageDescriptions = [];
  let isUploading = false;
  let fileInput;

  // --------- Adviser Variables ---------
  let adviserList = []; // { id, value (email), label (name), email, Approval }
  let noAdviserYet = false; // State for "No adviser selected yet"



  // --------- Lifecycle Methods ---------
  onMount(async () => {
    // Verify JWT token and extract projectId
    const token = $page.url.searchParams.get('token');
    if (!token) {
      dangerToast('ไม่พบข้อมูล');
      goto('/cpe02/data');
      return;
    }

    try {
      const payload = await verifyJWT(token);
      projectId = payload.projectId;
    } catch (err) {
      dangerToast('ข้อมูลไม่ถูกต้อง หรือหมดอายุ');
      goto('/cpe02/data');
      return;
    }

    // Check authentication status
    const isUserLoggedIn = await checkAuthStatus();
    if (!isUserLoggedIn) {
      warningToast("ผู้ใช้ไม่ได้เข้าสู่ระบบ กำลังเปลี่ยนเส้นทางไปเข้าสู่ระบบ...");
      goto("/login");
      return;
    }

    // Get user info from cookies
    email = getCookie("email");
    role = getCookie("role");

    // Load project data
    await loadProjectData();
    
    // Load adviser list
    await loadAdviserList();
  });

  // --------- Data Loading Functions ---------
  
  /**
   * โหลดข้อมูลโปรเจกต์จาก Firestore
   */
  async function loadProjectData() {
    try {
      const projectDoc = await getDoc(doc(db, "project-approve", projectId));
      
      if (projectDoc.exists()) {
        project = projectDoc.data();

        // Initialize Operation_Schedule if it's missing
        if (!project.Operation_Schedule) {
          project.Operation_Schedule = {
            tableTitle: "แผนและระยะเวลาดำเนินงาน (เดือน / พ.ศ.)",
            monthLabels: ["ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ."],
            activities: [], // or some default activities if needed
          };
        }
        //console.log("Project data loaded:", project);
        // Ensure project.adviser is an array
        if (!project.adviser || !Array.isArray(project.adviser)) {
          project.adviser = [];
        }
        
        // Check if no advisers are selected
        noAdviserYet = project.adviser.length === 0;
        
        // Verify access permissions
        checkAccessPermissions();
      } else {
        console.error("Project not found in Firestore.");
        isNotFound = true;
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      dangerToast(`เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน: ${error.message}`);
    }
  }

  /**
   * ตรวจสอบสิทธิ์การเข้าถึงโปรเจกต์
   */
  function checkAccessPermissions() {
    if (role !== "admin" && email !== project.email) {
      console.log("Access denied. Redirecting to restricted page...");
      goto("../../hacker_exe");
    }
  }

  /**
   * โหลดรายชื่ออาจารย์ที่ปรึกษา
   */
  async function loadAdviserList() {
    try {
      const res = await fetch(`/api/teacher-data`);
      
      if (res.ok) {
        const responseData = await res.json();
        
        if (responseData.data && Array.isArray(responseData.data)) {
          adviserList = responseData.data.map((teacher, index) => ({
            id: `adviser${index + 1}`,
            value: teacher.email,
            label: teacher.name,
            email: teacher.email,
            Approval: teacher.Approval
          }));
        }
      } else {
        throw new Error(`Failed to fetch teacher data: ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching adviser list:", error);
      dangerToast(`ไม่สามารถดึงข้อมูลอาจารย์ที่ปรึกษาได้: ${error.message}`);
    }
  }

  // --------- Member Management Functions ---------
  
  /**
   * เพิ่มช่องกรอกสมาชิกใหม่
   */
  function addMemberRow() {
    project.members = [...project.members, ""];
  }

  /**
   * ลบช่องกรอกสมาชิกแถวสุดท้าย
   */
  function deleteLastMember() {
    if (project.members.length > 1) {
      project.members = project.members.slice(0, -1);
    }
  }

  // --------- Image Handling Functions ---------
  
  /**
   * จัดการการเลือกไฟล์รูปภาพ
   */
  function handleFileSelect(event) {
    fileInput = event.target;
    const files = Array.from(event.target.files);
    selectedFiles = [...selectedFiles, ...files];

    // Generate previews for new files
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previewUrls = [...previewUrls, reader.result];
        imageDescriptions = [...imageDescriptions, ""];
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * ลบรูปภาพที่เลือกออกจากพรีวิว
   */
  function removePreview(index) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    previewUrls = previewUrls.filter((_, i) => i !== index);
    imageDescriptions = imageDescriptions.filter((_, i) => i !== index);

    if (previewUrls.length === 0 && fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * อัปโหลดรูปภาพไปยัง Firebase Storage
   */
  async function uploadImages() {
    isUploading = true;
    const uploadPromises = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const description = imageDescriptions[i];

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `project-images/${filename}`);

      // Create upload promise
      const uploadPromise = uploadBytes(storageRef, file)
        .then((snapshot) => getDownloadURL(snapshot.ref))
        .then((url) => ({
          url: url,
          title: description || "No description",
        }));

      uploadPromises.push(uploadPromise);
    }

    try {
      const uploadedImages = await Promise.all(uploadPromises);
      // Add new images to existing project images
      project.images = [...(project.images || []), ...uploadedImages];

      // Clear the upload queue
      selectedFiles = [];
      previewUrls = [];
      imageDescriptions = [];

      return true;
    } catch (error) {
      console.error("Error uploading images:", error);
      dangerToast('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ: ' + error);
      return false;
    } finally {
      isUploading = false;
    }
  }

  /**
   * ลบรูปภาพที่มีอยู่ออกจาก Firebase Storage และโปรเจกต์
   */
  async function deleteImage(imageUrl, index) {
    // Confirm before deletion
    const confirmDelete = window.confirm("คุณต้องการลบรูปภาพนี้จริงๆ หรือไม่?");
    if (!confirmDelete) {
      return;
    }

    try {
      // Delete from Firebase Storage
      const imageRef = ref(storage, imageUrl.url);
      await deleteObject(imageRef);

      // Remove from project images array
      project.images = project.images.filter((_, i) => i !== index);

      // Update project document in Firestore
      const docRef = doc(db, "project-approve", projectId);
      await setDoc(docRef, project);

      successToast("ลบรูปภาพเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error deleting image:", error);
      dangerToast("เกิดข้อผิดพลาดในการลบรูปภาพ: " + error);
    }
  }

  // --------- Form Submission Functions ---------
  
  /**
   * จัดการการส่งฟอร์มอัปเดตโปรเจกต์
   */
  async function handleSubmit(event) {
    event.preventDefault();
    isLoading = true;

    try {
      // Upload images first if there are any
      if (selectedFiles.length > 0) {
        const uploadSuccess = await uploadImages();
        if (!uploadSuccess) {
          throw new Error("การอัปโหลดรูปภาพล้มเหลว");
        }
      }

      // Update Firestore document
      const docRef = doc(db, "project-approve", projectId);
      
      // Reset task statuses
      const updatedTasks = { ...project.Tasks };
      Object.keys(updatedTasks).forEach((key) => {
        if (updatedTasks[key].status !== "approve") {
          updatedTasks[key].status = "wait";
        }
      });

      const updatedProject = {
        ...project,
        Tasks: updatedTasks,
      };

      await setDoc(docRef, updatedProject);
      successToast("แก้ไขข้อมูลเรียบร้อยแล้ว!");
      goToProjectDetailPage(projectId);
    } catch (error) {
      console.error("Error updating document:", error);
      dangerToast("เกิดข้อผิดพลาดในการอัปเดตข้อมูล: " + error);
    } finally {
      isLoading = false;
    }
  }

  /**
   * นำทางไปยังหน้ารายละเอียดโปรเจกต์
   */
  async function goToProjectDetailPage(projectId) {
    if (checkAuthStatus()) {
      const payload = { projectId };
      const token = await createJWT(payload);
      goto(`./?token=${token}`); // Navigate to parent (detail page)
    } else {
      console.log('User is not authenticated, redirecting to login.');
      warningToast('กรุณาเข้าสู่ระบบก่อนดูรายละเอียดโครงงาน');
      goto("/login");
    }
  }
</script>

<svelte:head>
  <title>แก้ไขข้อมูลโครงงาน</title>
  <meta name="description" content="แก้ไขข้อมูลโครงงาน CE02" />
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

<!-- Main container -->
<div class="min-h-screen bg-gray-100 py-8 md:py-12 px-4">
  <!-- Form Card -->
  <div class="max-w-4xl mx-auto">
    {#if isLoading && !project}
      <div class="flex justify-center items-center min-h-[60vh]">
        <Loading />
      </div>
    {:else if isNotFound}
      <div class="bg-white shadow-xl rounded-lg p-8 text-center">
        <h1 class="text-3xl font-bold text-red-600 mb-4">404 - ไม่พบโครงงาน</h1>
        <p class="text-lg text-gray-700 mb-6">ขออภัย ไม่พบข้อมูลโครงงานที่คุณกำลังค้นหา</p>
        <button
          on:click={() => goto('/cpe02/data')}
          class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          กลับไปหน้ารายการ
        </button>
      </div>
    {:else if project}
      <form
        class="bg-white shadow-xl rounded-lg overflow-hidden"
        on:submit={handleSubmit}
      >
        <!-- Form Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h1 class="text-2xl font-bold">แก้ไขข้อมูลโครงงาน</h1>
        </div>

        <!-- Form Body -->
        <div class="p-6 md:p-8 space-y-6">

          <!-- Section 1: General Information -->
          <fieldset class="space-y-4 border border-gray-300 p-4 rounded-md">
            <legend class="text-lg font-semibold text-gray-700 px-2">ข้อมูลทั่วไป</legend>

            <div>
              <label for="term" class="block text-sm font-medium text-gray-700 mb-1">ภาคเรียน <span class="text-red-500">*</span></label>
              <input
                id="term"
                name="term"
                class="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                required
                disabled
                bind:value={project.term}
              />
            </div>

            <div>
              <label for="project_name_th" class="block text-sm font-medium text-gray-700 mb-1">ชื่อโครงงาน (ภาษาไทย) <span class="text-red-500">*</span></label>
              <input
                type="text"
                id="project_name_th"
                placeholder="ระบุชื่อโครงงานภาษาไทย"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                bind:value={project.project_name_th}
              />
            </div>

            <div>
              <label for="project_name_en" class="block text-sm font-medium text-gray-700 mb-1">ชื่อโครงงาน (ภาษาอังกฤษ) <span class="text-red-500">*</span></label>
              <input
                type="text"
                id="project_name_en"
                placeholder="ระบุชื่อโครงงานภาษาอังกฤษ"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                bind:value={project.project_name_en}
              />
            </div>

            <!-- Member Management -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <label class="block text-sm font-medium text-gray-700">ชื่อผู้เสนอโครงงาน <span class="text-red-500">*</span></label>
                <div class="flex space-x-2">
                  <button
                    type="button"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                    on:click={addMemberRow}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                    เพิ่ม
                  </button>
                  {#if project.members.length > 1}
                  <button
                    type="button"
                    on:click={deleteLastMember}
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
                    disabled={project.members.length <= 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>
                    ลบ
                  </button>
                  {/if}
                </div>
              </div>
              <div class="space-y-3">
                {#each project.members as member, index}
                  <input
                    type="text"
                    bind:value={project.members[index]}
                    placeholder={`ชื่อ-สกุล ผู้เสนอโครงงาน ${index + 1}`}
                    required
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                {/each}
              </div>
            </div>

            <!-- Adviser Selection -->
            <AdviserSelection
              {adviserList}
              bind:project={project} 
              bind:noAdviserYet={noAdviserYet}
            />

            <div>
              <label for="external_consultant" class="block text-sm font-medium text-gray-700 mb-1">ที่ปรึกษาภายนอก <span class="text-xs text-gray-500">(ถ้ามี)</span></label>
              <input
                type="text"
                id="external_consultant"
                placeholder="ระบุชื่อ-สกุล และหน่วยงาน (ถ้ามี)"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                bind:value={project.External_consultant}
              />
            </div>
          </fieldset>

          <!-- Section 2: Project Details -->
          <fieldset class="space-y-4 border border-gray-300 p-4 rounded-md">
            <legend class="text-lg font-semibold text-gray-700 px-2">รายละเอียดโครงงาน</legend>
            
            <div>
              <label for="project_problem" class="block text-sm font-medium text-gray-700 mb-1">4. ที่มาและความสำคัญของปัญหา <span class="text-red-500">*</span></label>
              <textarea
                id="project_problem"
                rows="8"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                bind:value={project.project_problem}
                on:keydown={(event) => handleTab(event, (value) => (project.project_problem = value))}
                placeholder="อธิบายที่มาและความสำคัญของปัญหา..."
              ></textarea>
            </div>

            <div>
              <label for="project_Objective" class="block text-sm font-medium text-gray-700 mb-1">5. วัตถุประสงค์ของโครงงาน <span class="text-red-500">*</span></label>
              <textarea
                id="project_Objective"
                rows="5"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                bind:value={project.project_Objective}
                on:keydown={(event) => handleTab(event, (value) => (project.project_Objective = value))}
                placeholder="ระบุวัตถุประสงค์ของโครงงาน..."
              ></textarea>
            </div>

            <div>
              <label for="research_data" class="block text-sm font-medium text-gray-700 mb-1">6. เอกสาร/งานวิจัยที่เกี่ยวข้อง <span class="text-red-500">*</span></label>
              <textarea
                id="research_data"
                rows="8"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                bind:value={project.research_data}
                on:keydown={(event) => handleTab(event, (value) => (project.research_data = value))}
                placeholder="ระบุเอกสารและงานวิจัยที่เกี่ยวข้อง..."
              ></textarea>
            </div>

            <div>
              <label for="Theory_principles" class="block text-sm font-medium text-gray-700 mb-1">7. ทฤษฎีและหลักการ <span class="text-red-500">*</span></label>
              <textarea
                id="Theory_principles"
                rows="8"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                bind:value={project.Theory_principles}
                on:keydown={(event) => handleTab(event, (value) => (project.Theory_principles = value))}
                placeholder="อธิบายทฤษฎีและหลักการที่ใช้..."
              ></textarea>
            </div>
             <div>
              <label for="scope" class="block text-sm font-medium text-gray-700 mb-1">8. ขอบเขตโครงงาน <span class="text-red-500">*</span></label>
              <textarea
                id="scope"
                rows="8"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                bind:value={project.scope}
                on:keydown={(event) => handleTab(event, (value) => (project.scope = value))}
                placeholder="ระบุขอบเขตของโครงงาน..."
              ></textarea>
            </div>
            <div>
              <Topic9
                bind:tableTitle={project.Operation_Schedule.tableTitle}
                bind:monthLabels={project.Operation_Schedule.monthLabels}
                bind:activities={project.Operation_Schedule.activities}
                />
            </div>
            <div>
              <label for="benefit" class="block text-sm font-medium text-gray-700 mb-1">10. ประโยชน์ที่คาดว่าจะได้รับ<span class="text-red-500">*</span></label>
              <textarea
                id="benefit"
                rows="8"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                bind:value={project.benefits}
                on:keydown={(event) => handleTab(event, (value) => (project.benefits = value))}
                placeholder="ระบุประโยชน์ที่คาดว่าจะได้รับของโครงงาน..."
              ></textarea>
            </div>

            <div>
              <Topic11
                bind:budgetItems={project.budgetItems}
                />
            </div>
            
            <div>
              <label for="refer" class="block text-sm font-medium text-gray-700 mb-1">12. เอกสารอ้างอิง<span class="text-red-500">*</span></label>
              <textarea
                id="refer"
                rows="8"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                bind:value={project.refer}
                on:keydown={(event) => handleTab(event, (value) => (project.refer = value))}
                placeholder="ระบุเอกสารอ้างอิงของโครงงาน..."
              ></textarea>
            </div>
          </fieldset>

          <!-- Section 3: Images -->
          <fieldset class="space-y-4 border border-gray-300 p-4 rounded-md">
            <legend class="text-lg font-semibold text-gray-700 px-2">รูปภาพประกอบ</legend>

            <!-- Upload New Images -->
            <div>
              <label for="images_upload" class="block text-sm font-medium text-gray-700 mb-1">เพิ่มรูปภาพใหม่ (ขนาดไม่เกิน 2MB ต่อไฟล์)</label>
              <input
                type="file"
                id="images_upload"
                accept="image/*"
                multiple
                on:change={handleFileSelect}
                class="mt-1 block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100"
                bind:this={fileInput}
              />
            </div>

            <!-- Preview New Images -->
            {#if previewUrls.length > 0}
              <div class="mt-4 space-y-4">
                <h3 class="text-sm font-medium text-gray-700">รูปภาพที่เลือกใหม่:</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {#each previewUrls as preview, index}
                    <div class="border border-gray-200 rounded-md p-3 shadow-sm">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        class="w-full h-32 object-cover rounded-md mb-2"
                      />
                      <input
                        type="text"
                        bind:value={imageDescriptions[index]}
                        placeholder="รายละเอียดรูปภาพ (ถ้ามี)"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2"
                      />
                      <button
                        type="button"
                        class="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        on:click={() => removePreview(index)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                        ลบรูปนี้
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Existing Images -->
            {#if project.images && project.images.length > 0}
              <div class="mt-6 pt-4 border-t border-gray-200">
                <h3 class="text-sm font-medium text-gray-700 mb-3">รูปภาพเดิมในโครงงาน:</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {#each project.images as imageUrl, index}
                    <div class="border border-gray-200 rounded-md p-3 shadow-sm">
                      <img
                        src={imageUrl.url}
                        alt={imageUrl.title || `Existing Image ${index + 1}`}
                        class="w-full h-32 object-cover rounded-md mb-2"
                      />
                       <label for={`existing_image_title_${index}`} class="block text-xs font-medium text-gray-600 mb-0.5">รายละเอียด:</label>
                      <input
                        type="text"
                        id={`existing_image_title_${index}`}
                        bind:value={imageUrl.title}
                        placeholder="รายละเอียดรูปภาพ"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2"
                      />
                      <button
                        type="button"
                        class="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        on:click={() => deleteImage(imageUrl, index)}
                        disabled={isLoading || isUploading}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                        ลบรูปนี้
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </fieldset>

          
        <!-- Form Footer / Actions -->
        <div class="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-3">
           <button
            type="button"
            on:click={() => goToProjectDetailPage(projectId)}
            class="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading || isUploading}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            class="inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading || isUploading}
          >
            {#if isLoading || isUploading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังบันทึก...
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
              บันทึกการแก้ไข
            {/if}
          </button>
        </div>
      </form>
    {:else}
      <!-- This is the initial loading state before project is fetched -->
      <div class="flex justify-center items-center min-h-[60vh]">
        <Loading />
      </div>
    {/if}
  </div>
</div>