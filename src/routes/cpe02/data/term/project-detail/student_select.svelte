<script lang="ts">
  import { onMount } from 'svelte';
  import { dangerToast, successToast, warningToast } from '$lib/customtoast';
  import ConfirmationModal from '$lib/components/ConfirmModal.svelte'; // Import the existing modal
  import { getCookie } from 'cookies-next';
import { convertToDate } from '$lib/convertToDate';
  // Reactive projectId from route params
  export let projectId: string | undefined;

  interface SlotInfo {
    name: string;
    savedSelections: string[]; // Assuming these are date strings or timestamps
  } // Actually, savedSelections are full slot objects
  interface AvailabilityData { // Renamed from Availability for clarity and consistency
    usersAvailability: { [teacherEmail: string]: SlotInfo };
    studentSelections?: { 
      [studentEmail: string]: {
        name: string;
        appointments: ExistingAppointment[];
      }
    };
  }

  interface AppointmentSlot {
    id: string;
    type: 'single' | 'range';
    date?: string; // ISO string
    start?: string; // ISO string
    end?: string; // ISO string
  }

  interface ExistingAppointment {
    teacherEmail: string;
    slot: AppointmentSlot;
    remarks?: string;
  }

  let availabilityData: AvailabilityData = { usersAvailability: {} }; // Renamed from availability
  let selectedTeacher = '';
  let selectedSlot = '';
  let remarks = ''; // State for remarks
  let studentEmail = ''; 
  let studentName = ''; 
  let loading = true;
  let saving = false;
  let allStudentAppointmentsForProject: ExistingAppointment[] = [];
  let currentDisplayAppointment: ExistingAppointment | null = null; // Appointment to display for the selectedTeacher
  let showConfirmationModal = false;

  onMount(async () => {
    if (!projectId) {
      console.error('Project ID is not available.');
      loading = false;
      return;
    }
    // Get student email and name from cookies
    studentEmail = getCookie('email')?.toString() || '';
    studentName = getCookie('name')?.toString() || '';

    try {
      // Replace with your actual API endpoint for fetching availability
      const response = await fetch(`/api/project-availability/${projectId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      availabilityData = data.projectData;

      // Check for existing appointment for the current student
      if (studentEmail && availabilityData.studentSelections && availabilityData.studentSelections[studentEmail]) {
        const studentAppointments = availabilityData.studentSelections[studentEmail].appointments;
        if (studentAppointments && studentAppointments.length > 0) {
          allStudentAppointmentsForProject = studentAppointments;
        }
      }
      
      if (!studentEmail || !studentName) {
        warningToast('ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง');
        // Optionally, disable the form or redirect
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
      dangerToast('เกิดข้อผิดพลาดในการโหลดข้อมูลตารางเวลา: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      loading = false;
    }
  });

  function handleTeacherChange() {
    selectedSlot = ''; // Clear previous slot selection
    remarks = ''; // Clear previous remarks
    if (selectedTeacher && allStudentAppointmentsForProject.length > 0) {
      currentDisplayAppointment = allStudentAppointmentsForProject.find(
        app => app.teacherEmail === selectedTeacher
      ) || null;
    } else {
      currentDisplayAppointment = null;
    }
  }

  function handleConfirmSelectionClick() {
    if (!selectedTeacher || !selectedSlot) {
      warningToast('กรุณาเลือกอาจารย์และช่วงเวลา');
      return;
    }
    if (!studentEmail || !studentName) {
      dangerToast('ข้อมูลผู้ใช้ไม่ครบถ้วน ไม่สามารถบันทึกได้');
      return;
    }
    // Show the confirmation modal
    showConfirmationModal = true;
  }

  async function proceedWithSlotSelection() {
    if (saving) return; // Prevent multiple submissions
    saving = true;
    showConfirmationModal = false; // Close modal

    try {
      // Replace with your actual API endpoint for booking
      const response = await fetch(`/api/project-availability/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          studentEmail, // Ensure this is populated
          studentName, // Ensure this is populated
          teacherEmail: selectedTeacher,
          slot: JSON.parse(selectedSlot),
          remarks: remarks.trim() // Add remarks to the payload
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const newAppointmentData = await response.json(); // Assuming API returns the new appointment or updated list
      if (newAppointmentData.ok){
        successToast('เลือกวันและบันทึกข้อมูลเรียบร้อยแล้ว');
      }
      
      // Update local list of appointments and refresh display for the current teacher
      // This is an optimistic update. For robustness, you might re-fetch.
      const newAppointment: ExistingAppointment = {
        teacherEmail: selectedTeacher,
        slot: JSON.parse(selectedSlot), // Assuming selectedSlot is a JSON string of the slot object
        remarks: remarks.trim()
      };
      // Remove any old appointment with this teacher before adding the new one
      allStudentAppointmentsForProject = allStudentAppointmentsForProject.filter(app => app.teacherEmail !== selectedTeacher);
      allStudentAppointmentsForProject.push(newAppointment);
      
      // Refresh the display for the current teacher to show the new appointment
      handleTeacherChange(); 

      selectedSlot = '';
      remarks = '';
    } catch (error) {
      console.error('Failed to save selection:', error);
      dangerToast(`เกิดข้อผิดพลาดในการบันทึก: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      saving = false;
    }
  }
</script>

<div class="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
  {#if loading}
    <p class="text-center text-gray-600">กำลังโหลดข้อมูลตารางเวลาของอาจารย์...</p>
  {:else if Object.keys(availabilityData.usersAvailability || {}).length === 0}
    <p class="text-center text-gray-500">ไม่พบข้อมูลตารางเวลาของอาจารย์สำหรับโปรเจกต์นี้</p>
  {:else}
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold text-gray-800 mb-4 text-center">เลือกวัน-เวลาสอบ</h1>

      <div>
        <label for="teacher-select" class="block text-sm font-medium text-gray-700 mb-1">เลือกอาจารย์:</label>
        <select 
          id="teacher-select" 
          bind:value={selectedTeacher} 
          on:change={handleTeacherChange}
          class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2">
          <option value="" disabled>-- กรุณาเลือกอาจารย์ --</option>
          {#each Object.entries(availabilityData.usersAvailability) as [email, info]}
            <option value={email}>{info.name}</option>
          {/each}
        </select>
      </div>

      {#if selectedTeacher}
        {#if currentDisplayAppointment}
          <div class="mt-4 p-4 border border-green-200 bg-green-50 rounded-md">
            <h2 class="text-lg font-semibold text-gray-800 mb-3">
              การนัดหมายที่มีอยู่กับ: {availabilityData.usersAvailability[currentDisplayAppointment.teacherEmail]?.name || currentDisplayAppointment.teacherEmail}
            </h2>
            <p class="text-sm text-gray-700">
              <strong>วัน-เวลา:</strong>
              {#if currentDisplayAppointment.slot.type === 'range' && currentDisplayAppointment.slot.start && currentDisplayAppointment.slot.end}
                {convertToDate(currentDisplayAppointment.slot.start).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                {convertToDate(currentDisplayAppointment.slot.start).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                <span class="text-gray-500">ถึง</span>
                {convertToDate(currentDisplayAppointment.slot.end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              {:else if currentDisplayAppointment.slot.type === 'single' && currentDisplayAppointment.slot.date}
                {convertToDate(currentDisplayAppointment.slot.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })},
                {convertToDate(currentDisplayAppointment.slot.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              {:else}
                <span class="text-red-500">ข้อมูลเวลาไม่สมบูรณ์</span>
              {/if}
            </p>
            {#if currentDisplayAppointment.remarks}
              <p class="text-sm text-gray-700 mt-1"><strong>หมายเหตุจากคุณ:</strong> {currentDisplayAppointment.remarks}</p>
            {/if}
            <p class="text-sm text-gray-600 mt-3">หากต้องการเปลี่ยนแปลง กรุณาติดต่ออาจารย์ที่ปรึกษาของท่านโดยตรง</p>
          </div>
        {:else if availabilityData.usersAvailability[selectedTeacher]?.savedSelections?.length > 0}
          <div>
            <label for="slot-select" class="block text-sm font-medium text-gray-700 mb-1">เลือกช่วงเวลาที่ต้องการนัดหมาย:</label>
            <select id="slot-select" bind:value={selectedSlot} class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2">
              <option value="" disabled>-- กรุณาเลือกช่วงเวลา --</option>
              {#each availabilityData.usersAvailability[selectedTeacher].savedSelections as slot (slot.id || JSON.stringify(slot))}
                {@const slotObjStr = JSON.stringify(slot)} <!-- Ensure value is a string for select option -->
                <option value={slotObjStr}>
                  {#if slot.type === 'range'}
                    {convertToDate(slot.start).toLocaleDateString('th-TH')} {convertToDate(slot.start).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {convertToDate(slot.end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  {:else if slot.type === 'single'}
                    {convertToDate(slot.date).toLocaleDateString('th-TH')} {convertToDate(slot.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  {:else}
                    ข้อมูลเวลาไม่ถูกต้อง
                  {/if}
                </option>
              {/each}
            </select>
          </div>

          <div>
            <label for="remarks-input" class="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ถ้ามี):</label>
            <textarea id="remarks-input" bind:value={remarks} rows="3" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2" placeholder="ระบุหมายเหตุเพิ่มเติม..."></textarea>
          </div>

          <button on:click={handleConfirmSelectionClick} disabled={saving || !selectedSlot} class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'กำลังบันทึก...' : 'ยืนยันการเลือก'}
          </button>
        {:else}
          <p class="text-sm text-gray-500 mt-4">อาจารย์ท่านนี้ยังไม่ได้กำหนดช่วงเวลาว่าง</p>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<ConfirmationModal
  bind:show={showConfirmationModal}
  title="ยืนยันการเลือกวัน-เวลาสอบ"
  message={'คุณยืนยันการเลือกเวลานี้ใช่หรือไม่?\nหลังจากการยืนยันแล้ว หากต้องการเปลี่ยนแปลง กรุณาติดต่อกรรมการของท่านโดยตรง'}
  confirmButtonText="ยืนยัน"
  cancelButtonText="ยกเลิก"
  on:confirm={proceedWithSlotSelection}
  on:cancel={() => showConfirmationModal = false}
/>
