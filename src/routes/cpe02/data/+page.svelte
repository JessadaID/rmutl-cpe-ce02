<script>
	export let data;
	// --- ปรับปรุงชื่อตัวแปรให้อ่านง่ายขึ้น ---
	let error = null;
	import { createJWT } from '$lib/jwt';
	import { goto } from '$app/navigation';
	
	async function navigateWithToken(term) {
			try {
				const payload = { term };
				const token = await createJWT(payload);
				//console.log('Token:', token);
				goto(`/cpe02/data/term?token=${token}`);
			} catch (err) {
				console.error('Error creating JWT:', err);
				// Handle error appropriately, e.g., display an error message to the user
			}
	}
</script>

<svelte:head>
	<title>รายการฟอร์ม CE02</title>
	<meta name="description" content="แบบเสนอโครงงาน CE02 - จัดการแบบฟอร์มเสนอหัวข้อโครงงานคอมพิวเตอร์ของคุณ" />
	<link rel="icon" href="/favicon.ico" />
</svelte:head>
<!-- ใช้ font-sans หรือ font ที่คุณกำหนดใน tailwind.config.js -->
<div
	class="max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8 font-sans text-gray-800"
>
	<h1
		class="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500"
	>
		รายการฟอร์ม CE02
	</h1>

	{#if error}
		<p
			class="my-8 py-4 px-6 rounded-lg text-lg flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 font-medium"
		>
			<span class="text-xl">⚠️</span>
			<!-- Emoji warning -->
			{error}
		</p>
	{:else if data.terms.length > 0}
		<p class="text-sm text-gray-600 mb-6">พบทั้งหมด {data.terms.length} รายการ</p>

		<!-- Container สำหรับจัดเรียงการ์ด -->
		<div class="w-full">
			{#each data.terms as form}
				<div
					on:click={() => navigateWithToken(form.term )}
					class="p-4 sm:p-5 flex-grow mb-1 text-sm leading-relaxed space-y-2 border border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer"
				>
					<strong class="font-medium text-gray-800 mr-1">ภาคการศึกษา :</strong>
					{form.term || 'ไม่ระบุ'}
				</div>
			{/each}
		</div>
	{:else}
		<p
			class="my-8 py-4 px-6 rounded-lg text-lg flex items-center justify-center gap-3 bg-gray-50 border border-gray-200 text-gray-600"
		>
			ไม่พบข้อมูลฟอร์ม
		</p>
	{/if}
</div>
