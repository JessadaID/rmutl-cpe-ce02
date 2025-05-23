<script>
    export let project_Objective; // Declare the variable to hold the project objective
    export let handleTab; // Function to handle tab key event for the textarea
</script>

<div>
    <label for="project_objective" class="block text-sm font-medium text-gray-700"
      >5. วัตถุประสงค์ของโครงงาน <span class="text-red-500 font-bold">*</span>
    </label>
    <textarea
      id="project_objective"
      name="project_objective"
      rows="7"
      required
      class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      bind:value={project_Objective}
      on:keydown={(event) =>
        handleTab(event, (value) => (project_Objective = value))}
      placeholder="วัตถุประสงค์ของโครงงาน"
    ></textarea>
     {#if !project_Objective || project_Objective.trim() === ""}
        <p class="mt-1 text-xs text-gray-500">กรุณากรอกวัตถุประสงค์ของโครงงาน</p>
     {/if}
  </div>