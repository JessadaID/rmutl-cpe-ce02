<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	// --- Import your toast functions ---
	// Assuming you have these defined similarly to your signup/login pages
	import { successToast, dangerToast } from '$lib/customtoast'; // Adjust path if necessary

	// --- Interface for clarity ---
	interface Teacher {
		name: string;
		email: string;
		Approval: boolean;
		id: string; // Assuming Firestore document ID is used
		isProcessing?: boolean; // Optional: for loading state per row
	}

	let teachers: Teacher[] = [];
	let isLoading = true;
	let error: string | null = null;

	onMount(async () => {
		await fetchPendingTeachers();
	});

	async function fetchPendingTeachers() {
		isLoading = true;
		error = null;
		try {
			const response = await fetch('/api/teacher-data?approval=false'); // Fetch only pending

			if (!response.ok) {
				throw new Error(`ไม่สามารถดึงข้อมูลได้: ${response.statusText} (${response.status})`);
			}

			const data = await response.json();
			if (data && Array.isArray(data.data)) {
				// Initialize teachers, adding the isProcessing flag
				teachers = data.data.map((t: Omit<Teacher, 'isProcessing'>) => ({
					...t,
					isProcessing: false
				}));
			} else {
				console.error('โครงสร้างข้อมูลไม่ถูกต้อง:', data);
				teachers = [];
				error = 'ได้รับข้อมูลในรูปแบบที่ไม่คาดคิด';
			}
		} catch (err: any) {
			console.error('เกิดข้อผิดพลาดในการดึงข้อมูลอาจารย์:', err);
			error = `เกิดข้อผิดพลาด: ${err.message}`;
			teachers = [];
		} finally {
			isLoading = false;
		}
	}

	// --- Function to set processing state ---
	function setProcessing(teacherId: string, state: boolean) {
		teachers = teachers.map((t) => (t.id === teacherId ? { ...t, isProcessing: state } : t));
	}

	// --- Function for Approval ---
	async function approveTeacher(teacherId: string) {
		setProcessing(teacherId, true);
		try {
			// --- TODO: Replace with your actual API endpoint ---
			const response = await fetch('/api/update-teacher-status', {
				method: 'POST', // or PUT/PATCH
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					teacherId: teacherId,
					action: 'approve', // Send action type
					newRole: 'teacher' // Or 'subject_teacher' depending on your logic
					// You might send Approval: true instead of action
				})
			});
			// --- ---

			if (!response.ok) {
				const errorData = await response.text(); // Get more error details
				throw new Error(`API Error (${response.status}): ${errorData || response.statusText}`);
			}

			// Success! Remove teacher from the local list
			teachers = teachers.filter((t) => t.id !== teacherId);
			successToast('อนุมัติอาจารย์สำเร็จ');

		} catch (err: any) {
			console.error(`เกิดข้อผิดพลาดในการอนุมัติอาจารย์ ID ${teacherId}:`, err);
			dangerToast(`เกิดข้อผิดพลาดในการอนุมัติ: ${err.message}`);
			setProcessing(teacherId, false); // Reset processing state on error
		}
		// No finally block needed here for processing state if successful removal happens
	}

	// --- Function for Rejection ---
	async function rejectTeacher(teacherId: string) {
		setProcessing(teacherId, true);
		try {
			// --- TODO: Replace with your actual API endpoint ---
			const response = await fetch('/api/update-teacher-status', {
				method: 'POST', // or PUT/PATCH
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					teacherId: teacherId,
					action: 'reject', // Send action type
					newRole: 'user' // Set role back to user
					// You might send Approval: false and role: 'user'
				})
			});
			// --- ---

			if (!response.ok) {
				const errorData = await response.text(); // Get more error details
				throw new Error(`API Error (${response.status}): ${errorData || response.statusText}`);
			}

			// Success! Remove teacher from the local list
			teachers = teachers.filter((t) => t.id !== teacherId);
			successToast('ปฏิเสธการอนุมัติอาจารย์สำเร็จ');

		} catch (err: any) {
			console.error(`เกิดข้อผิดพลาดในการปฏิเสธอ. ID ${teacherId}:`, err);
			dangerToast(`เกิดข้อผิดพลาดในการปฏิเสธ: ${err.message}`);
			setProcessing(teacherId, false); // Reset processing state on error
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
		รายชื่ออาจารย์ที่รอการอนุมัติ
	</h1>

	<!-- Loading Indicator -->
	{#if isLoading}
		<div class="text-center text-gray-600 mt-10" transition:fade>
			<!-- SVG Spinner -->
			<svg class="animate-spin h-6 w-6 mr-3 inline-block text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
			กำลังโหลดข้อมูล...
		</div>
	{/if}

	<!-- Error Message -->
	{#if error && !isLoading}
		<div class="text-center text-red-600 bg-red-100 border border-red-400 rounded-md p-4 mt-6 max-w-md mx-auto" transition:fade>
			<p><strong>เกิดข้อผิดพลาด:</strong> {error}</p>
			<p class="mt-2 text-sm">กรุณาลองรีเฟรชหน้าหรือติดต่อผู้ดูแลระบบ</p>
		</div>
	{/if}

	<!-- Data Table -->
	{#if !isLoading && !error}
		<div class="shadow-lg overflow-hidden border-b border-gray-200 rounded-lg" transition:fade>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-100">
						<tr>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ชื่อ-สกุล</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">อีเมล</th>
							<th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">สถานะ</th>
							<!-- *** UNCOMMENTED and Renamed Header *** -->
							<th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">การดำเนินการ</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#if teachers.length > 0}
							{#each teachers as teacher (teacher.id)}
								<tr class="hover:bg-gray-50 transition duration-150 ease-in-out">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">{teacher.name || '-'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-700">{teacher.email || '-'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-center">
										{#if teacher.Approval}
											<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">อนุมัติแล้ว</span>
										{:else}
											<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">รอการอนุมัติ</span>
										{/if}
									</td>
									<!-- *** ADDED Action Buttons Cell *** -->
									<td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
										{#if !teacher.Approval && teacher.id}
											<button
												on:click={() => approveTeacher(teacher.id)}
												disabled={teacher.isProcessing}
												class="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{#if teacher.isProcessing} <span class="spinner-tiny"></span> {:else} อนุมัติ {/if}
											</button>
											<button
												on:click={() => rejectTeacher(teacher.id)}
												disabled={teacher.isProcessing}
												class="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{#if teacher.isProcessing} <span class="spinner-tiny"></span> {:else} ไม่อนุมัติ {/if}
											</button>
										{:else if !teacher.id}
											<span class="text-gray-400 italic text-xs">ไม่มี ID</span>
										{/if}
										<!-- If already approved, maybe show nothing or a different status -->
									</td>
								</tr>
							{/each}
						{:else}
							<!-- No pending teachers -->
							<tr>
								<td colspan="4" class="px-6 py-10 text-center text-gray-500"> <!-- Adjusted colspan -->
									ไม่พบข้อมูลอาจารย์ที่รอการอนุมัติ
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Styles from previous example */
	@media (max-width: 640px) {
		th, td { padding-left: 0.75rem; padding-right: 0.75rem; }
		.text-xs { font-size: 0.7rem; }
	}

	/* Simple spinner for buttons */
	.spinner-tiny {
		display: inline-block;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: #fff;
		width: 0.75rem; /* 12px */
		height: 0.75rem; /* 12px */
		animation: spin 1s ease-in-out infinite;
		margin-right: 0.25rem; /* Add some space if needed */
        vertical-align: middle;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
