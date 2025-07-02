<script>
    export let members = [];
</script>
{#if members.length > 1 }
<div class="relative group">
  <span
    class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium ring-1 ring-green-600/20 ring-inset cursor-help select-none"
  >
    + {members.length - 1}
  </span>
  <!-- Tooltip with z-50 -->
  <div
    class="absolute bottom-full left-1/2 z-50 -translate-x-1/2 mb-2 w-max max-w-xs p-2
                                        bg-gray-700 text-white text-xs rounded shadow-lg
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                                        whitespace-nowrap"
  >
    <ul class="list-none p-0 m-0 text-left">
      {#each members as member, i}
        <li>{i + 1}. {member || "N/A"}</li>
      {/each}
    </ul>
    <div
      class="absolute left-1/2 -translate-x-1/2 top-full mt-[-1px] w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-700"
    ></div>
  </div>
</div>
{/if}