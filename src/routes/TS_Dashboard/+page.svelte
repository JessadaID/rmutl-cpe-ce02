<!-- src/routes/TS_Dashboard/+page.svelte -->
<script>
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
  
    export let data;
    const { menuItems } = data;
  
    //$: console.log("Menu Items:", menuItems);
    $: visibleMenuItems = menuItems.filter(item => item.id !== '');
  
    function handleCardClick(itemId) {
      if (itemId) {
        goto(`/TS_Dashboard/${itemId}`);
      } else {
        console.warn("ไม่สามารถนำทางได้: Item ID ว่างเปล่า");
      }
    }
  </script>
  
<svelte:head>
    <title>Teacher Dashboard</title>
    <meta name="description" content="Teacher Dashboard - จัดการแบบฟอร์มเสนอหัวข้อโครงงานคอมพิวเตอร์ของคุณ" />
    <link rel="icon" href="/favicon.ico" />
  </svelte:head>

  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center text-gray-800 mb-10">
      Teacher Dashboard
    </h1>
  
    {#if visibleMenuItems.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {#each visibleMenuItems as item (item.id)}
          <button
            on:click={() => handleCardClick(item.id)}
            class="bg-white rounded-xl shadow-lg p-6 text-center transform transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex flex-col items-center justify-start h-full min-h-[180px]"
            transition:fade={{ duration: 300 }}
            aria-label={`ไปที่ ${item.label}`}
          >
            <div class="mb-4 text-indigo-600 w-12 h-12 flex items-center justify-center">
              {@html item.icon}
            </div>
            <h2 class="text-xl font-semibold text-gray-800">
              {item.label}
            </h2>
          </button>
        {/each}
      </div>
    {:else if menuItems.length > 0}
      <p class="text-center text-gray-500 mt-10">
        คุณอยู่ในหน้าหลักของ Dashboard แล้ว
      </p>
    {:else}
      <p class="text-center text-gray-500 mt-10">
        ไม่มีส่วนแดชบอร์ดที่ใช้งานได้สำหรับบทบาทของคุณ
      </p>
    {/if}
  </div>
  
  <style>
    :global(.icon) {
      display: inline-block;
      vertical-align: middle;
      width: 100%;
      height: 100%;
    }
  </style>
  