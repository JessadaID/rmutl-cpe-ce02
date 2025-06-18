<script>
  import { createEventDispatcher } from 'svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  
  const dispatch = createEventDispatcher();

  // Props
  export let selectionMode = 'single'; // 'single' or 'range'
  export let selectedDates = []; // For single date selection mode
  export let selectedRange = { start: null, end: null }; // For range selection mode
  export let month = new Date().getMonth();
  export let year = new Date().getFullYear();
  export let savedSelections = []; // Stores both single dates and ranges
  export let enableTime = true; // Enable time selection
  
  // State variables
  let rangeSelectionState = null; // 'start', 'end', or null
  let tempStart = null;
  let tempEnd = null;
  let showTimeModal = false;
  let currentEditingDate = null;
  let selectedTime = { hour: '09', minute: '00' };
  let editingSelection = null; // For editing saved selections


  //confirm Modal   
  let  showConfirmModal = false; // Control visibility of confirm modal
  let confirmedSelectionId = null; // ID of the selection to confirm deletion

  // Reactive variables
  $: monthData = getMonthData(month, year);
  $: monthName = new Date(year, month, 1).toLocaleString('th-TH', { month: 'long' });
  
  // Generate hour options for 24-hour format
  $: hourOptions = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
  
  $: minuteOptions = Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'));

  // Reactive functions for styling
  $: isSelected = (date) => {
    if (!date) return false;
    
    if (selectionMode === 'single') {
      return selectedDates.some(d => isDateEqual(d, date));
    } else {
      return isInRange(date);
    }
  };
  
  $: isInRange = (date) => {
    if (!date || selectionMode !== 'range') return false;
    
    // For active selection process
    if (rangeSelectionState === 'end' && tempStart) {
      return isDateEqual(date, tempStart) || 
             (date > tempStart && (!tempEnd || date <= tempEnd));
    }
    
    // For completed selection
    if (selectedRange.start && selectedRange.end) {
      return date >= selectedRange.start && date <= selectedRange.end;
    }
    
    // For single date in range selection
    if (selectedRange.start && !selectedRange.end) {
      return isDateEqual(date, selectedRange.start);
    }
    
    return false;
  };
  
  $: isRangeStart = (date) => {
    if (!date || selectionMode !== 'range') return false;
    return selectedRange.start && isDateEqual(date, selectedRange.start);
  };
  
  $: isRangeEnd = (date) => {
    if (!date || selectionMode !== 'range') return false;
    return selectedRange.end && isDateEqual(date, selectedRange.end);
  };

  // Functions
  function getMonthData(month, year) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendarDays = [];
    let dayCounter = 1;
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < startingDayOfWeek) {
          weekDays.push(null);
        } else if (dayCounter > daysInMonth) {
          weekDays.push(null);
        } else {
          weekDays.push(new Date(year, month, dayCounter));
          dayCounter++;
        }
      }
      calendarDays.push(weekDays);
    }
    
    return calendarDays;
  }

  function previousMonth() {
    if (month === 0) {
      month = 11;
      year--;
    } else {
      month--;
    }
  }

  function nextMonth() {
    if (month === 11) {
      month = 0;
      year++;
    } else {
      month++;
    }
  }

  function isDateEqual(date1, date2) {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
  }

  function handleDateClick(date) {
    if (!date) return;
    
    if (enableTime) {
      currentEditingDate = new Date(date);
      selectedTime = { hour: '09', minute: '00' }; // Default time for modal
      showTimeModal = true;
      return;
    }

    // Original date selection logic (without time)
    if (selectionMode === 'single') {
      const index = selectedDates.findIndex(d => isDateEqual(d, date));
      
      if (index >= 0) {
        selectedDates = [
          ...selectedDates.slice(0, index),
          ...selectedDates.slice(index + 1)
        ];
      } else {
        selectedDates = [...selectedDates, new Date(date)];
      }
    } else {
      if (!rangeSelectionState || rangeSelectionState === 'start') {
        tempStart = new Date(date);
        tempEnd = null;
        rangeSelectionState = 'end';
        selectedRange = { start: tempStart, end: null };
      } else if (rangeSelectionState === 'end') {
        if (isDateEqual(date, tempStart)) {
          tempEnd = new Date(date);
          selectedRange = { start: tempStart, end: tempEnd };
          rangeSelectionState = null;
          return;
        }
        
        if (date < tempStart) {
          tempEnd = new Date(tempStart);
          tempStart = new Date(date);
        } else {
          tempEnd = new Date(date);
        }
        
        selectedRange = { start: tempStart, end: tempEnd };
        rangeSelectionState = null;
      }
    }
  }

  async function confirmTimeSelection() { // ทำให้เป็น async function
    if (!currentEditingDate) return;

    const dateWithTime = new Date(currentEditingDate);
    dateWithTime.setHours(parseInt(selectedTime.hour), parseInt(selectedTime.minute), 0, 0);

    if (editingSelection) {
      // กำลังแก้ไขรายการที่มีอยู่
      const docId = editingSelection.id;
      let updatedFields = {};

      if (editingSelection.type === 'single') {
        updatedFields = { date: dateWithTime };
      } else if (editingSelection.isStart) { // editingSelection.type === 'range'
        updatedFields = { start: dateWithTime };
      } else {
        updatedFields = { end: dateWithTime }; // editingSelection.type === 'range' และ !isStart
      }

      try {
        // const appointmentRef = doc(db, 'your_collection_name', docId); // แทนที่ 'your_collection_name' ด้วยชื่อ collection ของคุณ
        // await updateDoc(appointmentRef, updatedFields); 
        // console.log(`Firebase: Document ${docId} updated successfully with`, updatedFields); // สำหรับการทดสอบ

        // อัปเดต savedSelections ใน local state
        savedSelections = savedSelections.map(s => {
          if (s.id === docId) {
            return { ...s, ...updatedFields };
          }
          return s;
        });
        
        dispatch('update', { 
          updatedSelectionId: docId, 
          updatedData: { ...updatedFields }, // ส่งข้อมูล field ที่เปลี่ยนแปลงไป
          savedSelections: [...savedSelections] // ส่งอาร์เรย์ใหม่เพื่อ Svelte reactivity
        });

      } catch (error) {
        console.error("Error updating document in Firebase: ", error);
        // TODO: จัดการ error ที่นี่ เช่น แสดงข้อความแจ้งเตือนผู้ใช้
      }
      editingSelection = null; // ล้างสถานะการแก้ไข
    } else {
      // New selection
      if (selectionMode === 'single') {
        const index = selectedDates.findIndex(d => isDateEqual(d, currentEditingDate));
        if (index >= 0) {
          selectedDates[index] = dateWithTime;
        } else {
          selectedDates = [...selectedDates, dateWithTime]; // สร้าง array ใหม่เพื่อ reactivity
        }
        // หากต้องการให้ Svelte อัปเดต UI อย่างถูกต้องเมื่อแก้ไข array โดยตรง
        selectedDates = [...selectedDates]; 
      } else {
        if (!rangeSelectionState || rangeSelectionState === 'start') {
          tempStart = dateWithTime;
          rangeSelectionState = 'end';
          selectedRange = { start: tempStart, end: null };
        } else if (rangeSelectionState === 'end') {
          if (isDateEqual(currentEditingDate, tempStart)) {
            // tempStart อาจจะยังไม่มีเวลาที่แน่นอน ถ้ามันมาจากการคลิกครั้งแรกที่ไม่ได้เปิด modal
            tempEnd = dateWithTime;
            selectedRange = { start: tempStart, end: tempEnd };
            rangeSelectionState = null;
          } else {
            if (dateWithTime < tempStart) {
              tempEnd = new Date(tempStart); // tempStart เดิมกลายเป็น tempEnd
              tempStart = dateWithTime;
            } else {
              tempEnd = dateWithTime;
            }
            selectedRange = { start: tempStart, end: tempEnd };
            rangeSelectionState = null;
          }
        }
      }
    }

    showTimeModal = false;
    currentEditingDate = null;
    // editingSelection = null; // ย้ายไปอยู่ใน if (editingSelection) block แล้ว
  }

  function cancelTimeSelection() {
    showTimeModal = false;
    currentEditingDate = null;
    editingSelection = null;
  }

  function editSelectionTime(selection, isStart = false) {
    // ตรวจสอบให้แน่ใจว่า copy `id` และ `type` มาด้วย
    editingSelection = { ...selection, isStart, type: selection.type, id: selection.id }; 
    
    if (selection.type === 'single') {
      const dateToEdit = selection.date instanceof Date ? selection.date : new Date(selection.date);
      currentEditingDate = new Date(dateToEdit); // สร้าง Date object ใหม่เสมอ
      setTimeFromDate(dateToEdit);
    } else {
      const dateToEdit = isStart ? selection.start : selection.end;
      const dateObjToEdit = dateToEdit instanceof Date ? dateToEdit : new Date(dateToEdit);
      currentEditingDate = new Date(dateObjToEdit); // สร้าง Date object ใหม่เสมอ
      setTimeFromDate(dateObjToEdit);
    }
    showTimeModal = true;
  }

  function setTimeFromDate(date) {
    const d = date instanceof Date ? date : new Date(date); // ป้องกันกรณี date ไม่ใช่ Date object
    const hours = d.getHours();
    const minutes = d.getMinutes();
    selectedTime = {
      hour: hours.toString().padStart(2, '0'),
      minute: minutes.toString().padStart(2, '0')
      // No period needed for 24-hour format
    };
  }

  function resetSelection() {
    if (selectionMode === 'single') {
      selectedDates = [];
    } else {
      selectedRange = { start: null, end: null };
      tempStart = null;
      tempEnd = null;
      rangeSelectionState = null;
    }
  }

  function saveSelection() {
    if (selectionMode === 'single' && selectedDates.length > 0) {
      const newSavedSelections = selectedDates.map(date => ({
        id: Date.now() + Math.random(),
        type: 'single',
        date: new Date(date) // สร้าง Date object ใหม่
      }));
      
      savedSelections = [...savedSelections, ...newSavedSelections];
      dispatch('save', { 
        newlySaved: newSavedSelections, // ส่งเฉพาะรายการที่บันทึกใหม่
        savedSelections: [...savedSelections] // ส่งรายการทั้งหมดที่อัปเดตแล้ว
      });
    } else if (selectionMode === 'range' && selectedRange.start && selectedRange.end) {
      const newRangeSelection = { 
        id: Date.now().toString(), // ทำให้ id เป็น string หาก Firebase คาดหวัง string
        type: 'range',
        start: new Date(selectedRange.start), // สร้าง Date object ใหม่
        end: new Date(selectedRange.end)   // สร้าง Date object ใหม่
      };
      savedSelections = [...savedSelections, newRangeSelection];
      
      dispatch('save', { 
        newlySaved: [newRangeSelection], // ส่งเฉพาะรายการที่บันทึกใหม่
        savedSelections: [...savedSelections] // ส่งรายการทั้งหมดที่อัปเดตแล้ว
      });
    }

    resetSelection();
  }

  function formatSelection(selection) {
    const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }; // Use h23 for 24-hour format
    
    if (selection.type === 'single') {
      const dateObj = selection.date instanceof Date ? selection.date : new Date(selection.date);
      const dateStr = dateObj.toLocaleDateString('th-TH', dateOptions);
      const timeStr = enableTime && typeof dateObj.getHours === 'function' ? dateObj.toLocaleTimeString('th-TH', timeOptions) : '';
      return enableTime && timeStr ? `${dateStr} ${timeStr}` : dateStr;
    } else {
      const startDateObj = selection.start instanceof Date ? selection.start : new Date(selection.start);
      const endDateObj = selection.end instanceof Date ? selection.end : new Date(selection.end);

      const startDateStr = startDateObj.toLocaleDateString('th-TH', dateOptions);
      const endDateStr = endDateObj.toLocaleDateString('th-TH', dateOptions);
      const startTimeStr = enableTime && typeof startDateObj.getHours === 'function' ? startDateObj.toLocaleTimeString('th-TH', timeOptions) : '';
      const endTimeStr = enableTime && typeof endDateObj.getHours === 'function' ? endDateObj.toLocaleTimeString('th-TH', timeOptions) : '';
      
      let daysText = '';
      if (startDateObj && endDateObj && !isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
        const days = Math.floor((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (days > 0) {
          daysText = ` (${days} วัน)`;
        }
      }
      
      if (enableTime && startTimeStr && endTimeStr) {
        return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}${daysText}`;
      } else {
        return `${startDateStr} - ${endDateStr}${daysText}`;
      }
    }
  }

  function deleteSelection(id) {
    const newSavedSelections = savedSelections.filter(selection => selection.id !== id);
    savedSelections = newSavedSelections; // อัปเดต local state
    dispatch('delete', { deletedId: id, savedSelections: [...newSavedSelections] }); // ส่งรายการที่อัปเดตแล้ว

    showConfirmModal = false; // ปิด modal หลังจากลบ
  }

  function showModal(projectId) {
    confirmedSelectionId = projectId;
    showConfirmModal = true;
  }

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
</script>

<div class="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-4">
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- Left Column: Calendar and Controls -->
    <div class="flex-1">
      <!-- Calendar Header -->
      <div class="flex justify-between items-center mb-4">
        <button 
          class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors" 
          on:click={previousMonth}
        >
          &lt;
        </button>
        <h3 class="text-lg font-semibold text-gray-800">{monthName} {year}</h3>
        <button 
          class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors" 
          on:click={nextMonth}
        >
          &gt;
        </button>
      </div>
      
      <!-- Selection Mode and Time Settings -->
      <div class="mb-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center space-x-2">
            <button 
              class="px-3 py-1 text-sm rounded-md transition-colors {selectionMode === 'single' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}"
              on:click={() => selectionMode = 'single'}
            >
              เลือกวันเดียว
            </button>
            <button 
              class="px-3 py-1 text-sm rounded-md transition-colors {selectionMode === 'range' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}"
              on:click={() => selectionMode = 'range'}
            >
              เลือกช่วงวัน
            </button>
          </div>
          
          <!-- Selection Status Indicator -->
          {#if selectionMode === 'range' && rangeSelectionState === 'end'}
            <div class="text-xs text-blue-600">กรุณาเลือกวันสิ้นสุด</div>
          {/if}
        </div>

        <!-- Enable Time Checkbox -->
        <div class="flex flex-wrap items-center gap-4 text-sm">

          <label class="flex items-center gap-2">
            <input 
              type="checkbox" 
              bind:checked={enableTime}
              class="rounded"
            />
            <span>เปิดใช้การเลือกเวลา</span>
        </div>

      </div>
      
      <!-- Calendar Grid -->
      <div class="mb-4">
        <!-- Day names -->
        <div class="grid grid-cols-7 mb-2">
          {#each dayNames as day}
            <div class="text-center font-medium text-sm text-gray-600">{day}</div>
          {/each}
        </div>
        
        <!-- Calendar days -->
        <div class="grid grid-cols-7 gap-1">
          {#each monthData as week}
            {#each week as day}
              <div 
                class="h-10 flex items-center justify-center rounded-md text-sm 
                      {!day ? '' : 'cursor-pointer'}
                      {selectionMode === 'single' && isSelected(day) ? 'bg-blue-500 text-white' : ''}
                      {selectionMode === 'range' && isRangeStart(day) ? 'bg-blue-600 text-white' : ''}
                      {selectionMode === 'range' && isRangeEnd(day) ? 'bg-blue-600 text-white' : ''}
                      {selectionMode === 'range' && isInRange(day) && !isRangeStart(day) && !isRangeEnd(day) ? 'bg-blue-100 text-blue-800' : ''}
                      {!isSelected(day) && day ? 'hover:bg-gray-100' : ''}"
                on:click={() => handleDateClick(day)}
              >
                {day ? day.getDate() : ''}
              </div>
            {/each}
          {/each}
        </div>
      </div>
      
      <!-- Current Selection Actions -->
      <div class="mt-4 border-t pt-4">
        <div class="flex justify-between items-center">
          <h4 class="text-md font-semibold text-gray-700">
            การดำเนินการเลือก
          </h4>
          <div class="flex gap-2">
            <button 
              class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
              on:click={resetSelection}
            >
              รีเซ็ต
            </button>
            <button 
              class="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              on:click={saveSelection}
              disabled={(selectionMode === 'single' && selectedDates.length === 0) || 
                       (selectionMode === 'range' && (!selectedRange.start || !selectedRange.end))}
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Saved Selections -->
    <div class="w-full lg:w-1/3">
      <h4 class="text-md font-semibold text-gray-700 mb-3">
        วันที่บันทึกไว้
      </h4>
      {#if savedSelections.length > 0}
        <ul class="space-y-2 max-h-96 overflow-y-auto">
          {#each savedSelections as selection (selection.id)}
            <li class="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-start">
                  <span class="inline-block w-4 h-4 rounded-full mr-2 mt-0.5 {selection.type === 'single' ? 'bg-green-500' : 'bg-blue-500'}"></span>
                  <span class="flex-1">{formatSelection(selection)}</span>
                </div>
                <button 
                  class="text-red-500 hover:text-red-700 ml-2"
                  on:click={() => showModal(selection.id)}
                >
                  ลบ
                </button>
              </div>
              
              {#if enableTime}
                <div class="flex gap-1 mt-2">
                  {#if selection.type === 'single'}
                    <button 
                      class="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition-colors"
                      on:click={() => editSelectionTime(selection)}
                    >
                      แก้ไขเวลา
                    </button>
                  {:else}
                    <button 
                      class="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition-colors"
                      on:click={() => editSelectionTime(selection, true)}
                    >
                      แก้ไขเริ่มต้น
                    </button>
                    <button 
                      class="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition-colors"
                      on:click={() => editSelectionTime(selection, false)}
                    >
                      แก้ไขสิ้นสุด
                    </button>
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-gray-500">ยังไม่มีวันที่บันทึกไว้</p>
      {/if}
    </div>
  </div>
</div>

<!-- Time Selection Modal -->
{#if showTimeModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <h3 class="text-lg font-semibold mb-4">
        เลือกเวลาสำหรับ {currentEditingDate?.toLocaleDateString('th-TH')}
      </h3>
      
      <div class="flex items-center gap-2 mb-6">
        <!-- Hour Selection -->
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">ชั่วโมง</label>
          <select 
            bind:value={selectedTime.hour}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each hourOptions as hour}
              <option value={hour}>{hour}</option>
            {/each}
          </select>
        </div>
        
        <div class="text-2xl font-bold mt-6">:</div>
        
        <!-- Minute Selection -->
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">นาที</label>
          <select 
            bind:value={selectedTime.minute}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each minuteOptions as minute}
              <option value={minute}>{minute}</option>
            {/each}
          </select>
        </div>
        
      </div>
      
      <!-- Modal Actions -->
      <div class="flex justify-end gap-2">
        <button 
          class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          on:click={cancelTimeSelection}
        >
          ยกเลิก
        </button>
        <button 
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          on:click={confirmTimeSelection}
        >
          ยืนยัน
        </button>
      </div>
    </div>
  </div>
{/if}

<ConfirmModal
  bind:show={showConfirmModal}
  title="ยืนยันการลบ"
  message="คุณแน่ใจหรือไม่ว่าต้องการลบการเลือกนี้?"
  confirmButtonText="ยืนยัน"
  cancelButtonText="ยกเลิก"
  confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
  on:confirm={() => deleteSelection(confirmedSelectionId)}
  on:cancel={() => showConfirmModal = false}
/>