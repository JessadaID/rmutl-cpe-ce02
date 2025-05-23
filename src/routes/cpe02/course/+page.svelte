<script>
  // ข้อมูล Timeline เฉพาะส่วนการเสนอโครงงาน (1 ภาคเรียน)
  const proposalTimeline = [
    {
      weeks: "สัปดาห์ที่ 1-4",
      title: "ค้นหาหัวข้อและอาจารย์ที่ปรึกษา",
      details: [
        "ระดมสมอง/ค้นคว้าหัวข้อที่สนใจ",
        "พิจารณาความเป็นไปได้ (เวลา, ทรัพยากร, ความรู้)",
        "ติดต่อและปรึกษาอาจารย์ที่เชี่ยวชาญ",
        "กำหนดหัวข้อที่ชัดเจนร่วมกับอาจารย์ที่ปรึกษา",
      ],
      icon: "🔍",
      color: "blue",
    },
    {
      weeks: "สัปดาห์ที่ 4-8",
      title: "พัฒนาข้อเสนอโครงงาน (Proposal)",
      details: [
        "กำหนดวัตถุประสงค์ ขอบเขต และประโยชน์ที่คาดว่าจะได้รับ",
        "ทบทวนวรรณกรรมที่เกี่ยวข้อง (Literature Review)",
        "ออกแบบวิธีการดำเนินงานวิจัย/พัฒนา (Methodology)",
        "วางแผนการดำเนินงาน (Timeline/Gantt Chart)",
        "จัดทำร่างข้อเสนอโครงงานฉบับสมบูรณ์",
      ],
      icon: "📝",
      color: "purple",
    },
    {
      weeks: "สัปดาห์ที่ 9-11",
      title: "ตรวจ ยื่น และเตรียมนำเสนอข้อเสนอ",
      details: [
        "ส่งร่างข้อเสนอให้อาจารย์ที่ปรึกษาตรวจและแก้ไข",
        "จัดรูปแบบข้อเสนอตามข้อกำหนดของภาควิชา/คณะ",
        "ยื่นข้อเสนอฉบับสมบูรณ์ตามกำหนด",
        "เตรียมตัวสำหรับการนำเสนอข้อเสนอ (ถ้ามี)",
      ],
      icon: "📤",
      color: "orange",
    },
    {
      weeks: "สัปดาห์ที่ 12-14",
      title: "การนำเสนอ/สอบ และแก้ไขข้อเสนอ",
      details: [
          "นำเสนอข้อเสนอโครงงานต่อคณะกรรมการ (Proposal Defense/Examination)",
          "รับฟังข้อเสนอแนะและคำถามจากกรรมการ",
          "ดำเนินการแก้ไขข้อเสนอตามมติกรรมการ/อาจารย์ที่ปรึกษา",
      ],
      icon: "🗣️",
      color: "red",
    },
    {
      weeks: "สัปดาห์ที่ 15",
      title: "ส่งฉบับแก้ไขและรอผลอนุมัติสมบูรณ์",
      details: [
          "ส่งข้อเสนอโครงงานฉบับแก้ไขสมบูรณ์",
          "รอการยืนยันอนุมัติโครงงานอย่างเป็นทางการจากภาควิชา/คณะ",
          "เตรียมพร้อมสำหรับเริ่มดำเนินงานในภาคเรียนถัดไป (หากโครงงานต่อเนื่อง)"
      ],
      icon: "✅",
      color: "green",
    },
  ];

  // Color configurations
  const colorConfig = {
    blue: {
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600',
      accent: 'text-blue-600',
      border: 'border-blue-200',
      lightBg: 'bg-blue-50'
    },
    purple: {
      bg: 'bg-purple-500',
      hover: 'hover:bg-purple-600',
      accent: 'text-purple-600',
      border: 'border-purple-200',
      lightBg: 'bg-purple-50'
    },
    orange: {
      bg: 'bg-orange-500',
      hover: 'hover:bg-orange-600',
      accent: 'text-orange-600',
      border: 'border-orange-200',
      lightBg: 'bg-orange-50'
    },
    red: {
      bg: 'bg-red-500',
      hover: 'hover:bg-red-600',
      accent: 'text-red-600',
      border: 'border-red-200',
      lightBg: 'bg-red-50'
    },
    green: {
      bg: 'bg-green-500',
      hover: 'hover:bg-green-600',
      accent: 'text-green-600',
      border: 'border-green-200',
      lightBg: 'bg-green-50'
    }
  };

  let activeItem = null;

  function toggleItem(index) {
    activeItem = activeItem === index ? null : index;
  }
</script>

