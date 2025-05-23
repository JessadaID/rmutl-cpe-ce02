<!-- c:\Users\Jessada\Desktop\งานครอบจักรวาล\ป.ตรี\Pre-project\sveltekit\project-approve\src\routes\Dashboard\Main.svelte -->
<script>
  import { onMount } from 'svelte';
  import { db } from '$lib/firebase';
  import { collection, getDocs, query, where, getCountFromServer, orderBy, limit } from 'firebase/firestore';
  import { goto } from '$app/navigation'; // For quick links
  import Loading from '$lib/components/loading.svelte';

  let projectStats = {
    total: 0,
    pendingApproval: 0, // New stat
  };
  let userCount = 0;
  // let openFormsCount = 0; // Removed as form_name is fetched from API
  let isLoading = true;
  let form_name = "";
  let recentProjects = []; // For recent activity
  let isLoadingRecentProjects = true;

  onMount(async () => {
    isLoading = true;
    isLoadingRecentProjects = true;
    try {
      // Get total project stats
      const projectApproveCol = collection(db, 'project-approve');
      const projectSnapshot = await getCountFromServer(projectApproveCol);
      projectStats.total = projectSnapshot.data().count;

      // Get projects awaiting approval
      // **สำคัญ:** ปรับ query นี้ให้ตรงกับโครงสร้างข้อมูลของคุณ
      // ตัวอย่าง: หากคุณมี field ชื่อ 'adminApprovalStatus' ที่มีค่าเป็น 'pending' สำหรับโครงงานที่รออนุมัติ

      /*
      const pendingProjectsQuery = query(projectApproveCol, where('adminApprovalStatus', '==', 'pending'));
      try {
        const pendingSnapshot = await getCountFromServer(pendingProjectsQuery);
        projectStats.pendingApproval = pendingSnapshot.data().count;
      } catch (e) {
        console.warn("ไม่สามารถดึงข้อมูลโครงงานรออนุมัติได้ กรุณาตรวจสอบ field 'adminApprovalStatus' และ index ใน Firestore หรือปรับ query:", e);
        projectStats.pendingApproval = 0; // หาก query ไม่สำเร็จ ให้แสดงเป็น 0
      }*/


      // Get user stats
      const usersCol = collection(db, 'users');
      const userQuery = query(usersCol, where('role', '==', 'user')); // ดึงตาม role 'user' ที่คุณใช้อยู่
      const userSnapshot = await getCountFromServer(userQuery);
      userCount = userSnapshot.data().count;

      // Get open form name
      const form_api = await fetch('/api/form-data?isOpen=true');
      if (form_api.ok) {
        const form_data = await form_api.json();
        if (form_data.data && form_data.data.length > 0) {
          form_name = form_data.data[0].term;
        } else {
          form_name = "ไม่มีฟอร์มเปิด";
        }
      } else {
        form_name = "ไม่สามารถโหลดข้อมูลฟอร์ม";
        console.error("Error fetching form data:", form_api.statusText);
      }

    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      isLoading = false;
    }

    // Fetch recent projects
    try {
      // สมมติว่าคุณมี field 'createdAt' สำหรับเรียงลำดับโครงงานล่าสุด
      // หากไม่มี field นี้ หรือใช้ชื่ออื่น กรุณาปรับแก้
      const recentProjectsQuery = query(collection(db, 'project-approve'), orderBy('createdAt', 'desc'), limit(5));
      const recentSnapshot = await getDocs(recentProjectsQuery);
      recentProjects = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching recent projects:", error);
      recentProjects = [];
    } finally {
      isLoadingRecentProjects = false;
    }
  });

  // Helper function to format date (optional)
  function formatDate(timestamp) {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return 'N/A';
  }

  async function navigateToProjectDetail(projectId) {
    try {
        const { createJWT } = await import('$lib/jwt'); // Dynamic import
        const payload = { projectId };
        const token = await createJWT(payload);
        goto(`/cpe02/data/term/project-detail?token=${token}`);
    } catch (error) {
        console.error("Error creating JWT or navigating:", error);
        goto('/cpe02/data'); // Fallback
    }
  }
</script>


