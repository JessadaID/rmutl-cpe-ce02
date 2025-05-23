<script>
	import { auth, db } from '$lib/firebase';
	import { createUserWithEmailAndPassword } from 'firebase/auth';
	import { doc, setDoc } from 'firebase/firestore';
	import { goto } from '$app/navigation';
	import { setLoginCookies, clearLoginCookies } from '$lib/auth';
	import { dangerToast, successToast, warningToast } from '$lib/customtoast';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let role = 'user'; // Role เริ่มต้น (สามารถปรับเปลี่ยนได้)
	let isLoading = false;

	// --- เพิ่มตัวแปรสำหรับสลับการแสดงรหัสผ่าน ---
	let showPassword = false;
	let showConfirmPassword = false;
	// --- ---

	async function signup() {
		try {
			isLoading = true;

			// ตรวจสอบว่ารหัสผ่านและยืนยันรหัสผ่านตรงกันหรือไม่
			if (email == '' || name == '' || password == '' || confirmPassword == '') {
				warningToast('กรอกข้อมูลให้ครบถ้วน');
				isLoading = false; // อย่าลืมตั้งค่า isLoading กลับถ้า return ก่อน
				return;
			}

			if (password !== confirmPassword) {
				warningToast('รหัสผ่านไม่ตรงกัน');
				isLoading = false; // อย่าลืมตั้งค่า isLoading กลับถ้า return ก่อน
				return;
			}

			// สร้างผู้ใช้ใน Firebase Authentication
			// ไม่ควร set cookie ก่อนสมัครสำเร็จ เผื่อกรณี error
			// setLoginCookies(email, "user",name); // <-- ย้ายไปทำหลังสมัครสำเร็จ

			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			// บันทึกข้อมูลผู้ใช้ลงใน Firestore
			const userDocRef = doc(db, 'users', user.uid);
			await setDoc(userDocRef, {
				email: user.email,
				role: role, // บันทึก Role ของผู้ใช้
				name: name
			});

			// เก็บข้อมูลใน Cookies (ทำหลังจากทุกอย่างสำเร็จ)
			setLoginCookies(email, role, name);

			// แจ้งเตือนผู้ใช้
			successToast(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ ${name || user.email}`);

			// รีเซ็ตฟอร์ม
			name = '';
			email = '';
			password = '';
			confirmPassword = '';
			showPassword = false; // รีเซ็ตสถานะไอคอนด้วย
			showConfirmPassword = false;

			// นำทางไปยังหน้า /cpe02
			goto('/cpe02');
		} catch (error) {
			clearLoginCookies(); // ล้าง cookie ถ้าเกิดข้อผิดพลาด
			// แสดงข้อความ error ที่เข้าใจง่ายขึ้น
			let errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
			if (error.code === 'auth/email-already-in-use') {
				errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
			} else if (error.code === 'auth/weak-password') {
				errorMessage = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
			} else {
				errorMessage += ': ' + error.message;
			}
			dangerToast(errorMessage);
			console.error('Signup Error:', error); // Log error จริงๆ ไว้ด้วย
		} finally {
			isLoading = false; // เสร็จสิ้นการโหลด
		}
	}
</script>


<svelte:head>
	<title>สมัครสมาชิก</title>
	<meta name="description" content="สมัครสมาชิกเพื่อเข้าถึงฟีเจอร์ทั้งหมด" />
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="flex justify-center items-center min-h-screen">
	<div
		class="flex w-full max-w-4xl shadow-lg rounded-lg overflow-hidden relative"
		style="box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);"
	>
		<div class="w-full md:w-1/2 flex items-center justify-center p-6 bg-white/90 backdrop-blur-md">
			<div class="w-full max-w-md">
				<h1 class="text-2xl font-bold text-center mb-6 text-gray-800">สมัครสมาชิก</h1>

				<form on:submit|preventDefault={signup} class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700"> ชื่อ </label>
						<div class="mt-1">
							<input
								id="name"
								type="text"
								bind:value={name}
								placeholder="นายเอ บี"
								required
								class="px-3 w-full py-2 border rounded-md focus:outline-none shadow-sm focus:ring focus:ring-blue-300"
							/>
						</div>
					</div>

					<div>
						<label for="email" class="block text-sm font-medium text-gray-700"> อีเมล </label>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
							placeholder="กรอกอีเมลของคุณ"
						/>
					</div>

					<!-- Password Input with Toggle -->
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700"> รหัสผ่าน </label>
						<div class="mt-1 relative rounded-md shadow-sm">
							<input
								id="password"
								bind:value={password}
								type={showPassword ? 'text' : 'password'}
								required
								class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10" 
								placeholder="กรอกรหัสผ่านของคุณ"
							/>
							<button
								type="button"
								on:click={() => (showPassword = !showPassword)}
								class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{#if showPassword}
									<!-- Eye Slash Icon -->
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L6.228 6.228" />
									</svg>
								{:else}
									<!-- Eye Icon -->
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<!-- Confirm Password Input with Toggle -->
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
							กรอกรหัสผ่านอีกครั้ง
						</label>
						<div class="mt-1 relative rounded-md shadow-sm">
							<input
								id="confirmPassword"
								bind:value={confirmPassword}
								type={showConfirmPassword ? 'text' : 'password'}
								required
								class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
								placeholder="กรอกรหัสผ่านของคุณอีกครั้ง"
							/>
							<button
								type="button"
								on:click={() => (showConfirmPassword = !showConfirmPassword)}
								class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
								aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
							>
								{#if showConfirmPassword}
									<!-- Eye Slash Icon -->
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L6.228 6.228" />
									</svg>
								{:else}
									<!-- Eye Icon -->
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<button
						type="submit"
						class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isLoading}
					>
						{#if isLoading}
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							กำลังดำเนินการ...
						{:else}
							สมัครสมาชิก
						{/if}
					</button>
				</form>
			</div>
		</div>
		<div class="hidden md:block w-1/2 relative">
			<img src="/Sign_up.jpg" alt="Signup Background" class="w-full h-full object-cover" />
			<div class="absolute bottom-0 right-0 bg-white/80 p-4 rounded-tl-lg"> 
				<p class="text-sm text-gray-500">
					ถ้ามีบัญชีอยู่แล้ว ?
					<a href="/login" class="text-blue-500 hover:underline font-bold">เข้าสู่ระบบ</a>
				</p>
			</div>
		</div>
	</div>
</div>

<!-- SVG Background Shapes (ไม่เปลี่ยนแปลง) -->
<div class="custom-shape-divider-bottom-1737443007 hidden md:block">
	<svg
		data-name="Layer 1"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 1200 120"
		preserveAspectRatio="none"
	>
		<path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" class="shape-fill"></path>
	</svg>
</div>

<div class="custom-shape-divider-bottom-1737650222">
	<svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
		<path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" class="shape-fill"></path>
	</svg>
</div>

<style>
	/* Styles (ไม่เปลี่ยนแปลง) */
	.custom-shape-divider-bottom-1737443007 {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		overflow: hidden;
		line-height: 0;
		transform: rotate(180deg);
		z-index: -1;
	}

	.custom-shape-divider-bottom-1737443007 svg {
		position: relative;
		display: block;
		width: calc(300% + 1.3px);
		height: 369px;
		transform: rotateY(180deg);
	}

	.custom-shape-divider-bottom-1737443007 .shape-fill {
		fill: #5052ff;
	}
	.custom-shape-divider-bottom-1737650222 {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		overflow: hidden;
		line-height: 0;
		transform: rotate(180deg);
		z-index: -1;
	}

	.custom-shape-divider-bottom-1737650222 svg {
		position: relative;
		display: block;
		width: calc(100% + 1.3px);
		height: 150px;
	}

	.custom-shape-divider-bottom-1737650222 .shape-fill {
		fill: #6769e2;
	}
</style>
