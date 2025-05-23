<script>
    import { onMount } from 'svelte';

    // รายชื่อเดือนภาษาไทย (แบบย่อ)
    const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    // รายชื่อวันภาษาไทย (แบบย่อ)
    const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // คำนวณวันแรกของเดือน (0 = วันอาทิตย์, 1 = วันจันทร์, ...)
    let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // **เก็บข้อมูลการเลือกวันของแต่ละคน**
    let userSelections = [];

    // Function to add or update user selections
    export function updateUserData(data) {
        if (Array.isArray(data)) {
            data.forEach(userData => {
                if (userData && userData.email && userData.savedSelections) {
                    const { email, savedSelections ,name } = userData;

                    // Find if user already exists
                    const userIndex = userSelections.findIndex(user => user.userId === email);

                    if (userIndex > -1) {
                        // Update existing user
                        userSelections[userIndex] = {
                            ...userSelections[userIndex],
                            selectedDates: savedSelections.map(item => {
                                if (item.type === 'single') {
                                    return { type: 'single', date: new Date(item.date) };
                                } else if (item.type === 'range') {
                                    return { type: 'range', start: new Date(item.start), end: new Date(item.end) };
                                }
                                return null;
                            }).filter(item => item !== null),
                        };
                    } else {
                        // Add new user
                        userSelections = [...userSelections, {
                            userId: email,
                            userName: name, // You might want to get the user's name from somewhere else
                            color: getRandomColor(), // generate a random color
                            selectedDates: savedSelections.map(item => {
                                if (item.type === 'single') {
                                    return { type: 'single', date: new Date(item.date) };
                                } else if (item.type === 'range') {
                                    return { type: 'range', start: new Date(item.start), end: new Date(item.end) };
                                }
                                return null;
                            }).filter(item => item !== null),
                        }];
                    }
                }
            });
        } else if (data && data.email && data.savedSelections) {
            // Handle single user data (for backward compatibility)
            const { email, savedSelections , name} = data;
            const userIndex = userSelections.findIndex(user => user.userId === email);

            if (userIndex > -1) {
                userSelections[userIndex] = {
                    ...userSelections[userIndex],
                    selectedDates: savedSelections.map(item => {
                        if (item.type === 'single') {
                            return { type: 'single', date: new Date(item.date) };
                        } else if (item.type === 'range') {
                            return { type: 'range', start: new Date(item.start), end: new Date(item.end) };
                        }
                        return null;
                    }).filter(item => item !== null),
                };
            } else {
                userSelections = [...userSelections, {
                    userId: email,
                    userName: name,
                    color: getRandomColor(),
                    selectedDates: savedSelections.map(item => {
                        if (item.type === 'single') {
                            return { type: 'single', date: new Date(item.date) };
                        } else if (item.type === 'range') {
                            return { type: 'range', start: new Date(item.start), end: new Date(item.end) };
                        }
                        return null;
                    }).filter(item => item !== null),
                }];
            }
        }
    }

    // Function to generate random background color
    function getRandomColor() {
        const letters = 'BCDEF'.split('');
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * letters.length)];
        }
        return `bg-[${color}]`
    }
    // สร้างปฏิทินเพื่อแสดงการเลือกวันของแต่ละคน
    function isDateSelected(user, day) {
        return user.selectedDates.some(selection => {
            const currentDate = new Date(currentYear, currentMonth, day);
            if (selection.type === 'single') {
                return selection.date.getDate() === day &&
                    selection.date.getMonth() === currentMonth &&
                    selection.date.getFullYear() === currentYear;
            } else if (selection.type === 'range') {
                return currentDate >= selection.start && currentDate <= selection.end;
            }
            return false;
        });
    }

    function isDateInRange(user, day) {
        const currentDate = new Date(currentYear, currentMonth, day);
        return user.selectedDates.some(selection => {
            if (selection.type === 'range') {
                return currentDate > selection.start && currentDate < selection.end
            }
            return false;
        })
    }
    function isRangeStart(user, day){
        const currentDate = new Date(currentYear, currentMonth, day);
        return user.selectedDates.some(selection => {
            if (selection.type === 'range') {
                return selection.start.getDate() === day &&
                    selection.start.getMonth() === currentMonth &&
                    selection.start.getFullYear() === currentYear;
            }
            return false;
        });
    }
    function isRangeEnd(user, day){
        const currentDate = new Date(currentYear, currentMonth, day);
        return user.selectedDates.some(selection => {
            if (selection.type === 'range') {
                return selection.end.getDate() === day &&
                    selection.end.getMonth() === currentMonth &&
                    selection.end.getFullYear() === currentYear;
            }
            return false;
        });
    }
    // ตรวจสอบว่าวันที่กำหนดเป็นวันอาทิตย์หรือไม่
    function isSunday(day) {
        return new Date(currentYear, currentMonth, day).getDay() === 0;
    }

    // ตรวจสอบว่าวันที่กำหนดเป็นวันเสาร์หรือไม่
    function isSaturday(day) {
        return new Date(currentYear, currentMonth, day).getDay() === 6;
    }

    // ฟังก์ชันสำหรับหาชื่อวันของวันที่
    function getDayName(day) {
        const dayIndex = new Date(currentYear, currentMonth, day).getDay();
        return thaiDays[dayIndex];
    }

    function changeMonth(offset) {
        currentMonth += offset;

        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }

        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }

        daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

        // ไม่ต้องอัปเดตวันที่เลือกของผู้ใช้ เพราะเราต้องการให้วันที่เลือกคงอยู่ในเดือนเดิม
    }

    onMount(() => {
        daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    });
