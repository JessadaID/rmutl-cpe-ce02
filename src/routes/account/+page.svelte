<!-- src/routes/account/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { auth, db } from '$lib/firebase';
    import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Added missing updateDoc import
    import { onAuthStateChanged } from 'firebase/auth';
  import { successToast } from '$lib/customtoast';
  import Loading from '$lib/components/loading.svelte';
    // User data state
    let user = {
      name: '',
      email: '',
      // password: '••••••••' // We don't store or display the actual password
    };
  
    // Edit state
    let editingName = false;
    // let editingPassword = false; // We'll use the dedicated password change page
    let newName = '';
    // let newPassword = '';
    // let confirmPassword = '';
    // let passwordError = '';
    // let successMessage = '';
    let isLoading = true;
    let isAuthenticated = false;
  
    onMount(() => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          goto('/login');
          return;
        }
        isAuthenticated = true;
        isLoading = true;
  
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
  
          if (docSnap.exists()) {
            user = {
              name: docSnap.data().name || '',
              email: currentUser.email || '', // Use email from auth if not in Firestore
            };
            newName = user.name; // Initialize newName for editing
          } else {
            console.log('No such document!');
            // Handle the case where the user document doesn't exist
            user = {
              name: 'ไม่พบชื่อ',
              email: currentUser.email || '',
            };
            newName = user.name;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Handle error appropriately, e.g., display an error message
        } finally {
          isLoading = false;
        }
      });
  
      return () => unsubscribe();
    });
  
    // Handle name update
    async function updateName() {
      if (newName.trim() !== '') {
        isLoading = true;
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            throw new Error('No user logged in');
          }
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, { name: newName });
          user.name = newName;
          editingName = false;
          // showSuccess('ชื่อถูกอัพเดทเรียบร้อยแล้ว'); // Changed to Thai language
          successToast('ชื่อถูกอัพเดทเรียบร้อยแล้ว');
        } catch (error) {
          console.error('Error updating name:', error);
          // Handle error appropriately
        } finally {
          isLoading = false;
        }
      }
    }
  
    // Cancel editing
    function cancelEditing(field) {
      if (field === 'name') {
        editingName = false;
        newName = user.name;
      }
    }
  </script>
  
  <svelte:head>
    <title>บัญชีของฉัน</title>
    <meta name="description" content="จัดการข้อมูลบัญชีผู้ใช้ของคุณ" />
    <link rel="icon" href="/favicon.ico" />
  </svelte:head>
  
  {#if isAuthenticated}
    {#if isLoading}
    <Loading/>
    {:else}
      <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
          <!-- Header -->
          <div class="bg-indigo-600 p-6">
            <h1 class="text-white text-2xl font-bold text-center">บัญชีของฉัน</h1>
          </div>
  
          <!-- Content -->
          <div class="p-6">
            <!-- Success message -->
            <!-- {#if successMessage}
              <div
                class="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span class="block sm:inline">{successMessage}</span>
              </div>
            {/if} -->
  
            <!-- Profile section -->
            <div class="flex items-center justify-center mb-8">
              <div
                class="h-24 w-24 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 text-3xl font-bold"
              >
                {user.name && user.name.trim() ? user.name.split(' ').map((word) => word[0]).join('') : '?'}
              </div>
            </div>
  
            <!-- Name field -->
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="name">
                ชื่อ
              </label>
              {#if editingName}
                <div class="flex gap-2">
                  <input
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="name"
                    type="text"
                    bind:value={newName}
                    placeholder="กรุณาใส่ชื่อของคุณ"
                  />
                  <button
                    on:click={updateName}
                    class="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                  >
                    บันทึก
                  </button>
                  <button
                    on:click={() => cancelEditing('name')}
                    class="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                  >
                    ยกเลิก
                  </button>
                </div>
              {:else}
                <div class="flex justify-between items-center">
                  <div class="text-lg">{user.name || 'ไม่พบชื่อ'}</div>
                  <button
                    on:click={() => {
                      editingName = true;
                      newName = user.name;
                    }}
                    class="text-indigo-600 hover:text-indigo-800"
                  >
                    แก้ไข
                  </button>
                </div>
              {/if}
            </div>
  
            <!-- Email field (read-only) -->
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="email">
                อีเมล
              </label>
              <div class="text-lg">{user.email || 'ไม่พบอีเมล'}</div>
            </div>
  
            <!-- Password field -->
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                รหัสผ่าน
              </label>
              <div class="flex justify-between items-center">
                <div class="text-lg">••••••••</div>
                <a href="/account/edit-password" class="text-indigo-600 hover:text-indigo-800">
                  เปลี่ยนรหัสผ่าน
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}
  
  <style>
    /* Add any custom styles here */
  </style>
