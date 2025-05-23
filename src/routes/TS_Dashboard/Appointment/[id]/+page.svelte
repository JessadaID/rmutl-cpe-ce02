<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

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
  <title>Details for Item {$page.params.id}</title>
</svelte:head>

<!-- ใช้ Tailwind classes สำหรับ layout และ styling -->
<div class="bg-gray-50 flex flex-col justify-center items-center p-4">
  <div class="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-lg">

    <h1 class="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-3">
      รายละเอียดสำหรับ ID: {$page.params.id}
    </h1>

    <p class="text-gray-600 mb-6 leading-relaxed">
      คุณกำลังดูข้อมูลสำหรับรายการที่มี ID: <strong class="font-medium text-indigo-600">{$page.params.id}</strong>
    </p>

    <div class="flex flex-col sm:flex-row gap-4 mt-6">
      <!-- ปุ่ม เลือกวันที่ว่าง -->
      <button
        on:click={navigateToSelectDate}
        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        เลือกวันที่ว่าง
      </button>

      <!-- ปุ่ม เลือกเวลานัดหมาย -->
      <button
        on:click={navigateToSelectTime}
        class="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        เลือกเวลานัดหมาย
      </button>
    </div>

    <!-- ส่วนอื่นๆ ของหน้าเว็บที่คุณต้องการเพิ่ม -->

  </div>
</div>

<!-- ไม่จำเป็นต้องมี <style> block แล้ว เพราะใช้ Tailwind -->