</script>

<div class="container mx-auto p-4 font-sans">
    <!-- ส่วนหัวปฏิทิน -->
    <div class="flex justify-between items-center mb-6">
        <div class="text-2xl font-semibold">ปฏิทินสำหรับเดือน {thaiMonths[currentMonth]} {currentYear}</div>

        <div class="flex space-x-2">
            <button
                class="px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                on:click={() => changeMonth(-1)}
            >
                &lt; เดือนก่อน
            </button>
            <button
                class="px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                on:click={() => changeMonth(1)}
            >
                เดือนถัดไป &gt;
            </button>
        </div>
    </div>

    <!-- ปฏิทินแบบตาราง -->
    <div class="overflow-x-auto">
        <table class="w-full border-collapse">
            <thead>
                <tr class="">
                    <th class="border-none  p-2 w-32"></th>
                    {#each Array(daysInMonth) as _, index}
                        <th class="border-none  p-2 text-center w-10">
                            <!-- แสดงชื่อวัน (จ., อ., ...) -->
                            <div class={isSunday(index + 1) || isSaturday(index + 1) ? "text-red-600" : ""}>
                                {getDayName(index + 1)}
                            </div>
                        </th>
                    {/each}
                </tr>
                <tr class="bg-gray-100">
                    <th class="border border-gray-300 p-2 w-32">ชื่อ</th>
                    {#each Array(daysInMonth) as _, index}
                        <th class="border border-gray-300 p-2 text-center w-10">
                            <!-- แสดงตัวเลขวัน -->
                            <div class={isSunday(index + 1) || isSaturday(index + 1) ? "text-red-600" : ""}>
                                {index + 1}
                            </div>
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                
                {#each userSelections as user}
                    <tr>
                        <td class="border border-gray-300 p-2 font-medium whitespace-nowrap">{user.userName}</td>
                        {#each Array(daysInMonth) as _, dayIndex}
                            {@const day = dayIndex + 1}
                            <td class="border border-gray-300 p-1 text-center 
                            {isDateSelected(user, day) ? user.color : ''}
                            {isDateInRange(user,day) ? `${user.color} bg-opacity-50` : ''}
                            {isRangeStart(user,day) ? `${user.color}` : ''}
                            {isRangeEnd(user,day) ? `${user.color}` : ''}
                            ">
                                {#if isDateSelected(user, day)}
                                    <span class="w-full h-full flex items-center justify-center">✓</span>
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>

        {#if userSelections.length < 1 || userSelections == undefined}
            <center><p class="p-5">ไม่พบข้อมูล</p></center>
        {/if}
    </div>

</div>
