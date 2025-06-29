<!-- src/routes/settings/password/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';    
    import { auth } from '$lib/firebase';
    import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
  import { dangerToast, successToast, warningToast } from '$lib/customtoast';

    let currentPassword = '';
    let newPassword = '';
    let confirmPassword = '';
    // let errorMessage = '';
    let successMessage = '';
    let isLoading = false;
    let isAuthenticated = false;

    // ตัวแปรสำหรับการแสดง/ซ่อนรหัสผ่าน
    let showCurrentPassword = false;
    let showNewPassword = false;
    let showConfirmPassword = false;

    onMount(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                goto('/login');
            } else {
                isAuthenticated = true;
            }
        });

        return () => unsubscribe();
    });

    const handleChangePassword = async () => {
        // errorMessage = '';
        
        if (newPassword.length < 6) {
            // Firebase's default minimum is 6 characters
            warningToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            return;
        }

        if (newPassword !== confirmPassword) {
            // errorMessage = 'รหัสผ่านใหม่ไม่ตรงกัน';
            warningToast('รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }
        const user = auth.currentUser;
        if (!user) {
            // = 'ไม่พบผู้ใช้งานที่ล็อกอินอยู่';
            dangerToast('ไม่พบผู้ใช้งานที่ล็อกอินอยู่');
            return;
        }

        if (!user.email) {
            dangerToast('ไม่พบอีเมลของผู้ใช้ปัจจุบัน ไม่สามารถดำเนินการต่อได้');
            isLoading = false;
            return;
        }

        isLoading = true;

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            successToast('อัพเดทรหัสผ่านสำเร็จ');

            currentPassword = '';
            newPassword = '';
            confirmPassword = '';
        } catch (error: any) {
			let errorMessage = 'เกิดข้อผิดพลาดที่ไม่รู้จัก กรุณาลองใหม่อีกครั้ง';
			console.error('Password Change Error:', error); // Log the original error for debugging

			switch (error.code) {
				case 'auth/wrong-password':
				case 'auth/invalid-credential': // This can also indicate a wrong password
					errorMessage = 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
					break;
				case 'auth/weak-password':
					errorMessage = 'รหัสผ่านใหม่ไม่รัดกุม ต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
					break;
				case 'auth/too-many-requests':
					errorMessage = 'ตรวจพบกิจกรรมที่น่าสงสัย บัญชีของคุณถูกระงับชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง';
					break;
				case 'auth/network-request-failed':
					errorMessage = 'เกิดปัญหาเกี่ยวกับเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ';
					break;
                case 'auth/requires-recent-login':
                    errorMessage = 'เพื่อความปลอดภัย กรุณาออกจากระบบและเข้าสู่ระบบอีกครั้งก่อนเปลี่ยนรหัสผ่าน';
                    break;
				default: // For other unexpected errors
					errorMessage = 'ไม่สามารถอัปเดตรหัสผ่านได้ กรุณาติดต่อผู้ดูแลระบบ';
			}
			dangerToast(errorMessage);
        } finally {
            isLoading = false;
        }
    };
</script>

<svelte:head>
    <title>เปลี่ยนรหัสผ่าน</title>
    <meta name="description" content="เปลี่ยนรหัสผ่านของคุณ" />
    <link rel="icon" href="/favicon.ico" />
</svelte:head>

{#if isAuthenticated}
    <main class="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 class="text-2xl font-bold mb-6">เปลี่ยนรหัสผ่าน</h1>
        <form on:submit|preventDefault={handleChangePassword} class="space-y-4">
            <div>
                <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                    รหัสผ่านปัจจุบัน
                </label>
                <div class="relative">
                    <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="currentPassword"
                        bind:value={currentPassword}
                        required
                        disabled={isLoading}
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                    />
                    <button 
                        type="button"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                        on:click={() => showCurrentPassword = !showCurrentPassword}
                    >
                        {#if showCurrentPassword}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        {/if}
                    </button>
                </div>
            </div>
            
            <div>
                <label for="newPassword" class="block text-sm font-medium text-gray-700">
                    รหัสผ่านใหม่
                </label>
                <div class="relative">
                    <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        bind:value={newPassword}
                        required
                        disabled={isLoading}
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                    />
                    <button 
                        type="button"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                        on:click={() => showNewPassword = !showNewPassword}
                    >
                        {#if showNewPassword}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        {/if}
                    </button>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                    รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร
                </p>
            </div>

            <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                    ยืนยันรหัสผ่านใหม่
                </label>
                <div class="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        bind:value={confirmPassword}
                        required
                        disabled={isLoading}
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                    />
                    <button 
                        type="button"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                        on:click={() => showConfirmPassword = !showConfirmPassword}
                    >
                        {#if showConfirmPassword}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        {/if}
                    </button>
                </div>
            </div>

            <!-- {#if errorMessage}
                <p class="text-red-500 text-sm">{errorMessage}</p>
            {/if} -->
            {#if successMessage}
                <p class="text-green-500 text-sm">{successMessage}</p>
            {/if}

            <button
                type="submit"
                disabled={isLoading}
                class="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {#if isLoading}
                    <span class="inline-block animate-spin mr-2">↻</span>
                    กำลังอัพเดท...
                {:else}
                    เปลี่ยนรหัสผ่าน
                {/if}
            </button>
        </form>
    </main>
{/if}