<div class="space-y-8 p-4 md:p-6">
  <h1 class="text-3xl font-bold text-gray-800">ภาพรวมระบบ</h1>

  {#if isLoading}
    <Loading />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
      <!-- Total Projects Card -->
      <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-700">โครงงานทั้งหมด</h2>
          <span class="p-2 bg-blue-100 text-blue-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </span>
        </div>
        <p class="text-4xl font-bold text-blue-600">{projectStats.total}</p>
        <p class="text-sm text-gray-500 mt-1">จำนวนโครงงานในระบบ</p>
      </div>

      <!-- Projects Awaiting Approval Card -->
      <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-700">รอการอนุมัติ</h2>
           <span class="p-2 bg-yellow-100 text-yellow-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
        </div>
        <p class="text-4xl font-bold text-yellow-600">{projectStats.pendingApproval}</p>
        <p class="text-sm text-gray-500 mt-1">โครงงานที่ต้องตรวจสอบ <span class="text-xs">(ปรับ query ตามข้อมูลจริง)</span></p>
      </div>

      <!-- User Stats Card -->
      <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
         <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-700">จำนวนนักศึกษา</h2>
          <span class="p-2 bg-green-100 text-green-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.084-1.283-.24-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.084-1.283.24-1.857m10.514L18 13.5M4.486 18L3 13.5M12 12a5 5 0 100-10 5 5 0 000 10z" /></svg>
          </span>
        </div>
        <p class="text-4xl font-bold text-green-600">{userCount}</p>
        <p class="text-sm text-gray-500 mt-1">ผู้ใช้งานในระบบ (Role: user)</p>
      </div>

      <!-- Open Form Card -->
      <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-700">ฟอร์มที่กำลังเปิด</h2>
          <span class="p-2 bg-purple-100 text-purple-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </span>
        </div>
        <p class="text-3xl font-bold text-purple-600 truncate" title={form_name}>{form_name || "N/A"}</p>
        <p class="text-sm text-gray-500 mt-1">ภาคการศึกษาปัจจุบันที่เปิดรับ</p>
      </div>
    </div>
  {/if}

  <!-- Recent Project Submissions Section -->
  <div class="mt-10 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
    <h2 class="text-xl font-semibold text-gray-700 mb-4">โครงงานที่ส่งล่าสุด</h2>
    {#if isLoadingRecentProjects}
      <p class="text-gray-500">กำลังโหลดรายการโครงงานล่าสุด...</p>
    {:else if recentProjects.length > 0}
        <ul class="space-y-3">
        {#each recentProjects as project (project.id)}
          <li
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors cursor-pointer"
            on:click={() => navigateToProjectDetail(project.id)}
            on:keydown={(e) => e.key === 'Enter' && navigateToProjectDetail(project.id)}
            role="link"
            tabindex="0"
          >
            <div>
              <h3 class="font-medium text-blue-600 hover:underline">{project.project_name_th || 'ไม่มีชื่อโครงงาน'}</h3>
              <p class="text-sm text-gray-600">
                {#if project.members && project.members.length > 0}
                  โดย: {project.members.join(', ')}
                {:else}
                  ผู้เสนอ: ไม่ระบุ
                {/if}
              </p>
            </div>
            <p class="text-sm text-gray-500 mt-2 sm:mt-0">ส่งเมื่อ: {formatDate(project.createdAt)}</p>
          </li>
        {/each}
        </ul>
    {:else}
      <p class="text-gray-500">ยังไม่มีโครงงานที่ส่งเข้ามาล่าสุด</p>
    {/if}
  </div>

  <!-- Quick Actions Section -->
  <div class="mt-10 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
    <h2 class="text-xl font-semibold text-gray-700 mb-4">การดำเนินการด่วน</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <button
        on:click={() => goto('/TS_Dashboard/OpenForm')}
        class="flex items-center justify-center p-4 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow hover:shadow-md transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-3 3h3M5 14h.01M5 17h.01M8 5V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v3h2Z"/></svg>
        จัดการเปิด/ปิดฟอร์ม
      </button>
      <button
        on:click={() => goto('/cpe02/data')}
        class="flex items-center justify-center p-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow hover:shadow-md transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7h1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h11.5M7 14h6m-6 3h6m0-10h.5m-.5 3h.5M7 7h3v3H7V7Z"/></svg>
        ดูรายการโครงงาน
      </button>
      <button
        on:click={() => goto('/TS_Dashboard/Addtask')}
        class="flex items-center justify-center p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow hover:shadow-md transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.75 4.004v15.992m0-15.992H6.804a1 1 0 0 0-.994.92l-.006.08v14.008a1 1 0 0 0 .92.994l.08.006h3.946m0-15.992h6.442a1 1 0 0 1 .994.92l.006.08v14.008a1 1 0 0 1-.92.994l-.08.006H10.75m0-15.992V20m3.219-12.037H17.5V12h-3.531V7.963Zm0 6.074H17.5v4.037h-3.531v-4.037ZM6.781 8.037H10.25V12H6.781V8.037Zm0 6.074H10.25v4.037H6.781v-4.037Z"/></svg>
        จัดการงาน (Tasks)
      </button>
    </div>
  </div>

</div>
