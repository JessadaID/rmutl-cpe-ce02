<script>
  import { onMount } from "svelte";
  import { successToast, dangerToast } from "$lib/customtoast"; // Import toasts
  import { getrolename } from "$lib/Getrolename";
  import Loading from "$lib/components/loading.svelte";
  import {debounce} from "$lib/debounce"; // Import debounce function

  let members = [];
  let currentPage = 1;
  let pageSize = 10;
  let searchQuery = "";
  let selectedRoleFilter = "";
  let isLoading = false;
  let noDataFound = false;
  let savingStates = {}; 

  const roles = ["user", "teacher", "subject_teacher", "admin"]; // Available roles

  async function loadMembers(
    page = 1,
    search = "",
    roleFilter = "", // Use the renamed variable
    resetPagination = false
  ) {
    isLoading = true;
    noDataFound = false;
    savingStates = {}; // Reset saving states on load

    if (resetPagination) {
      // lastVisible is not needed with API pagination
      currentPage = 1;
    }

    let url = `/api/user?page=${page}&limit=${pageSize}`;


    if (search) {
      url += `&email=${encodeURIComponent(search)}`;
    }
    if (roleFilter) {
      url += `&role=${encodeURIComponent(roleFilter)}`;
    }

    try {
      const response = await fetch(url);
      //console.log(await response.json()) // Log the response for debugging
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data&& Array.isArray(data)) {
        members = data.map(member => ({
          id: member.id, // Assuming uid is the document ID
          email: member.email,
          name: member.name,
          fcmToken: member.fcmToken,
          role: member.role
        }));
        noDataFound = members.length === 0 && page === 1;
      } else {
        members = [];
        noDataFound = true;
      }
      currentPage = page;

    } catch (error) {
        console.error("Error loading members:", error);
        dangerToast("เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก: " + error.message);
        members = [];
        noDataFound = true;
    } finally {
        isLoading = false;
    }
  }

  onMount(() => {
    loadMembers();
  });

  async function nextPage() {
    if (!isLoading && members.length === pageSize) { // Only allow next if the current page was full
      await loadMembers(currentPage + 1, searchQuery, selectedRoleFilter, false);
    }
  }

  async function prevPage() {
    if (currentPage > 1 && !isLoading) {
       await loadMembers(1, searchQuery, selectedRoleFilter, true); // Reset to page 1
    }
  }

  async function search() {
    await loadMembers(1, searchQuery, selectedRoleFilter, true); // Load page 1 and reset pagination
  }



  const debouncedSearch = debounce(search);

  // Function to save the updated role
  async function saveRole(memberId, newRole) {
    savingStates = { ...savingStates, [memberId]: true }; // Start saving state for this row
    try {
      const response = await fetch(`/api/user/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } else {
        successToast(`อัปเดตบทบาทสำเร็จ`);
      }
    } catch (error) {
      console.error("Error updating role:", error);
      dangerToast(`เกิดข้อผิดพลาดในการอัปเดตบทบาท: ${error.message}`);
    } finally {
      savingStates = { ...savingStates, [memberId]: false }; // End saving state for this row
    }
  }


</script>

<div class="max-w-4xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">จัดการสมาชิก</h1>

  <div class="flex flex-col md:flex-row items-center gap-4 mb-6">
    <input
      type="text"
      placeholder="ค้นหาอีเมลสมาชิก..."
      bind:value={searchQuery}
      on:input={debouncedSearch}
      class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
    />
    <select
      bind:value={selectedRoleFilter}
      on:change={search}
      class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
    >
      <option value="">บทบาททั้งหมด</option>
      {#each roles as role}
        <option value={role}>{getrolename(role)}</option>
      {/each}
    </select>
    <!-- Remove explicit search button as search happens on input/change -->
    <!--
    <button
      on:click={search}
      class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      disabled={isLoading}
    >
      ค้นหา
    </button>
     -->
  </div>

  {#if isLoading && !members.length} <!-- Show loading only if list is empty -->
    <div class="flex items-center justify-center h-64">
      <Loading />
    </div>
  {:else if members.length === 0 && !isLoading}
    <div class="text-center py-10">
      <p class="text-gray-500">ไม่มีสมาชิกที่ตรงกับเงื่อนไข</p>
    </div>
  {:else if noDataFound}
    <div class="text-center py-10">
      <p class="text-red-500 font-semibold">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
    </div>
  {:else}
    <div class="overflow-x-auto shadow rounded-lg">
      <table class="min-w-full table-auto border-collapse border border-gray-200">
        <thead class="bg-gray-100">
          <tr>
            <th class="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">อีเมล</th>
            <th class="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">ชื่อผู้ใช้</th>
            <th class="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider" title=" Web Push Notification">รับการแจ้งเตือน</th>
            <th class="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">บทบาท</th>
            <th class="border-b border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-600 uppercase tracking-wider">จัดการ</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each members as member (member.id)}
            <tr class="hover:bg-gray-50 transition-colors duration-150">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{member.email}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{member.name || "-"}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {#if member.fcmToken}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                {/if}
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                <!-- Role Dropdown for Editing -->
                <select
                  bind:value={member.role}
                  class="p-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={savingStates[member.id]}
                >
                  {#each roles as r}
                    <option value={r}>{getrolename(r)}</option>
                  {/each}
                </select>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-center">
                 <!-- Save Button -->
                 <button
                    on:click={() => saveRole(member.id, member.role)}
                    class="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-wait"
                    disabled={savingStates[member.id]}
                 >
                    {#if savingStates[member.id]}
                        <span class="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                        บันทึก...
                    {:else}
                        บันทึก
                    {/if}
                 </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Pagination Controls -->
  {#if !noDataFound && members.length > 0}
    <div class="flex items-center justify-between mt-6">
      <button
        on:click={prevPage}
        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={currentPage === 1 || isLoading}
      >
        ก่อนหน้า
      </button>
      <span class="text-sm text-gray-700">หน้าที่ {currentPage}</span>
      <button
        on:click={nextPage}
        class="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={members.length < pageSize || isLoading}
      >
        ถัดไป
      </button>
    </div>
  {/if}
</div>
