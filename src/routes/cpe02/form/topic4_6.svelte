<script>
    // No changes needed in the script block for styling
    export let project_problem, project_Objective, handleTab,research_data;

    import Topic4 from "./component/topic4.svelte";
    import Topic5 from "./component/topic5.svelte";
    import Topic6 from "./component/topic6.svelte";
</script>

<!-- Use space-y-6 for consistent vertical spacing between sections -->
<div class="space-y-6">

  <!-- Section: Project Problem -->
  <Topic4 bind:project_problem bind:handleTab/>

  <!-- Section: Project Objective -->
  <Topic5 bind:project_Objective bind:handleTab/>

  <Topic6 bind:research_data bind:handleTab/>

</div>
