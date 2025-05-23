<script>
    export let research_data, handleTab;
</script>

<div>
    <label for="research_data" class="block text-sm font-medium text-gray-700"
      >6. เอกสาร งานวิจัยที่เกี่ยวข้อง <span class="text-red-500 font-bold">*</span>
    </label>
    <textarea
      id="research_data"
      name="research_data"
      rows="10"
      required
      class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      bind:value={research_data}
      on:keydown={(event) =>
        handleTab(event, (value) => (research_data = value))}
      placeholder="สรุปเอกสารและงานวิจัยที่เกี่ยวข้อง..."
    ></textarea>
    {#if !research_data || research_data.trim() === ""}
       <p class="mt-1 text-xs text-gray-500">กรุณากรอกข้อมูลเอกสาร/งานวิจัยที่เกี่ยวข้อง</p>
    {/if}
  </div>