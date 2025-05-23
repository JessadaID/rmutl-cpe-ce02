<script>
	import { auth } from '$lib/firebase';
	import { sendPasswordResetEmail } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { warningToast, successToast, dangerToast } from '$lib/customtoast'; // สมมติว่ามี custom toast

	let email = '';
	// let message = ''; // ใช้ toast แทน message ปกติ
	let loading = false;


	const handleSubmit = async () => {
		if (!email) {
			warningToast('กรุณากรอกอีเมล');
			return;
		}
		loading = true;
		// message = ''; // ลบออก
		try {
			await sendPasswordResetEmail(auth, email);
			successToast('ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว โปรดตรวจสอบกล่องจดหมายของคุณ');
			email = ''; // เคลียร์ input หลังส่งสำเร็จ
			// อาจจะ redirect ไปหน้า login หรือแสดงข้อความยืนยัน
			// goto('/login');
		} catch (error) {
			console.error('Password Reset Error:', error);
			let errorMessage = 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ต';
			if (error.code === 'auth/user-not-found') {
				errorMessage = 'ไม่พบผู้ใช้งานด้วยอีเมลนี้';
			} else if (error.code === 'auth/invalid-email') {
				errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
			} else {
				errorMessage = error.message; // แสดง error message อื่นๆ ถ้ามี
			}
			dangerToast(errorMessage);
			// message = errorMessage; // ลบออก
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>ลืมรหัสผ่าน</title>
	<meta name="description" content="รีเซ็ตรหัสผ่านของคุณ" />
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<!-- ใช้ flexbox จัดกึ่งกลางแนวตั้งและแนวนอนเต็มหน้าจอ -->
<div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4">
	<!-- การ์ดฟอร์ม -->
	<div class="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
		<h2 class="text-3xl font-bold text-center text-gray-800">ลืมรหัสผ่าน?</h2>
		<p class="text-center text-gray-600">
			กรอกอีเมลของคุณด้านล่าง เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้
		</p>

		<!-- {#if message}
      <div class="p-3 text-center rounded-md"
           class:bg-green-100={message.includes('sent')}
           class:text-green-700={message.includes('sent')}
           class:bg-red-100={!message.includes('sent')}
           class:text-red-700={!message.includes('sent')}
      >
        {message}
      </div>
    {/if} -->
		<!-- ใช้ Toast แทน message -->

		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1"> อีเมล </label>
				<input
					type="email"
					id="email"
					bind:value={email}
					placeholder="you@example.com"
					class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
					disabled={loading}
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<svg
						class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					กำลังส่ง...
				{:else}
					ส่งอีเมลรีเซ็ตรหัสผ่าน
				{/if}
			</button>
		</form>

		<p class="text-center text-sm text-gray-600">
			จำรหัสผ่านได้แล้ว?
			<a href="/login" class="font-medium text-blue-600 hover:text-blue-500 hover:underline">
				กลับไปหน้าเข้าสู่ระบบ
			</a>
		</p>
	</div>
</div>