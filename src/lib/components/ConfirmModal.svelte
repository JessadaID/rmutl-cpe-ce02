<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  export let show = false;
  export let title = "ยืนยันการกระทำ";
  export let message = "คุณแน่ใจหรือไม่?";
  export let confirmButtonText = "ยืนยัน";
  export let cancelButtonText = "ยกเลิก";
  export let confirmButtonClass = "bg-blue-600 hover:bg-blue-700 text-white";
  export let cancelButtonClass = "bg-gray-200 hover:bg-gray-300 text-gray-800";

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function keydown(event: KeyboardEvent) {
    if (show && event.key === 'Escape') {
      handleCancel();
    }
  }

  onMount(() => {
    if (browser) {
      window.addEventListener('keydown', keydown);
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('keydown', keydown);
    }
  });
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity duration-300 ease-in-out"
    on:click={handleCancel}
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-modal-title"
  >
    <div
      class="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all duration-300 ease-in-out scale-100"
      on:click|stopPropagation
    >
      <h3 id="confirm-modal-title" class="text-xl font-semibold text-gray-800 mb-3 text-center">{title}</h3>
      <p class="text-gray-600 mb-8 text-center whitespace-pre-line">{message}</p>
      <div class="flex flex-col sm:flex-row justify-end gap-3">
        <button
          on:click={handleCancel}
          class={`font-semibold py-2.5 px-5 rounded-lg transition-colors duration-200 w-full sm:w-auto ${cancelButtonClass}`}
        >
          {cancelButtonText}
        </button>
        <button
          on:click={handleConfirm}
          class={`font-semibold py-2.5 px-5 rounded-lg transition-colors duration-200 w-full sm:w-auto ${confirmButtonClass}`}
        >
          {confirmButtonText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Optional: Add transitions for enter/leave if desired */
  .fixed.inset-0 {
    opacity: 0;
  }
  .fixed.inset-0.backdrop-blur-sm { /* Ensure this class is applied when show is true for opacity to take effect */
    opacity: 1;
  }
  .fixed.inset-0 > div {
    transform: scale(0.95);
  }
  .fixed.inset-0.backdrop-blur-sm > div {
    transform: scale(1);
  }
</style>
