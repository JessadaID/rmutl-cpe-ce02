<script>
    // No changes needed in the script block for styling
    export let project_problem;
    export let handleTab; // Function to handle tab key event for the textarea
</script>
<div>
    <label for="project_problem" class="block text-sm font-medium text-gray-700"
      >4. ที่มาและความสำคัญของปัญหา <span class="text-red-500 font-bold">*</span>
    </label>
    <textarea
      id="project_problem"
      name="project_problem"
      rows="10"
      required
      class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      bind:value={project_problem}
      on:keydown={(event) =>
        handleTab(event, (value) => (project_problem = value))}
      placeholder="เขียนที่มาและความสำคัญของปัญหา..."
    ></textarea>
    {#if !project_problem || project_problem.trim() === ""}
       <p class="mt-1 text-xs text-gray-500">กรุณากรอกที่มาและความสำคัญของปัญหา</p>
    {/if}
  </div>