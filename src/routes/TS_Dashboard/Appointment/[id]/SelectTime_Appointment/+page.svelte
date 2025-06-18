<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { getCookie } from "cookies-next";
  import { dangerToast, successToast, warningToast } from "$lib/customtoast";
  import { convertToDate } from '$lib/convertToDate'; // Import the conversion utility
  import CountdownTimer from '$lib/components/CountdownTimer.svelte'; // Import the countdown timer
  // import StudentSelect from "./student_select.svelte"; // Commented out as it's not used in this specific file's logic directly for display/edit

  let student_section = {};
  let isLoading = true; // Add a loading state
  let isSavingEdit = false;
  let currentTeacherEmail = '';
  let projectId = '';

  // For editing
  let editingSelectionKey = null; // Unique key for the appointment being edited
  let editFormData = {
    newDate: '', // YYYY-MM-DD
    newTime: '', // HH:MM
    studentRemarks: '', // For editing student's original remarks
    teacherRemarks: ''  // For teacher's own remarks
  };

  function getSelectionKey(selection) {
    if (!selection || !selection.studentEmail || !selection.slot || !selection.slot.id) {
      // Fallback for safety, though ideally selection and slot.id should always exist
      return `fallback-${Math.random()}`;
    }
    return `${selection.studentEmail}-${selection.slot.id}`;
  }

  onMount( async () => {
    currentTeacherEmail = getCookie('email')?.toString() || '';
    projectId = $page.params.id; // Store projectId
    isLoading = true;

    try {
      const response = await fetch(`/api/project-availability/${projectId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      student_section = data.projectData?.studentSelections || {};

    } catch (error) {
      dangerToast(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}`);
      console.error("Error in onMount:", error);
    } finally {
      isLoading = false; // Set loading to false after fetch
    }
  });

  function startEdit(selection) {
    editingSelectionKey = getSelectionKey(selection);
    const currentAppointmentDate = selection.slot.type === 'single' 
      ? convertToDate(selection.slot.date) 
      : convertToDate(selection.slot.start);

    if (currentAppointmentDate && !isNaN(currentAppointmentDate.getTime())) {
      editFormData.newDate = currentAppointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      editFormData.newTime = currentAppointmentDate.toTimeString().slice(0,5); // HH:MM
    } else {
      // Fallback if date is invalid
      editFormData.newDate = '';
      editFormData.newTime = '';
      warningToast('ไม่สามารถโหลดเวลาปัจจุบันของการนัดหมายได้');
    }
    editFormData.studentRemarks = selection.remarks || ''; // Student's original remarks
    editFormData.teacherRemarks = selection.teacherRemarks || ''; // Teacher's own remarks
  }

  function cancelEdit() {
    editingSelectionKey = null;
    editFormData.newDate = '';
    editFormData.newTime = '';
    editFormData.studentRemarks = '';
    editFormData.teacherRemarks = '';
  }

  async function saveEdit(originalSelection) {
    if (!editFormData.newDate || !editFormData.newTime) {
      warningToast('กรุณากรอกวันที่และเวลาใหม่ให้ครบถ้วน');
      return;
    }

    isSavingEdit = true;
    try {
      const combinedDateTimeString = `${editFormData.newDate}T${editFormData.newTime}:00`; // Add seconds for Date constructor
      const newDateTime = new Date(combinedDateTimeString);

      if (isNaN(newDateTime.getTime())) {
        dangerToast('รูปแบบวันที่หรือเวลาไม่ถูกต้อง');
        isSavingEdit = false;
        return;
      }
      const newSlotObject = {
        id: originalSelection.slot.id, // Keep original slot ID or generate new if backend prefers
        type: 'single', // Manually set time is treated as a single slot
        date: newDateTime.toISOString() // Store as ISO string
      };

      const response = await fetch(`/api/project-availability/${projectId}`, { // Use stored projectId
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: originalSelection.studentEmail,
          teacherEmail: originalSelection.teacherEmail, // This is the teacher of the specific appointment
          newSlot: newSlotObject,                       // Send the full new slot object
          newStudentRemarks: editFormData.studentRemarks, // Potentially edited student remarks
          newTeacherRemarks: editFormData.teacherRemarks  // Teacher's own remarks
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error during save' }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      // Optimistic update of local data
      const studentData = student_section[originalSelection.studentEmail];
      if (studentData && Array.isArray(studentData.appointments)) {
        const appointmentIndex = studentData.appointments.findIndex(
          app => app.slot.id === originalSelection.slot.id && app.teacherEmail === originalSelection.teacherEmail
        );
        if (appointmentIndex !== -1) {
          const updatedAppointments = [...studentData.appointments];
          updatedAppointments[appointmentIndex] = {
            ...updatedAppointments[appointmentIndex],
            slot: newSlotObject,
            remarks: editFormData.studentRemarks, // Update student's remarks locally
            teacherRemarks: editFormData.teacherRemarks, // Update teacher's remarks locally
          };
          student_section[originalSelection.studentEmail].appointments = updatedAppointments;
          student_section = { ...student_section }; // Trigger Svelte reactivity
          successToast('อัปเดตการนัดหมายเรียบร้อยแล้ว');

          // ---- START SEND NOTIFICATION TO STUDENT ----
          try {
            const teacherName = getCookie('name')?.toString() || currentTeacherEmail; // Get teacher's name
            const studentEmailToNotify = originalSelection.studentEmail;
            const studentName = originalSelection.studentName || studentEmailToNotify;

            const formattedNewDateTime = newDateTime.toLocaleString('th-TH', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }) + ' น.';

            const notificationTitle = `[แก้ไขนัดหมาย] อาจารย์ ${teacherName} ได้แก้ไขการนัดหมาย`;
            const notificationMessageBody = 
              `เรียน นักศึกษา ${studentName},\n\n` +
              `อาจารย์ ${teacherName} ได้ทำการแก้ไขการนัดหมายสำหรับโครงงานของคุณ\n` +
              `วันและเวลาใหม่คือ: ${formattedNewDateTime}\n` +
              (editFormData.teacherRemarks.trim() ? `หมายเหตุจากอาจารย์: ${editFormData.teacherRemarks.trim()}\n` : '') +
              `กรุณาตรวจสอบรายละเอียดและเตรียมตัวตามวันเวลาใหม่ค่ะ/ครับ`;
            //console.log('Sending notification with payload:', {
            //  title: notificationTitle,
            //  messageBody: notificationMessageBody,
            //  email: studentEmailToNotify
            //});
            
            const notifyResponse = await fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: notificationTitle,
                messageBody: notificationMessageBody,
                email: studentEmailToNotify
              })
            });

            if (!notifyResponse.ok) {
              console.warn('การส่งแจ้งเตือนการแก้ไขนัดหมายไปยังนักศึกษาล้มเหลว:', await notifyResponse.text());
            } else {
              console.log('ส่งแจ้งเตือนการแก้ไขนัดหมายไปยังนักศึกษาเรียบร้อยแล้ว');
            }
          } catch (notifyError) {
            console.error('เกิดข้อผิดพลาดในการส่งแจ้งเตือนไปยังนักศึกษา:', notifyError);
          }
          // ---- END SEND NOTIFICATION TO STUDENT ----

        } else {
           warningToast('อัปเดตสำเร็จ แต่การแสดงผลอาจไม่ล่าสุด โปรดรีเฟรช (ไม่พบการนัดหมายในข้อมูล local)');
        }
      } else {
        warningToast('อัปเดตสำเร็จ แต่การแสดงผลอาจไม่ล่าสุด โปรดรีเฟรช (ไม่พบข้อมูลนักศึกษาใน local)');
      }
      cancelEdit();
    } catch (error) {
      dangerToast(`เกิดข้อผิดพลาดในการบันทึก: ${error.message}`);
      console.error("Error saving edit:", error);
    } finally {
      isSavingEdit = false;
    }
  }

  // Reactive computation for appointments
  let appointmentsForCurrentTeacher = [];
  $: {
    if (student_section && Object.keys(student_section).length > 0 && currentTeacherEmail) {
      appointmentsForCurrentTeacher = Object.entries(student_section) // student_section is studentSelections
        .flatMap(([studentEmail, studentData]) => { // studentData is { name: "...", appointments: [...] }
          if (studentData && Array.isArray(studentData.appointments)) {
            return studentData.appointments
              .filter(appointment => appointment.teacherEmail === currentTeacherEmail)
              .map(appointment => ({
                ...appointment, // Contains teacherEmail, slot, remarks
                studentEmail,
                studentName: studentData.name || studentEmail
              }));
          }
          return [];
        })
        .filter(selection => { // your existing date validation filter
          if (!selection.slot) return false;
          const date = selection.slot.type === 'single' ? selection.slot.date : selection.slot.start;
          if (!date) return false;
          const convertedDate = convertToDate(date);
          return convertedDate && !isNaN(convertedDate.getTime());
        });
    } else {
      appointmentsForCurrentTeacher = [];
    }
  }

