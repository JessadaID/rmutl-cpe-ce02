<script>
	import { page } from '$app/stores';
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center text-center">
	<h1 class="text-9xl font-bold text-red-600">{$page.status}</h1>
	<p class="mt-2 mb-8 text-xl text-slate-500">
		{$page.error?.message || 'Something went wrong.'}
	</p>
	<a
		href="/"
		class="rounded-md bg-blue-500 py-3 px-6 font-medium text-white transition-colors hover:bg-blue-600"
		>กลับหน้าหลัก</a
	>
</div>