<svelte:head>
  <title>ไทม์ไลน์การเสนอโครงงาน</title>
  <meta name="description" content="ไทม์ไลน์การเสนอโครงงานวิศวกรรมคอมพิวเตอร์" />
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
  <!-- Header Section -->
  <div class="bg-white shadow-sm border-b">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-6">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-3">
          ไทม์ไลน์การเสนอโครงงาน
        </h1>
        <p class="text-xl text-gray-600 mb-2">
          วิชา ENGCE113 การเตรียมโครงงานวิศวกรรมคอมพิวเตอร์
        </p>
        <div class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          ระยะเวลา 1 ภาคเรียน (15 สัปดาห์)
        </div>
      </div>
    </div>
  </div>

  <!-- Timeline Section -->
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Progress Overview -->
    <div class="mb-12">
      <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">ภาพรวมการดำเนินงาน</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {#each proposalTimeline as item, i}
            <div class="text-center">
              <div class="flex items-center justify-center w-12 h-12 {colorConfig[item.color].bg} rounded-full mb-2 mx-auto transition-transform hover:scale-110">
                <span class="text-xl">{item.icon}</span>
              </div>
              <p class="text-xs text-gray-600 font-medium">{item.weeks}</p>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Timeline Content -->
    <div class="relative">
      <!-- Desktop Timeline Line -->
      <div class="hidden md:block absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 via-orange-200 via-red-200 to-green-200 rounded-full"></div>
      
      <!-- Mobile Timeline Line -->
      <div class="md:hidden absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 via-orange-200 via-red-200 to-green-200 rounded-full"></div>

      <div class="space-y-8">
        {#each proposalTimeline as item, i}
          <div class="relative group">
            <!-- Timeline Marker -->
            <div class="absolute left-0 md:left-0 flex items-center justify-center">
              <div class="w-12 h-12 md:w-16 md:h-16 {colorConfig[item.color].bg} {colorConfig[item.color].hover} rounded-full shadow-lg flex items-center justify-center cursor-pointer transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl z-10"
                   on:click={() => toggleItem(i)}
                   on:keydown={(e) => e.key === 'Enter' && toggleItem(i)}
                   tabindex="0"
                   role="button">
                <span class="text-xl md:text-2xl">{item.icon}</span>
              </div>
            </div>

            <!-- Content Card -->
            <div class="ml-16 md:ml-24">
              <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl {activeItem === i ? 'ring-2 ring-blue-200' : ''}">
                <!-- Card Header -->
                <div class="p-6 pb-4 {colorConfig[item.color].lightBg} border-b {colorConfig[item.color].border}">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="inline-flex items-center px-3 py-1 {colorConfig[item.color].lightBg} {colorConfig[item.color].accent} rounded-full text-sm font-semibold mb-3 border {colorConfig[item.color].border}">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {item.weeks}
                      </div>
                      <h3 class="text-xl font-bold text-gray-900 leading-tight">
                        {item.title}
                      </h3>
                    </div>
                    <button 
                      class="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      on:click={() => toggleItem(i)}
                    >
                      <svg class="w-5 h-5 transform transition-transform {activeItem === i ? 'rotate-180' : ''}" 
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Card Content -->
                <div class="p-6 {activeItem === i ? 'block' : 'hidden md:block'}">
                  {#if item.details && item.details.length > 0}
                    <div class="space-y-3">
                      {#each item.details as detail, j}
                        <div class="flex items-start group/item">
                          <div class="flex-shrink-0 w-6 h-6 {colorConfig[item.color].bg} rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <span class="text-white text-xs font-bold">{j + 1}</span>
                          </div>
                          <p class="text-gray-700 leading-relaxed group-hover/item:text-gray-900 transition-colors">
                            {detail}
                          </p>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>

                <!-- Progress Indicator -->
                <div class="px-6 pb-4">
                  <div class="flex items-center justify-between text-sm text-gray-500">
                    <span>ขั้นตอนที่ {i + 1} จาก {proposalTimeline.length}</span>
                    <div class="flex items-center">
                      <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div class="{colorConfig[item.color].bg} h-2 rounded-full transition-all duration-500" 
                             style="width: {((i + 1) / proposalTimeline.length) * 100}%"></div>
                      </div>
                      <span class="font-medium">{Math.round(((i + 1) / proposalTimeline.length) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Tips Section -->
    <div class="mt-16">
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
        <div class="p-8">
          <div class="flex items-center mb-6">
            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <h4 class="text-2xl font-bold text-gray-900">ข้อแนะนำ</h4>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <h5 class="font-semibold text-gray-900">ความยืดหยุ่น</h5>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed">ไทม์ไลน์นี้เป็นแนวทาง ควรปรับตามสถานการณ์และข้อกำหนดของแต่ละโครงงาน</p>
            </div>

            <div class="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <h5 class="font-semibold text-gray-900">การสื่อสาร</h5>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed">ปรึกษาอาจารย์ที่ปรึกษาอย่างสม่ำเสมอและรายงานความก้าวหน้าเป็นระยะ</p>
            </div>

            <div class="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <h5 class="font-semibold text-gray-900">การจัดการเวลา</h5>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed">แบ่งงานเป็นงานย่อยและกำหนดเดดไลน์ย่อยเพื่อการติดตามที่ดีขึ้น</p>
            </div>

            <div class="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <h5 class="font-semibold text-gray-900">เผื่อเวลา</h5>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed">เตรียมพร้อมสำหรับปัญหาหรือการแก้ไขที่อาจเกิดขึ้นในแต่ละขั้นตอน</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>