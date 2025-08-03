<script>
    import Topic10 from "./component/topic10.svelte";
    import Topic11 from "./component/topic11.svelte";
    import Topic12 from "./component/topic12.svelte";
    export let benefits, handleTab ,refer,budgetItems,pdfdriveLink;
</script>

<!-- Use space-y-6 for consistent vertical spacing between sections -->
<div class="space-y-6">
    <Topic10 bind:benefits bind:handleTab />
    <Topic11 bind:budgetItems />
    <Topic12 bind:handleTab bind:refer />

    <!--PDF file (google drive)-->
    <div class="bg-white p-6 border-t border-gray-200 ">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">เอกสารแนบ (Google drive)</h2>
        <p class="text-gray-600 mb-2">หากมีไฟล์ PDF ที่เกี่ยวข้องกับโครงงาน สามารถแนบได้ที่นี่:</p>
        <div class="flex items-center space-x-4">
            <input
                type="text"
                placeholder="ระบุลิงก์ Google Drive"
                class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                bind:value={pdfdriveLink}
            />
        </div>
    </div>

    
</div>
