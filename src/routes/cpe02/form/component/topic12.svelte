<script>
    export let refer,handleTab;
</script>


<div>
    <label for="refer" class="block text-sm font-medium text-gray-700"
        >12. เอกสารอ้างอิง <span class="text-red-500 font-bold">*</span>
      </label>
      <textarea
        id="refer"
        name="refer"
        rows="10"
        required
        class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        bind:value={refer}
        on:keydown={(event) => handleTab(event, (value) => (refer = value))}
        placeholder="อธิบายเอกสารอ้างอิง..."
      ></textarea>
      {#if !refer || refer.trim() === ""}
         <p class="mt-1 text-xs text-gray-500">กรุณากรอกเอกสารอ้างอิง</p>
      {/if}
  </div>