<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { checkAuthStatus } from '$lib/auth';
	import { warningToast } from '$lib/customtoast';
	import { getCookie } from 'cookies-next'; // Assuming this works correctly in SvelteKit context
	import { verifyJWT , createJWT } from '$lib/jwt'; // Import verifyJWT

	let termId = null; // Initialize termId to null
	let allProjects = null; // Store the original fetched data
	let filteredProjects = []; // Store the data to be displayed (after filtering)
	let searchTerm = ''; // Holds the value from the search input
	let error = null; // To store any fetch errors
	let userEmail = null; // Store user's email from cookie <-- Renamed for clarity
	let filterByMyProjects = false; // State for the new checkbox <-- Changed variable name
    let role = null; // Store user's role from cookie
	let isLoading = false; // Loading state
  
	onMount(async () => {
		// 1. Extract and verify the token from the URL
		const token = $page.url.searchParams.get('token');
		if (!token) {
			console.error('No token found in URL');
			error = 'ไม่พบข้อมูลภาคการศึกษา';
			goto('/cpe02'); // Redirect to the main page
			return; // Stop further execution
		}

		try {
			const payload = await verifyJWT(token);
			termId = payload.term; // Extract term from payload
			//console.log('Decoded payload:', payload);
		} catch (err) {
			console.error('Invalid or expired token:', err);
			error = 'ข้อมูลภาคการศึกษาไม่ถูกต้อง หรือหมดอายุ';
			goto('/cpe02'); // Redirect to the main page
			return; // Stop further execution
		}

		try {
			// 2. Get user info from cookies (after successful token verification)
			userEmail = getCookie('email'); // Get user email
			role = getCookie('role'); // Get user role
		} catch (err) {
			console.warn("Could not read 'email' or 'role' cookie on mount:", err);
		}

		isLoading = true;
		error = null; // Reset error on mount


		try {
			const res = await fetch(`/api/project-data?term=${termId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'max-age=15'
				},
			});

			if (res.ok) {
				const responseData = await res.json();
				allProjects = responseData.data || [];
				// Ensure adviser data is consistently an array of objects or strings
				// Assume advisor object might have { name: '...', email: '...' }
				allProjects = allProjects.map((proj) => ({
					...proj,
					adviser: Array.isArray(proj.adviser) ? proj.adviser : []
				}));
				// Initially, display all fetched projects (will be filtered by reactive block)
				filteredProjects = allProjects; // Let the reactive block handle initial filtering
			} else {
				console.error('Failed to fetch data:', res.status, await res.text());
				error = `ไม่สามารถโหลดข้อมูลได้ (สถานะ: ${res.status})`;
				allProjects = [];
				filteredProjects = [];
			}
		} catch (err) {
			console.error('Error fetching data:', err);
			error = 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message;
			allProjects = [];
			filteredProjects = [];
		} finally {
			isLoading = false;
		}
	});

	// Reactive statement: Runs when searchTerm, allProjects, or filterByMyProjects changes
	$: if (allProjects) {
		let baseList = allProjects; // Start with all projects

		// 1. Filter by advisor email if checkbox is checked AND userEmail is available
		if (filterByMyProjects && userEmail) {
			const lowerUserEmail = userEmail.toLowerCase();
			baseList = allProjects.filter((project) =>
				project.adviser?.some((adv) => {
					// Check if advisor is an object with an email property
					if (typeof adv === 'object' && adv?.email) {
						return adv.email.toLowerCase() === lowerUserEmail;
					}
					// Optional: If advisor could be just an email string (less likely based on structure)
					// else if (typeof adv === 'string') {
					//   return adv.toLowerCase() === lowerUserEmail;
					// }
					return false; // No match if not object with email or string email
				})
			);
		}
		// Now baseList contains either all projects or only the user's advised projects

		// 2. Apply search term filter on the baseList
		const lowerSearchTerm = searchTerm.toLowerCase().trim();
		if (!lowerSearchTerm) {
			// No search term, display the current baseList
			filteredProjects = baseList;
		} else {
			// Filter the baseList using the search term across multiple fields
			filteredProjects = baseList.filter((project) => {
				const nameThMatch = project.project_name_th?.toLowerCase().includes(lowerSearchTerm);
				const nameEnMatch = project.project_name_en?.toLowerCase().includes(lowerSearchTerm);
				const memberMatch = project.members?.some(
					(member) => member?.toLowerCase().includes(lowerSearchTerm)
				);
				// Also search advisor NAME within the filtered list
				const adviserNameMatch = project.adviser?.some((adv) => {
					if (typeof adv === 'object' && adv?.name) {
						return adv.name.toLowerCase().includes(lowerSearchTerm);
					} else if (typeof adv === 'string') {
						return adv.toLowerCase().includes(lowerSearchTerm);
					}
					return false;
				});

				return nameThMatch || nameEnMatch || memberMatch || adviserNameMatch;
			});
		}
	} else {
		// Handle case where allProjects is null/undefined initially
		filteredProjects = [];
	}

	async function viewProjectDetails(projectId) {
		if (checkAuthStatus()) {
			if (projectId) {
				const payload = { projectId };
				const token = await createJWT(payload);
				goto(`/cpe02/data/term/project-detail?token=${token}`);
			} else {
				console.error('Cannot navigate: Project ID is missing');
				
			}
		} else {
			console.log('User is not authenticated, redirecting to login.');
			warningToast('กรุณาเข้าสู่ระบบก่อนดูรายละเอียดโครงงาน');
			
		}
	}

	/**
	 * Gets the status from the latest task in the project.Tasks object.
	 * @param {object} tasks - The project.Tasks object (e.g., { "0": { status: "...", ... }, "1": { status: "...", ... } }).
	 * @returns {string} The status string (e.g., "approve", "wait") or "ไม่ระบุ".
	 */
	function getLatestTaskStatus(tasks) {
		if (!tasks || typeof tasks !== 'object' || Object.keys(tasks).length === 0) {
			return 'wait'; // Default status if no tasks or tasks is not an object
		}
		const taskIndices = Object.keys(tasks)
			.map(Number) // Convert keys to numbers
			.filter(key => !isNaN(key)) // Ensure they are valid numbers
			.sort((a, b) => a - b); // Sort numerically

		if (taskIndices.length === 0) {
			return 'wait'; // No valid numeric keys
		}

		const latestTaskIndex = taskIndices[taskIndices.length - 1];
		return tasks[latestTaskIndex]?.status || 'wait';
	}
</script>

<svelte:head>
	<title>รายการโครงงานภาคการศึกษา {termId}</title>
	<meta name="description" content="รายการโครงงานภาคการศึกษา {termId}" />
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6">
		โครงงานสำหรับภาคเรียน: <span class="text-indigo-600">{termId || 'ไม่ระบุ'}</span>
	</h1>

	<!-- Search Input and Checkbox Container -->
	<div class="mb-6 max-w-lg mx-auto space-y-3">
		<!-- Search Input -->
		<input
			type="text"
			bind:value={searchTerm}
			placeholder="ค้นหาตามชื่อโครงงาน, สมาชิก, หรืออาจารย์ที่ปรึกษา..."
			class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
			aria-label="Search projects"
		/>
		<!-- Checkbox for filtering by advisor email -->
		{#if userEmail && (role == "teacher" || role == "subject_teacher")}<!-- Only show checkbox if user email is available -->
			<div class="flex items-center">
				<input
					type="checkbox"
					id="filter-my-projects"
					class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
					bind:checked={filterByMyProjects}
				/>
				<label for="filter-my-projects" class="text-sm text-gray-700 select-none"
					>แสดงเฉพาะโครงงานที่ฉันเป็นที่ปรึกษา ({userEmail})</label
				>
			</div>
		{/if}
	</div>

	<!-- Loading State -->
	{#if isLoading}
		<p class="text-center text-gray-600 mt-10 text-lg">
			<svg class="animate-spin h-5 w-5 mr-3 inline-block text-indigo-600" viewBox="0 0 24 24">
				<!-- SVG Path -->
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
			กำลังโหลดข้อมูลโครงงาน...
		</p>
	{/if}

	<!-- Error State -->
	{#if error && !isLoading}
		<p
			class="text-center text-red-600 bg-red-100 border border-red-400 rounded-md p-4 mt-10 max-w-md mx-auto"
		>
			{error}
		</p>
	{/if}

	<!-- Data Display Area -->
	{#if !isLoading && !error}
		<div class="shadow-lg border-b border-gray-200 rounded-lg">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<!-- Table Headers (เหมือนเดิม) -->
						<tr>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								ชื่อโครงงาน (ไทย)
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								ชื่อโครงงาน (Eng)
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								สมาชิก
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								อาจารย์ที่ปรึกษา
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								สถานะ
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								การดำเนินการ
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200 z-50">
						{#if filteredProjects.length > 0}
							{#each filteredProjects as project (project.id)}
								<tr class="hover:bg-gray-50 transition duration-150 ease-in-out">
									<!-- Table Data Cells (เหมือนเดิม, รวมถึง tooltip) -->
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">
											{project.project_name_th || '-'}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-700">{project.project_name_en || '-'}</div>
									</td>
									<td class="px-6 py-4 whitespace-normal">
										{#if project.members && project.members.length > 0}
											<div class="text-sm text-gray-700 flex items-center space-x-1">
												<span>{project.members[0] || 'N/A'}</span>
												{#if project.members.length > 1}
													<div class="relative group">
														<span
															class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium ring-1 ring-green-600/20 ring-inset cursor-help select-none"
														>
															+ {project.members.length - 1}
														</span>
														<!-- Tooltip with z-50 -->
														<div
															class="absolute bottom-full left-1/2 z-50 -translate-x-1/2 mb-2 w-max max-w-xs p-2
                                        bg-gray-700 text-white text-xs rounded shadow-lg
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                                        whitespace-nowrap "
														>
															<ul class="list-none p-0 m-0 text-left">
																{#each project.members as member, i}
																	<li>{i + 1}. {member || 'N/A'}</li>
																{/each}
															</ul>
															<div
																class="absolute left-1/2 -translate-x-1/2 top-full mt-[-1px] w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-700"
															></div>
														</div>
													</div>
												{/if}
											</div>
										{:else}
											<span class="text-sm text-gray-500">ไม่มี</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-normal">
										{#if project.adviser && project.adviser.length > 0}
											<ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
												{#each project.adviser as adv}
													{#if adv.name != null}
														<li>
															{adv.name}
															<!--{#if adv.email}<span class="text-gray-500 text-xs ml-1">({adv.email})</span>{/if}-->
														</li>
													{:else}
														<li>{adv}</li>
													{/if}
												{/each}
											</ul>
										{:else}
											<span class="text-sm text-gray-500">ไม่มี</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<!-- New Status Display Logic -->
										{#if getLatestTaskStatus(project.Tasks) === 'approve'}
											<span
												class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
											>
												อนุมัติแล้ว
											</span>
										{:else if getLatestTaskStatus(project.Tasks) === 'wait'}
											<span
												class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
											>
												รอการอนุมัติ
											</span>
										{:else if getLatestTaskStatus(project.Tasks) === 'improvement'}
											<span
												class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800"
											>
												ต้องแก้ไข
											</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<!-- Action Button (เหมือนเดิม) -->
										{#if project.id}
											<button
												on:click={() => viewProjectDetails(project.id)}
												class="px-3 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
											>
												ดูรายละเอียด
											</button>
										{:else}
											<span class="text-gray-400 italic text-xs">ไม่มี ID</span>
										{/if}
									</td>
								</tr>
							{/each}
						{:else}
							<!-- No Results Row -->
							<tr>
								<td colspan="6" class="px-6 py-10 text-center text-gray-500">
									{#if filterByMyProjects && userEmail}
										{#if searchTerm}
											ไม่พบโครงงานที่คุณเป็นที่ปรึกษา ({userEmail}) ที่ตรงกับคำค้นหา "{searchTerm}"
										{:else}
											ไม่พบโครงงานที่คุณเป็นที่ปรึกษา ({userEmail}) ในภาคเรียนนี้
										{/if}
									{:else if searchTerm}
										ไม่พบโครงงานที่ตรงกับคำค้นหา "{searchTerm}"
									{:else}
										ไม่พบข้อมูลโครงงานสำหรับภาคเรียนนี้
									{/if}
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
		</div>
	{/if}
</div>
