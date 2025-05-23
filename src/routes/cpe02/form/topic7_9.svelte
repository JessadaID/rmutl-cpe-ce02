<script>
    // No changes needed in the script block for styling, but keep existing logic
    export let  Theory_principles, imagePreviews, selectedFiles, fileInput, handleTab, scope;

    export let tableTitle
    export let monthLabels;
    export let activities;

   import Topic7 from "./component/topic7.svelte";
   import Topic8 from "./component/topic8.svelte";
   import Topic9 from "./component/topic9.svelte";
</script>

<!-- Use space-y-6 for consistent vertical spacing between sections -->
<div class="space-y-6">

  <!-- Section: Theory and Principles -->
  
  <Topic7 bind:Theory_principles bind:imagePreviews bind:selectedFiles bind:fileInput bind:handleTab/>

  <Topic8 bind:scope bind:handleTab/>

  <Topic9 bind:tableTitle bind:monthLabels bind:activities bind:handleTab/>
</div>
