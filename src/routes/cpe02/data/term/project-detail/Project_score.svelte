<script>
    export let project ;
    export let form_data ;
    
    let directorScoreLimit = 0;
    let adviserScoreLimit = 0;
    let perDirectorMaxScore = 0;
    
    $: {
        const currentForm = form_data.find(form => form.term === project.term);
        if (currentForm) {
            directorScoreLimit = Number(currentForm.directorScoreLimit ?? 0);
            adviserScoreLimit = Number(currentForm.adviserScoreLimit ?? 0);
        }
        
        const numberOfDirectors = project?.directors?.length || 0;
        if (numberOfDirectors > 0) {
            perDirectorMaxScore = parseFloat((directorScoreLimit / numberOfDirectors).toFixed(2));
        } else {
            perDirectorMaxScore = directorScoreLimit;
        }
    }
</script>

<div class="bg-white shadow-lg rounded-lg p-6">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">คะแนนจากกรรมการและที่ปรึกษา</h2>
    {#if project.adviser && project.adviser.length > 0}
            <div class="mb-3">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">ที่ปรึกษา</h3>
                <ul class="space-y-3">
                    {#each project.adviser as person (person.email)}
                        <li class="p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-medium text-gray-700">{person.name || person.email} (ที่ปรึกษา)</span>
                                {#if person.score !== undefined && person.score !== null}
                                    <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                                        ให้คะแนนแล้ว: {person.score} / {adviserScoreLimit}
                                    </span>
                                {:else}
                                    <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                                        ยังไม่ได้ให้คะแนน
                                    </span>
                                {/if}
                            </div>
                            {#if person.comments && person.comments.trim() !== ""}
                                <p class="text-sm text-gray-600 mt-1 pl-2 border-l-2 border-gray-300">
                                    <span class="font-medium">ความเห็น:</span> {person.comments}
                                </p>
                            {/if}
                            {#if person.ratedAt}
                                <p class="text-xs text-gray-500 mt-1 text-right">
                                    เมื่อ: {new Date(person.ratedAt).toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                                </p>
                            {/if}
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}

    {#if project.directors && project.directors.length > 0}
        <h3 class="text-lg font-semibold text-gray-700 mb-2 mt-4">กรรมการสอบ</h3>
        <ul class="space-y-3">
            {#each project.directors as director (director.email)}
                <li class="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-medium text-gray-700">{director.name || director.email} (กรรมการ)</span>
                        {#if director.score !== undefined && director.score !== null}
                            <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                ให้คะแนนแล้ว: {director.score} / {perDirectorMaxScore}
                            </span>
                        {:else}
                            <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                                ยังไม่ได้ให้คะแนน
                            </span>
                        {/if}
                    </div>
                    {#if director.comments && director.comments.trim() !== ""}
                        <p class="text-sm text-gray-600 mt-1 pl-2 border-l-2 border-gray-300">
                            <span class="font-medium">ความเห็น:</span> {director.comments}
                        </p>
                    {/if}
                    {#if director.ratedAt}
                        <p class="text-xs text-gray-500 mt-1 text-right">
                            เมื่อ: {new Date(director.ratedAt).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    {/if}
                </li>
            {/each}
        </ul>
        {@const ratedDirectors = project.directors.filter(d => d.score !== undefined && d.score !== null)}
                {#if ratedDirectors.length > 0}
                    {@const totalScore = ratedDirectors.reduce((sum, d) => sum + Number(d.score), 0)}
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <p class="text-md font-semibold text-gray-700">
                            คะแนนรวม (กรรมการ): {totalScore} / {ratedDirectors.length * perDirectorMaxScore}
                            <span class="text-sm text-gray-500"> (จาก {ratedDirectors.length} ท่าน)</span>
                        </p>
                    </div>
                {/if}
               
    {:else}
        <p class="text-sm text-gray-500">ยังไม่มีข้อมูลกรรมการสำหรับโครงงานนี้</p>
    {/if}
</div>