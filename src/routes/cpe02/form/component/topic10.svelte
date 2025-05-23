<script>
    export let benefits,handleTab;
</script>


<div>
    <label for="scope" class="block text-sm font-medium text-gray-700"
        >10. ประโยชน์ที่คาดว่าจะได้รับ <span class="text-red-500 font-bold">*</span>
      </label>
      <textarea
        id="benefits"
        name="benefits"
        rows="10"
        required
        class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        bind:value={benefits}
        on:keydown={(event) => handleTab(event, (value) => (benefits = value))}
        placeholder="อธิบายประโยชน์ที่คาดว่าจะได้รับ..."
      ></textarea>
      {#if !benefits || benefits.trim() === ""}
         <p class="mt-1 text-xs text-gray-500">กรุณากรอกประโยชน์ที่คาดว่าจะได้รับ</p>
      {/if}
  </div>