<script>
  import { onMount } from "svelte";
  import { getCookie } from "cookies-next"; // Corrected import if using 'cookies-next'
  // If using 'js-cookie', the import would be: import Cookies from 'js-cookie';
  import { goto } from "$app/navigation";
  import { checkAuthStatus } from "$lib/auth";

  // Import components
  import Sidebar from "$lib/components/Sidebar.svelte";

  // State
  let email = null;
  let role = null;
  let activeComponent = "Main"; // Default component
  let menuItems = [];
  let isSidebarOpen = false; // State for the responsive sidebar

  const getMenuItems = (role) => {
        // Menu for admin
        if (role === 'admin') {
            return [
                { 
                  id: '/Dashboard/', 
                  label: 'หน้าหลัก', 
                  icon: '<svg class="w-6 h-6 text-gray-800 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"/></svg>',
                  type: 'component',
                  target: '/Dashboard/Main'
                },
                { 
                  id: '/Dashboard/manageMember', 
                  label: 'จัดการสมาชิก', 
                  icon: '<svg class="w-6 h-6 text-gray-800 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg>',
                  type: 'component',
                  target: '/Dashboard/SearchMember'
                },
                {
                  id: '/TS_Dashboard/OpenForm',
                  label: 'จัดการเปิด/ปิดฟอร์ม',
                  icon: '<svg class="w-6 h-6 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-3 3h3M5 14h.01M5 17h.01M8 5V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v3h2Z"/></svg>',
                  type: 'link',
                  href: '/TS_Dashboard/OpenForm'
                },
                {
                  id: '/TS_Dashboard/Addtask',
                  label: 'จัดการงาน (Tasks)',
                  icon: '<svg class="w-6 h-6 text-gray-800" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-checklist"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9.615 20h-2.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8" /><path d="M14 19l2 2l4 -4" /><path d="M9 8h4" /><path d="M9 12h2" /></svg>',
                  type: 'link',
                  href: '/TS_Dashboard/Addtask'
                },
                {
                  id: '/cpe02/data',
                  label: 'รายการโครงงาน (CE02)',
                  icon: '<svg class="w-6 h-6 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7h1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h11.5M7 14h6m-6 3h6m0-10h.5m-.5 3h.5M7 7h3v3H7V7Z"/></svg>',
                  type: 'link',
                  href: '/cpe02/data'
                }
            ];
        } 
        // Default empty menu
        return [];
    };
  

  onMount(() => {
    if(checkAuthStatus()){
      role = getCookie('role');
      email = getCookie('email');
      menuItems = getMenuItems(role);
    }
  
    if (!email || role !== "admin") {
      // Consider adding a small delay or using tick() if redirection issues occur
      goto("./../cpe02");
    }
  });

  function handleMenuClick(item) {
    if (item.type === 'component') {
      activeComponent = item.target;
    } else if (item.type === 'link') {
      goto(item.href);
    }
  }

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }
</script>




<div class="relative flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
  <!-- Use the responsive Sidebar component -->
  <Sidebar
    bind:isOpen={isSidebarOpen}
    {menuItems}
    title="Admin Dashboard"
    on:itemclick={(event) => handleMenuClick(event.detail)}
  />

  <!-- Main Content Area -->
  <main
    class="flex-1 overflow-y-auto transition-all duration-300 ease-in-out"
  
  >
    <!-- Header for Mobile with Hamburger Menu -->
    <header class="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 p-4 backdrop-blur-sm lg:hidden">
      <h1 class="text-lg font-bold">{menuItems.find(m => m.id === activeComponent)?.label || 'Dashboard'}</h1>
      <button on:click={toggleSidebar} class="rounded p-2 hover:bg-gray-200" aria-label="Toggle Menu">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
        </svg>
      </button>
    </header>

    <!-- Content based on activeComponent -->
    <div class="p-6">
      <slot />
    </div>
  </main>
</div>



