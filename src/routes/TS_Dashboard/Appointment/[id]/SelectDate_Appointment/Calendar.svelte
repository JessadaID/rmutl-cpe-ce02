<script>
    import { onMount, createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
  
    // Props
    export let selectionMode = 'single'; // 'single' or 'range'
    export let selectedDates = []; // For single date selection mode
    export let selectedRange = { start: null, end: null }; // For range selection mode
    export let month = new Date().getMonth();
    export let year = new Date().getFullYear();
    export let savedSelections = []; // Stores both single dates and ranges
    // State variables
    let rangeSelectionState = null; // 'start', 'end', or null
    let tempStart = null;
    let tempEnd = null;
  
    // Reactive variables
    $: monthData = getMonthData(month, year);
    $: monthName = new Date(year, month, 1).toLocaleString('th-TH', { month: 'long' });
    
    // Reactive functions for styling
    $: isSelected = (date) => {
      if (!date) return false;
      
      if (selectionMode === 'single') {
        return selectedDates.some(d => isDateEqual(d, date));
      } else {
        // Range selection mode
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
      
      // Create a 6x7 grid (6 weeks, 7 days)
      const calendarDays = [];
      let dayCounter = 1;
      
      for (let week = 0; week < 6; week++) {
        const weekDays = [];
        for (let day = 0; day < 7; day++) {
          if (week === 0 && day < startingDayOfWeek) {
            // Empty cells before the first day of the month
            weekDays.push(null);
          } else if (dayCounter > daysInMonth) {
            // Empty cells after the last day of the month
            weekDays.push(null);
          } else {
            // Valid day of the month
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
      
      if (selectionMode === 'single') {
        // Single date selection mode
        const index = selectedDates.findIndex(d => isDateEqual(d, date));
        
        if (index >= 0) {
          // Remove date if already selected
          selectedDates = [
            ...selectedDates.slice(0, index),
            ...selectedDates.slice(index + 1)
          ];
        } else {
          // Add date
          selectedDates = [...selectedDates, new Date(date)];
        }
      } else {
        // Range selection mode
        if (!rangeSelectionState || rangeSelectionState === 'start') {
          // Start new selection
          tempStart = new Date(date);
          tempEnd = null;
          rangeSelectionState = 'end';
          selectedRange = { start: tempStart, end: null };
        } else if (rangeSelectionState === 'end') {
          // If clicking the same date as start, make it a single-day range
          if (isDateEqual(date, tempStart)) {
            tempEnd = new Date(date);
            selectedRange = {
              start: tempStart,
              end: tempEnd
            };
            rangeSelectionState = null;
            return;
          }
          
          // Complete selection
          if (date < tempStart) {
            // If end date is before start date, swap them
            tempEnd = new Date(tempStart);
            tempStart = new Date(date);
          } else {
            tempEnd = new Date(date);
          }
          
          // Update selected range
          selectedRange = {
            start: tempStart,
            end: tempEnd
          };
          
          // Reset selection mode
          rangeSelectionState = null;
        }
      }
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
        // Save single date selections
        const newSavedSelections = selectedDates.map(date => ({
          id: Date.now() + Math.random(), // Ensure unique ID
          type: 'single',
          date: new Date(date)
        }));
        
        savedSelections = [...savedSelections, ...newSavedSelections];
        dispatch('save', { 
          savedSelections,
          currentSelection: { 
            type: 'single', 
            dates: [...selectedDates] 
          }
        });
        
        // Optional: Reset selection after saving
        // selectedDates = [];
      } else if (selectionMode === 'range' && selectedRange.start && selectedRange.end) {
        // Save range selection
        savedSelections = [...savedSelections, { 
          id: Date.now(),
          type: 'range',
          start: new Date(selectedRange.start), 
          end: new Date(selectedRange.end)
        }];
        
        dispatch('save', { 
          savedSelections,
          currentSelection: {
            type: 'range',
            range: { ...selectedRange }
          }
        });
        
        // Optional: Reset selection after saving
        // selectedRange = { start: null, end: null };
        // rangeSelectionState = null;
      }

      resetSelection()
    }
  
    function formatSelection(selection) {
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      
      if (selection.type === 'single') {
        return selection.date.toLocaleDateString('th-TH', options);
      } else {
        const startStr = selection.start.toLocaleDateString('th-TH', options);
        const endStr = selection.end.toLocaleDateString('th-TH', options);
        const days = Math.floor((selection.end - selection.start) / (1000 * 60 * 60 * 24)) + 1;
        return `${startStr} - ${endStr} (${days} วัน)`;
      }
    }
  
    function deleteSelection(id) {
      savedSelections = savedSelections.filter(selection => selection.id !== id);
      dispatch('delete', { savedSelections, deletedId: id });
    }
  
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  </script>
  
  <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-4">
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
    
    <!-- Selection Mode Toggle -->
    <div class="mb-4 flex items-center justify-between">
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
    
    <!-- Current Selection Display -->
    <div class="mt-4 border-t pt-4">
      <div class="flex justify-between items-center mb-2">
        <h4 class="text-md font-semibold text-gray-700">
            วันที่บันทึก
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
  
      <!-- Saved Selections -->
      {#if savedSelections.length > 0}
        <ul class="space-y-2">
          {#each savedSelections as selection}
            <li class="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-md p-2 text-sm">
              <div class="flex items-center">
                <span class="inline-block w-4 h-4 rounded-full mr-2 {selection.type === 'single' ? 'bg-green-500' : 'bg-blue-500'}"></span>
                <span>{formatSelection(selection)}</span>
              </div>
              <button 
                class="text-red-500 hover:text-red-700"
                on:click={() => deleteSelection(selection.id)}
              >
                ลบ
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>