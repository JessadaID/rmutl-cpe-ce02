<script>
    export let scope, handleTab;
</script>

<div>
    <label for="scope" class="block text-sm font-medium text-gray-700"
        >8. ขอบเขตของโครงงาน <span class="text-red-500 font-bold">*</span>
      </label>
      <textarea
        id="scope"
        name="scope"
        rows="10"
        required
        class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        bind:value={scope}
        on:keydown={(event) => handleTab(event, (value) => (scope = value))}
        placeholder="อธิบายขอบเขตของโครงงาน..."
      ></textarea>
      {#if !scope || scope.trim() === ""}
         <p class="mt-1 text-xs text-gray-500">กรุณากรอกขอบเขตของโครงงาน</p>
      {/if}
  </div>