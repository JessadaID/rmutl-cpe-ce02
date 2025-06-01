<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import HelpModal from '$lib/components/HelpModal.svelte'; // 1. Import Modal

  let showHelpModal = false; // 2. State for modal visibility
  // ฟังก์ชันนำทางยังคงเหมือนเดิม
  function navigateToSelectDate() {
    const currentId = $page.params.id;
    const targetUrl = `/TS_Dashboard/Appointment/${currentId}/SelectDate_Appointment`;
    //console.log(`Navigating to: ${targetUrl}`);
    goto(targetUrl);
  }

  function navigateToSelectTime() {
    const currentId = $page.params.id;
    const targetUrl = `/TS_Dashboard/Appointment/${currentId}/SelectTime_Appointment`;
    //console.log(`Navigating to: ${targetUrl}`);
    goto(targetUrl);
  }
</script>

<svelte:head>
  <title>จัดการนัดหมาย - โครงงาน</title>
</svelte:head>

<!-- ใช้ Tailwind classes สำหรับ layout และ styling -->
<!-- This section appears below the calendar from +layout.svelte -->
<div class="flex flex-col items-center w-full py-8 px-4">
  <div class="bg-white p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-xl">

    <div class="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
      <h1 class="text-2xl sm:text-3xl font-semibold text-gray-800 text-center sm:text-left">
        จัดการการนัดหมายโครงงาน
      </h1>
      <!-- 3. Add "How to use" button -->
      <button
        on:click={() => showHelpModal = true}
        class="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg flex items-center gap-1"
        title="วิธีการใช้งานระบบนัดหมาย"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd" />
        </svg>
        วิธีการใช้งาน
      </button>
    </div>

    <p class="text-gray-600 mb-8 leading-relaxed text-center sm:text-left">
      กรุณาเลือกดำเนินการด้านล่างเพื่อตั้งค่าช่วงเวลาที่ท่านสะดวก หรือตรวจสอบการนัดหมายจากนักศึกษา
    </p>

    <div class="flex flex-col sm:flex-row gap-4 mt-8">
      <!-- ปุ่ม กำหนด/แก้ไขวัน-เวลาที่ท่านสะดวก -->
      <button
        on:click={navigateToSelectDate}
        class="flex-1 flex items-center justify-center gap-x-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
          <path d="M5.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm-9-1.5a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm-6-1.5a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Zm1.5 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75k-.01.75a.75.75 0 0 1-.75-.75Z" />
          <path fill-rule="evenodd" d="M2 5.75C2 4.784 2.784 4 3.75 4h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 16.25 16H3.75A1.75 1.75 0 0 1 2 14.25V5.75Zm1.75-.25a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25H3.75Z" clip-rule="evenodd" />
        </svg>
        กำหนด/แก้ไขวัน-เวลาที่ท่านสะดวก
      </button>

      <!-- ปุ่ม ดู/จัดการการนัดหมายจากนักศึกษา -->
      <button
        on:click={navigateToSelectTime}
        class="flex-1 flex items-center justify-center gap-x-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
          <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .358-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM10 18a6 6 0 0 0 4.893-9.754 3.5 3.5 0 1 1-9.786 0A6 6 0 0 0 10 18Z" />
        </svg>
        ดู/จัดการการนัดหมายจากนักศึกษา
      </button>
    </div>

  </div>
</div>
<!-- 4. Modal Component Usage -->
<HelpModal bind:showModal={showHelpModal} title="วิธีการใช้งานระบบนัดหมายสอบโครงงาน" onClose={() => showHelpModal = false}>
  <div>
    <p class="mb-4">ระบบนี้ช่วยอำนวยความสะดวกในการนัดหมายวัน-เวลาสอบโครงงานระหว่างอาจารย์และนักศึกษา โดยมีขั้นตอนหลักดังนี้:</p>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-gray-700">1. อาจารย์กำหนดวัน-เวลาที่สะดวก (สำหรับอาจารย์)</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600">
      <li>คลิกที่ปุ่ม <strong>"กำหนด/แก้ไขวัน-เวลาที่ท่านสะดวก"</strong></li>
      <li>ในหน้านั้น อาจารย์สามารถเลือกวันที่และกำหนดช่วงเวลาที่ท่านว่างสำหรับการสอบโครงงานของนักศึกษาในโปรเจกต์นี้</li>
      <li>ระบบจะบันทึกช่วงเวลาเหล่านี้ไว้ให้นักศึกษาเข้ามาเลือกในภายหลัง</li>
    </ul>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-gray-700">2. นักศึกษาเลือกวัน-เวลาสอบ (สำหรับนักศึกษา)</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600">
      <li>นักศึกษาจะเข้าสู่ระบบ (โดยทั่วไปผ่านหน้า "CPE02" หรือระบบจัดการโครงงานของนักศึกษา)</li>
      <li>เมื่อเข้าไปยังส่วนการนัดหมายของโครงงาน นักศึกษาจะเห็นปฏิทินรวมของอาจารย์ทุกท่านที่เกี่ยวข้องกับโครงงาน</li>
      <li>นักศึกษาสามารถเลือกอาจารย์ที่ต้องการนัดหมาย เพื่อดูช่วงเวลาที่อาจารย์ท่านนั้นได้กำหนดไว้ว่าสะดวก</li>
      <li>จากนั้น นักศึกษาสามารถเลือกช่วงเวลาที่ต้องการ และยืนยันการนัดหมายพร้อมระบุหมายเหตุ (ถ้ามี)</li>
    </ul>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-gray-700">3. อาจารย์ดู/จัดการการนัดหมาย (สำหรับอาจารย์)</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600">
      <li>คลิกที่ปุ่ม <strong>"ดู/จัดการการนัดหมายจากนักศึกษา"</strong></li>
      <li>ในหน้านั้น อาจารย์จะเห็นรายการนักศึกษาที่ได้ทำการนัดหมายเข้ามา พร้อมรายละเอียดวัน-เวลา และหมายเหตุจากนักศึกษา (ถ้ามี)</li>
      <li>อาจารย์สามารถแก้ไขรายละเอียดการนัดหมาย เช่น เปลี่ยนแปลงเวลา หรือเพิ่ม/แก้ไขหมายเหตุของอาจารย์เองได้จากหน้านี้</li>
    </ul>
    <p class="mt-4 text-sm text-gray-500">การเปลี่ยนแปลงใดๆ ที่สำคัญ ควรมีการแจ้งให้นักศึกษาทราบโดยตรงเพื่อป้องกันความสับสน</p>
  </div>
</HelpModal>


<!-- ไม่จำเป็นต้องมี <style> block แล้ว เพราะใช้ Tailwind -->
