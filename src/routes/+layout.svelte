<script>
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase'; // Firebase Auth
	import { onAuthStateChanged } from 'firebase/auth';
	import { doc, getDoc } from 'firebase/firestore';
	import { checkAuthStatus, logout } from '$lib/auth';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { dangerToast } from '$lib/customtoast';
	import { browser } from '$app/environment'; // Import browser check
	import { requestNotificationPermissionAndSaveToken } from '$lib/fcm'; // Import the FCM function
	import { slide } from 'svelte/transition'; // For smoother menu transitions
	import { quintOut } from 'svelte/easing'; // Easing function for transitions
	
	let isLoggedIn = false;
	let currentUser = null;
	let isMenuOpen = false;
	let isUserMenuOpen = false; // Separate state for user dropdown on desktop
	let userName = '';
	let menuItems = [];
	let role = null;

	// --- Role-Based Menu Items ---
	// (Kept the same logic, but added comments for clarity)
	const getMenuItems = (role) => {
		// Admin: Full access
		if (role === 'admin') {
			return [
				{ id: '/cpe02', label: 'หน้าแรก', icon: 'home' },
				{ id: '/cpe02/data', label: 'ดูข้อมูล', icon: 'database' },
				{ id: '/TS_Dashboard', label: 'แดชบอร์ดอาจารย์', icon: 'clipboard-list' },
				{ id: '/Dashboard', label: 'แดชบอร์ด', icon: 'chart-pie' } // Consider renaming if confusing
			];
			// Teachers (Subject & Regular): Teacher-specific dashboard + data view
		} else if (role === 'subject_teacher' || role === 'teacher') {
			return [
				{ id: '/cpe02', label: 'หน้าแรก', icon: 'home' },
				{ id: '/cpe02/data', label: 'ดูข้อมูล', icon: 'database' },
				{ id: '/TS_Dashboard', label: 'แดชบอร์ด', icon: 'clipboard-list' } // Simplified label
			];
			// Students/Others: Form filling and data view
		} else {
			return [
				{ id: '/cpe02', label: 'หน้าแรก', icon: 'home' },
				{ id: '/cpe02#form-title', label: 'กรอกแบบฟอร์ม', icon: 'pencil-alt' }, // Changed order, more logical flow
				{ id: '/cpe02/data', label: 'ดูข้อมูล', icon: 'database' }
			];
		}
	};

	// --- Toggle Functions ---
	function toggleMobileMenu() {
		isMenuOpen = !isMenuOpen;
		if (isMenuOpen) isUserMenuOpen = false; // Close user menu if mobile opens
	}

	function toggleUserMenu() {
		isUserMenuOpen = !isUserMenuOpen;
		if (isUserMenuOpen) isMenuOpen = false; // Close mobile menu if user opens
	}

	function closeMenus() {
		isMenuOpen = false;
		isUserMenuOpen = false;
	}

	// --- Notification Permission ---
	// (Kept the same logic)
	async function checkAndRequestNotificationPermission() {
		if (typeof window === 'undefined') return; // SSR-safe
		
		if (browser && 'Notification' in window && 'serviceWorker' in navigator) {
			try {
				if (Notification.permission === 'default') {
					const token = await requestNotificationPermissionAndSaveToken();
					// console.log(token ? 'Permission granted and token saved.' : 'Permission denied or error.');
				} else if (Notification.permission === 'granted') {
					await requestNotificationPermissionAndSaveToken(); // Ensure token is up-to-date
				} else {
					// console.log('Notification permission denied.');
					dangerToast('การแจ้งเตือนถูกปิดกั้น โปรดเปิดใช้งานในการตั้งค่าเบราว์เซอร์');
				}
			} catch (error) {
				console.error('Error requesting notification permission:', error);
				dangerToast('ไม่สามารถตั้งค่าการแจ้งเตือนได้: ' + error.message);
			}
		} else if (browser) {
			console.log('Notifications not supported by this browser.');
		}
	}

	// --- Authentication and Data Fetching ---
	onMount(() => {
	menuItems = getMenuItems();

	const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
	return () => unsubscribe();
});

	async function handleAuthStateChange(user) {
		if (user && checkAuthStatus()) {
			await handleLogin(user);
		} else {
			await handleLogout(user);
		}
	}

	async function handleLogin(user) {
		isLoggedIn = true;
		currentUser = user;

		try {
			const docSnap = await getDoc(doc(db, 'users', user.uid));
			if (docSnap.exists()) {
				const data = docSnap.data();
				userName = data.name || user.email;
				role = data.role;
				menuItems = getMenuItems(role);
			} else {
				userName = user.email;
				role = null;
				menuItems = getMenuItems(null);
			}
			await checkAndRequestNotificationPermission();
		} catch (error) {
			console.error('Error during login setup:', error);
			dangerToast('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
			userName = user.email;
			role = null;
			menuItems = getMenuItems(null);
		}
	}

	async function handleLogout(user) {
		if (user && !checkAuthStatus()) {
			console.log('Firebase user detected, but auth check failed. Logging out.');
			await logout();
		}
		isLoggedIn = false;
		currentUser = null;
		userName = '';
		role = null;
		menuItems = getMenuItems(null);
		closeMenus();
	}


	// --- Icons Map (Using Heroicons Outline for consistency) ---
	const icons = {
		home: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>`,
		database: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" /></svg>`, // Replaced with a simpler data icon
		'clipboard-list': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75c0-.231-.035-.454-.1-.664M6.75 7.5H18a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-9a2.25 2.25 0 012.25-2.25z" /></svg>`,
		'chart-pie': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>`,
		'pencil-alt': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>`,
		user: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
		logout: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>`,
		login: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-1"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>`,
		menu: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>`,
		close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
		'chevron-down': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 ml-1 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>`,
		document: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 3h6m-6 3h6m-6 3h6m-6 3h6M4.5 4.5v15a2.25 2.25 0 002.25 2.25h11.25A2.25 2.25 0 0020.25 19.5V4.5A2.25 2.25 0 0018 2.25H6a2.25 2.25 0 00-1.5 .75z" /></svg>`,
	};
</script>

<!-- Global Toast Notification Component -->
<SvelteToast />

<!-- Navbar -->
<nav class="bg-white shadow-sm sticky top-0 z-40">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<!-- Left Side: Logo and Desktop Menu -->
			<div class="flex items-center">
				<a href="/" class="flex-shrink-0 flex items-center mr-4">
					<img src="/LOGO.png" width="32" height="32" alt="LOGO.png" class="h-8 w-auto" />
					<!-- Optional: Add Text Logo for larger screens -->
					<!-- <span class="ml-2 text-xl font-semibold text-gray-800 hidden sm:inline">ProjectApp</span> -->
				</a>
				<div class="hidden md:ml-6 md:flex md:space-x-4">
					{#each menuItems as item}
						<a
							href={item.id}
							class="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-slate-600 hover:text-indigo-600 hover:border-slate-300 transition duration-150 ease-in-out"
						>
							<!-- {@html icons[item.icon] || ''} -->
							<!-- Removed icons from desktop nav for cleaner look -->
							{item.label}
						</a>
					{/each}
				</div>
			</div>

			<!-- Right Side: User Menu/Login and Mobile Menu Button -->
			<div class="flex items-center">
				{#if isLoggedIn}
					<!-- Desktop User Menu -->
					<div class="hidden md:ml-4 md:flex md:items-center">
						<div class="relative">
							<button
								on:click={toggleUserMenu}
								type="button"
								class="flex items-center text-sm rounded-full text-slate-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								id="user-menu-button"
								aria-expanded={isUserMenuOpen}
								aria-haspopup="true"
							>
								<span class="sr-only">Open user menu</span>
								<!-- Optional: User Avatar -->
								<!-- <img class="h-8 w-8 rounded-full mr-2" src={currentUser?.photoURL || '/default-avatar.png'} alt="User avatar"> -->
								<span class="mr-1">{userName || 'User'}</span>
								{@html icons['chevron-down']}
							</button>

							{#if isUserMenuOpen}
								<div
									transition:slide={{ duration: 200, easing: quintOut }}
									class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
									role="menu"
									aria-orientation="vertical"
									aria-labelledby="user-menu-button"
									tabindex="-1"
								>
									<!-- User Menu Items -->
									 <!--show email-->
									<div class="px-4 py-2 text-sm text-slate-500 border-b border-slate-200">{currentUser?.email}</div>
									 <!--show role-->	
									{#if role == "user"}
										<div class="px-4 pt-2 pb-1 text-xs text-slate-400 uppercase">นักศึกษา</div>
										{:else if role == "admin"}
										<div class="px-4 pt-2 pb-1 text-xs text-slate-400 uppercase">แอดมิน</div>
										{:else if role == "teacher"}
										<div class="px-4 pt-2 pb-1 text-xs text-slate-400 uppercase">อาจารย์ทั่วไป</div>	
										{:else if role == "subject_teacher"}
										<div class="px-4 pt-2 pb-1 text-xs text-slate-400 uppercase">อาจารย์ประจำวิชา</div>
									{/if}
										
									<a
										href="/account"
										on:click={closeMenus}
										class="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
										role="menuitem"
										tabindex="-1"
									>
										{@html icons['user']}
										ข้อมูลส่วนตัว
									</a>
									{#if role == "user" || role == "admin"}
											<a
											href="/my-projects"
											on:click={closeMenus}
											class="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
											role="menuitem"
											tabindex="-1"
										>
											{@html icons['document']}
											โครงงานของฉัน
										</a>
									{/if}

									{#if role == "teacher" || role == "subject_teacher" || role == "admin"}
											<a
											href="/my-projects-consultant"
											on:click={closeMenus}
											class="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
											role="menuitem"
											tabindex="-1"
										>
											{@html icons['document']}
											โครงงานที่เป็นที่ปรึกษา
										</a>
									{/if}


									
									<button
										on:click={() => {
											logout();
											closeMenus();
										}}
										class="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
										role="menuitem"
										tabindex="-1"
									>
										{@html icons['logout']}
										ออกจากระบบ
									</button>
								</div>
							{/if}
						</div>
					</div>

					<!-- Mobile Menu Button (Logged In) -->
					<div class="ml-4 flex items-center md:hidden">
						<button
							on:click={toggleMobileMenu}
							type="button"
							class="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
							aria-controls="mobile-menu"
							aria-expanded={isMenuOpen}
						>
							<span class="sr-only">Open main menu</span>
							{@html isMenuOpen ? icons['close'] : icons['menu']}
						</button>
					</div>
				{:else}
					<!-- Login Button (Desktop) -->
					<div class="hidden md:flex items-center">
						<a
							href="/login"
							class="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
						>
							{@html icons['login']}
							เข้าสู่ระบบ
						</a>
						<!-- Optional Signup Button -->
						<!-- <a href="/signup" class="ml-2 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
              สมัครสมาชิก
            </a> -->
					</div>
					<!-- Login Button (Mobile) -->
					<div class="flex items-center md:hidden">
						<a
							href="/login"
							class="ml-4 inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
						>
							{@html icons['login']}
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if isMenuOpen && browser}
		<div class="md:hidden fixed inset-0 z-30" id="mobile-menu">
			<!-- Overlay -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="fixed inset-0 bg-slate-600 bg-opacity-75" on:click={toggleMobileMenu} aria-hidden="true"></div>

			<!-- Mobile Menu Panel -->
			<div
				transition:slide={{ duration: 300, easing: quintOut, axis: 'x' }}
				class="fixed top-0 left-0 w-64 h-full bg-white shadow-xl z-40 p-4"
			>
				<!-- Close Button Inside Panel -->
				<div class="flex justify-end mb-4">
					<button
						on:click={toggleMobileMenu}
						type="button"
						class="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
					>
						<span class="sr-only">Close menu</span>
						{@html icons['close']}
					</button>
				</div>

				<!-- Menu Content -->
				<div class="mt-2 space-y-1">
					{#if isLoggedIn}
						<!-- User Info -->
						<div class="px-2 py-3 border-b border-slate-200 mb-3">
							<span class="block text-base font-medium text-slate-800 truncate">{userName || 'User'}</span>
							{#if role}
								<span class="block text-sm font-medium text-slate-500 capitalize">{role.replace('_', ' ')}</span>
							{/if}
						</div>
						<!-- Logged In Links -->
						{#each menuItems as item}
							<a
								href={item.id}
								on:click={closeMenus}
								class="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
							>
								{@html icons[item.icon] || ''}
								{item.label}
							</a>
						{/each}
						<a
							href="/account"
							on:click={closeMenus}
							class="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
						>
							{@html icons['user']}
							ข้อมูลส่วนตัว
						</a>
						<hr class="border-gray-200 my-3" />
						<button
							on:click={() => {
								logout();
								closeMenus();
							}}
							class="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
						>
							{@html icons['logout']}
							ออกจากระบบ
						</button>
					{:else}
						<!-- Logged Out Links -->
						<a
							href="/"
							on:click={closeMenus}
							class="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
						>
							{@html icons['home']}
							หน้าแรก
						</a>
						<a
							href="/login"
							on:click={closeMenus}
							class="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
						>
							{@html icons['login']}
							เข้าสู่ระบบ
						</a>
						<!-- <a href="/signup" on:click={closeMenus} class="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100">
              {@html icons['user-plus'] || ''} สมัครสมาชิก
            </a> -->
					{/if}
				</div>
			</div>
		</div>
	{/if}
</nav>

<main >
	<slot />
</main>
