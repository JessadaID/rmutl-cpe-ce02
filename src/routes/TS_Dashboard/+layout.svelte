<!-- src/routes/TS_Dashboard/+layout.svelte -->
<script>
    import Sidebar from "$lib/components/Sidebar.svelte"; // นำเข้า Sidebar component

    export let data;
    let title = "Dashboard อาจารย์"; // กำหนด title สำหรับ Sidebar
    const { menuItems } = data;
  </script>
  
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar สามารถส่ง menuItems เข้าไปได้ -->
    <Sidebar {menuItems} {title}/>
    
    <main class="flex-1 p-6 overflow-y-auto">
      <slot />
    </main>
  </div>
  