</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-2">รายการนัดหมายจากนักศึกษา</h1>

  {#if isLoading}
    <div class="flex justify-center items-center py-10">
      <p class="text-lg text-gray-500">กำลังโหลดข้อมูลการนัดหมาย...</p>
      <!-- You can add a spinner here -->
    </div>
  {:else if appointmentsForCurrentTeacher.length === 0}
    <p class="mt-6 text-center text-gray-600 py-10">
      {#if Object.keys(student_section || {}).length === 0}
        ยังไม่มีนักศึกษาเลือกเวลาสำหรับโปรเจกต์นี้
      {:else}
        คุณยังไม่มีการนัดหมายกับนักศึกษาสำหรับโปรเจกต์นี้
      {/if}
    </p>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each appointmentsForCurrentTeacher as selection (getSelectionKey(selection))}
        {@const currentKey = getSelectionKey(selection)}
        {@const isEditingThis = editingSelectionKey === currentKey}
        {@const appointmentDate = selection.slot.type === 'single' ? convertToDate(selection.slot.date) : convertToDate(selection.slot.start)}
        
        <div class="bg-white p-5 rounded-xl shadow-lg border border-blue-100 hover:shadow-2xl transition-shadow duration-300 ease-in-out">
          {#if isEditingThis}
            <!-- Editing Mode -->
            <h3 class="text-lg font-semibold text-indigo-700 mb-2">แก้ไขนัดหมายกับ: {selection.studentName}</h3>
          
            <div class="mb-4">
              <label for="edit-date-{currentKey}" class="block text-sm font-medium text-gray-700 mb-1">วันที่ใหม่:</label>
              <input 
                type="date" 
                id="edit-date-{currentKey}" 
                bind:value={editFormData.newDate}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div class="mb-4">
              <label for="edit-time-{currentKey}" class="block text-sm font-medium text-gray-700 mb-1">เวลาใหม่:</label>
              <input 
                type="time" 
                id="edit-time-{currentKey}" 
                bind:value={editFormData.newTime}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div class="mb-4">
              <label for="edit-teacher-remark-{currentKey}" class="block text-sm font-medium text-gray-700 mb-1">หมายเหตุจากอาจารย์:</label>
              <textarea id="edit-teacher-remark-{currentKey}" bind:value={editFormData.teacherRemarks} rows="3" class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="เพิ่มหมายเหตุของอาจารย์ (ถ้ามี)..."></textarea>
            </div>

            <div class="flex justify-end space-x-2 mt-4">
              <button on:click={cancelEdit} class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300" disabled={isSavingEdit}>
                ยกเลิก
              </button>
              <button on:click={() => saveEdit(selection)} class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled={isSavingEdit}>
                {isSavingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          {:else}
            <!-- Display Mode -->
            <h3 class="text-lg font-semibold text-blue-700 mb-1">
              นัดหมายกับ: {selection.studentName}
            </h3>
            <p class="text-xs text-gray-500 mb-3">
              อีเมลนักศึกษา: {selection.studentEmail}
            </p>
            
            {#if selection.remarks && selection.remarks.trim() !== ""}
              <div class="mb-3">
                <strong class="text-sm text-gray-700">หมายเหตุจาก น.ศ.:</strong>
                <p class="text-sm text-gray-600 bg-gray-50 p-2 rounded-md mt-1 whitespace-pre-wrap">{selection.remarks}</p>
              </div>
            {/if}
            {#if selection.teacherRemarks && selection.teacherRemarks.trim() !== ""}
              <div class="mb-3">
                <strong class="text-sm text-gray-700">หมายเหตุจากอาจารย์:</strong>
                <p class="text-sm text-gray-600 bg-yellow-50 p-2 rounded-md mt-1 whitespace-pre-wrap">{selection.teacherRemarks}</p>
              </div>
            {/if}

            <div class="mb-4 p-3 bg-blue-50 rounded-md text-sm">
              <strong class="text-gray-700">เวลาที่เลือก:</strong>
              {#if selection.slot.type === 'single'}
                {appointmentDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })},
                {appointmentDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              {:else if selection.slot.type === 'range' && selection.slot.start && selection.slot.end}
                {appointmentDate.toLocaleDateString('th-TH')} {appointmentDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                <span class="text-gray-500">ถึง</span> {convertToDate(selection.slot.end).toLocaleDateString('th-TH')} {convertToDate(selection.slot.end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              {:else}
                <span class="text-red-500">ข้อมูลเวลาไม่สมบูรณ์</span>
              {/if}
            </div>

            <div class="mb-4">
                <h4 class="text-md font-medium text-gray-800 mb-1">เหลือเวลาอีก:</h4>
                <CountdownTimer targetDate={appointmentDate} />
            </div>
        
            <div class="mt-4 pt-3 border-t border-gray-200 flex justify-end">
              <button 
                on:click={() => startEdit(selection)}
                class="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200"
              >
                แก้ไขการนัดหมาย
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- StudentSelect component is for students to select time, not typically displayed on the teacher's appointment view page -->
<!-- <StudentSelect /> -->
