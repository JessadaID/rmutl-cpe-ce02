<script>
    import Topic10 from "./component/topic10.svelte";
    import Topic11 from "./component/topic11.svelte";
    import Topic12 from "./component/topic12.svelte";
    export let benefits, handleTab ,refer,budgetItems;
</script>

<!-- Use space-y-6 for consistent vertical spacing between sections -->
<div class="space-y-6">
    <Topic10 bind:benefits bind:handleTab />
    <Topic11 bind:budgetItems />
    <Topic12 bind:handleTab bind:refer />
</div>
