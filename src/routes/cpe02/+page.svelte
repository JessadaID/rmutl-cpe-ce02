<script>
  export let data;

  import { goto } from "$app/navigation";
  import { createJWT } from "$lib/jwt.ts";
  import { getAuth } from "firebase/auth";
  import { warningToast } from "$lib/customtoast.js";


  $: latestTerm = data.lastestTerm;
  async function navigateWithToken(term) {
    const auth = getAuth();
    if (!auth.currentUser) {
      warningToast('กรุณาเข้าสู่ระบบเพื่อดำเนินการ');
      return;
    }

    try {
      const payload = { term };
      const token = await createJWT(payload);
      //console.log('Token:', token);
      goto(`/cpe02/form?token=${token}`);
    } catch (err) {
        console.error('Error creating JWT:', err);
        // Handle error appropriately, e.g., display an error message to the user
      }
    }
</script>

<svelte:head>
  <title>แบบเสนอโครงงาน CE02</title>
  <meta name="description" content="แบบเสนอโครงงาน CE02 - จัดการแบบฟอร์มเสนอหัวข้อโครงงานคอมพิวเตอร์ของคุณ" />
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

<!-- Main Content Area -->
<div class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 py-10 bg-gradient-to-br from-blue-50 via-white to-green-50">
  <!-- New Card: View Course Details -->
  <div class="w-full max-w-5xl text-center mb-8" >
    <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-3">แบบเสนอโครงงาน CE02</h1>
    <p class="text-lg text-gray-600">จัดการแบบฟอร์มเสนอหัวข้อโครงงานคอมพิวเตอร์ของคุณ</p>
  </div>



  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
    <!-- Card 1: Fill Form -->
    <div
      class="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
    >
      <div class="p-8 flex flex-col items-center text-center h-full">
        <div class="mb-5 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-file-pencil" width="64" height="64" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
            <path d="M10 18l5 -5a1.414 1.414 0 0 0 -2 -2l-5 5v2h2z" />
          </svg>
        </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3" id="form-title">กรอกแบบฟอร์ม</h2>
        <p class="text-gray-600 mb-6 flex-grow">
          เริ่มต้นการกรอกข้อมูลเพื่อเสนอหัวข้อโครงงานสำหรับภาคการศึกษาล่าสุด
        </p>

        {#if latestTerm}
          <button
            on:click={() => navigateWithToken(latestTerm.term)}
            class="w-full mt-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            กรอกฟอร์ม เทอม: {latestTerm.term}
          </button>
        {:else}
          <button
            class="w-full mt-auto bg-gray-400 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed"
            disabled
          >
            ยังไม่มีแบบฟอร์มที่เปิดให้กรอก
          </button>
        {/if}
      </div>
    </div>

    <!-- Card 2: View Data -->
    <div
      class="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
    >
      <div class="p-8 flex flex-col items-center text-center h-full">
         <div class="mb-5 text-green-600">
           <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-folder-search" width="64" height="64" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
             <path stroke="none" d="M0 0h24v24H0z" fill="none" />
             <path d="M11 19h-6a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v4" />
             <circle cx="18" cy="18" r="3" /> 
             <path d="M20.2 20.2l1.8 1.8" />
           </svg>
         </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">ดูข้อมูลโครงงาน</h2>
        <p class="text-gray-600 mb-6 flex-grow">
          ตรวจสอบสถานะและรายละเอียดของแบบเสนอโครงงานที่คุณได้ส่งไปแล้วทั้งหมด
        </p>
        <a
          href="/cpe02/data"
          class="w-full mt-auto inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          ดูข้อมูลที่ส่งแล้ว
        </a>
      </div>
    </div>


    <!-- Card 3: รายละเอียดวิชา -->
    <div
      class="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
    >
      <div class="p-8 flex flex-col items-center text-center h-full">
         <div class="mb-5 text-purple-600">
           <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-book-2" width="64" height="64" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
             <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12z" />
            <path d="M19 16h-12a2 2 0 0 0 -2 2" />
            <path d="M9 8h6" />
           </svg>
         </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">รายละเอียดรายวิชา</h2>
        <p class="text-gray-600 mb-6 flex-grow">
          ดูรายละเอียดรายวิชาและข้อมูลที่เกี่ยวข้องกับโครงงาน
        </p>
        <a
          href="/cpe02/course"
          class="w-full mt-auto inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          ดูรายละเอียดรายวิชา
        </a>
      </div>
    </div>


    <!-- Card 4: ดูเวลาว่างอาจารย์ -->
    <div
      class="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
    >
      <div class="p-8 flex flex-col items-center text-center h-full">
         <div class="mb-5 text-cyan-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-calendar-time" width="64" height="64" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
             <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M11.795 21h-6.795a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4" />
              <path d="M16 3l0 4" />
              <path d="M8 3l0 4" />
              <path d="M4 11l7 0" />
              <path d="M18 18m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
              <path d="M18 16.5l0 1.5l.5 0" />
           </svg>
         </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">ตารางลงชื่อโครงงาน</h2>
        <p class="text-gray-600 mb-6 flex-grow">
          ตรวจสอบตารางการลงชื่อของกรรมการที่เกี่ยวข้องกับโครงงาน
        </p>
    
          
          {#if latestTerm}
          <a
            href="/cpe02/teacher-availability" 
            class="w-full mt-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ดูตารางลงชื่อโครงงาน เทอม : {latestTerm.term}
          </a>
        {:else}
          <a
            href="/cpe02/#"
            class="w-full mt-auto bg-gray-400 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed"
          >
            ยังไม่มีตารางการลงชื่อที่เปิดให้ดู
          </a>
        {/if}
      </div>
    </div>

  </div>
</div>


<style>

  /* Ensure content area has enough padding at the bottom if shape divider overlaps */
  .flex.flex-col.items-center {
      padding-bottom: 80px; /* Add padding if the fixed divider overlaps content */
  }

  /* Add min-height to ensure background covers viewport even with little content */
  .min-h-\[calc\(100vh-200px\)\] {
      min-height: calc(100vh - 150px); /* Adjust based on header/footer height */
  }

</style>
