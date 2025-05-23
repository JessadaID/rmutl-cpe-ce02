<div class=" inset-0 flex items-center justify-center bg-transperent z-50">
  <div class="relative">
    <div class="w-16 h-16 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
    <p class="mt-4 text-sm text-slate-600 text-center">กำลังโหลด...</p>
  </div>
</div>

<style>
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
