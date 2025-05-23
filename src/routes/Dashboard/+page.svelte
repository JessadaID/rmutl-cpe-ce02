<script>
  import { onMount } from "svelte";
  import SearchMember from "./SearchMember.svelte";
  import Main from "./Main.svelte";
  import { getCookie } from "cookies-next"; // Corrected import if using 'cookies-next'
  // If using 'js-cookie', the import would be: import Cookies from 'js-cookie';
  import { goto } from "$app/navigation";
  import { checkAuthStatus } from "$lib/auth";

  let email = null;
  let role = null;
  let activeComponent = "Main"; // Default component
  let menuItems = [];

  const getMenuItems = (role) => {
        // Menu for admin
        if (role === 'admin') {
            return [
                { 
                  id: 'Main', 
                  label: 'หน้าหลัก', 
                  icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"/></svg>',
                  type: 'component',
                  target: 'Main'
                },
                { 
                  id: 'searchMember', 
                  label: 'จัดการสมาชิก', 
                  icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg>',
                  type: 'component',
                  target: 'SearchMember'
                },
                {
                  id: 'manageForms',
                  label: 'จัดการเปิด/ปิดฟอร์ม',
                  icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-3 3h3M5 14h.01M5 17h.01M8 5V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v3h2Z"/></svg>',
                  type: 'link',
                  href: '/TS_Dashboard/OpenForm'
                },
                {
                  id: 'manageTasks',
                  label: 'จัดการงาน (Tasks)',
                  icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.75 4.004v15.992m0-15.992H6.804a1 1 0 0 0-.994.92l-.006.08v14.008a1 1 0 0 0 .92.994l.08.006h3.946m0-15.992h6.442a1 1 0 0 1 .994.92l.006.08v14.008a1 1 0 0 1-.92.994l-.08.006H10.75m0-15.992V20m3.219-12.037H17.5V12h-3.531V7.963Zm0 6.074H17.5v4.037h-3.531v-4.037ZM6.781 8.037H10.25V12H6.781V8.037Zm0 6.074H10.25v4.037H6.781v-4.037Z"/></svg>',
                  type: 'link',
                  href: '/TS_Dashboard/Addtask'
                },
                {
                  id: 'viewProjects',
                  label: 'รายการโครงงาน (CE02)',
                  icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7h1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h11.5M7 14h6m-6 3h6m0-10h.5m-.5 3h.5M7 7h3v3H7V7Z"/></svg>',
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
</script>

<svelte:head>
  <title>Dashboard</title>
  <meta name="description" content="Dashboard for managing project proposals" />
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="flex h-[calc(100vh-4rem)]"> 
  <!-- Sidebar -->
  <div class="w-64 bg-gray-800 text-white p-4 h-full"> 
    {#each menuItems as item}
      <button
      class="w-full flex items-center py-2 px-4 mb-2 text-left rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 {(item.type === 'component' && activeComponent === item.target) ? 'bg-gray-700' : ''}"
      on:click={() => handleMenuClick(item)}
    >
    <span class="text-xl">{@html item.icon}</span>
    <span class="ml-3">{item.label}</span>
    </button>
    {/each}

    <!-- Add more sidebar buttons here if needed -->
  </div>

  <!-- Main Content -->
  <div class="flex-1 p-4 overflow-y-auto"> 
    {#if activeComponent === "SearchMember"}
      <SearchMember />
      {:else if activeComponent === "Main"}
      <Main />
    {/if}
  </div>
</div>
