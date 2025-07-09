<script>
  import { onMount } from 'svelte';
  import TeacherTooltip from '$lib/components/teacherTooltip.svelte';

  let terms = [];
  let selectedTermId = '';
  let projectScores = [];
  let filteredProjects = [];
  let isLoading = false;
  let error = null;
  let searchQuery = '';

  let tooltipText = '';
  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let selectedTermScoreLimits = {
    subjectScoreLimit: 0,
    directorScoreLimit: 0,
    adviserScoreLimit: 0
  };

  async function fetchTerms() {
    const respond = await fetch('/api/form-data');
    const data = (await respond.json()).data;
    return data;
  }

  async function fetchProjectScoresByTerm(termId) {
    if (!termId) {
      return [];
    }
    const respond = await fetch(`/api/project-data?term=${termId}`);
    const data = (await respond.json()).data;
    return data;
  }

  onMount(async () => {
    try {
      isLoading = true;
      terms = await fetchTerms();
    } catch (e) {
      error = e.message || 'ไม่สามารถโหลดข้อมูลเทอมได้';
      console.error('Error fetching terms:', e);
    } finally {
      isLoading = false;
    }
  });

  $: {
    if (selectedTermId && selectedTermName) {
      (async () => {
        isLoading = true;
        error = null;
        projectScores = [];
        try {
          const scores = await fetchProjectScoresByTerm(selectedTermName);
          projectScores = scores;
        } catch (e) {
          error = e.message || `ไม่สามารถโหลดคะแนนสำหรับเทอมที่เลือกได้`;
          projectScores = [];
          console.error(`Error fetching scores for term ${selectedTermId}:`, e);
        } finally {
          isLoading = false;
        }
      })();
    } else {
      projectScores = [];
      selectedTermScoreLimits = {
        subjectScoreLimit: 0,
        directorScoreLimit: 0,
        adviserScoreLimit: 0
      };
    }
  }

  // Search functionality
  $: {
    if (!searchQuery.trim()) {
      filteredProjects = projectScores;
    } else {
      const query = searchQuery.toLowerCase().trim();
      filteredProjects = projectScores.filter(project => {
        // Search in project name
        const projectName = (project.project_name_th || '').toLowerCase();
        
        // Search in advisers
        const advisers = (project.adviser || []).map(a => (a.name || '').toLowerCase()).join(' ');
        
        // Search in directors
        const directors = (project.directors || []).map(d => (d.name || '').toLowerCase()).join(' ');
        
        // Search in subject teachers
        const subjectTeachers = (project.subjectTeachers || []).map(s => (s.name || '').toLowerCase()).join(' ');
        
        return projectName.includes(query) || 
               advisers.includes(query) || 
               directors.includes(query) ||
               subjectTeachers.includes(query);
      });
    }
  }

  $: selectedTermName = terms.find(t => t.id === selectedTermId)?.term || '';
  $: {
    const term = terms.find(t => t.id === selectedTermId);
    if (term) {
      selectedTermScoreLimits = {
        subjectScoreLimit: term.subjectScoreLimit || 0,
        directorScoreLimit: term.directorScoreLimit || 0,
        adviserScoreLimit: term.adviserScoreLimit || 0
      };
    }
  }

  function showTooltip(event, text) {
    tooltipText = text;
    tooltipX = event.pageX + 10; 
    tooltipY = event.pageY + 5;
    tooltipVisible = true;
  }

  function hideTooltip() {
    tooltipVisible = false;
  }

  // Function to calculate overall average score from all three score types
  function calculateOverallAverage(project) {
    const adviserScores = (project.adviser || [])
      .map(a => a.score)
      .filter(score => score !== undefined && score !== null && typeof score === 'number');

    const directorScores = (project.directors || [])
      .map(d => d.score)
      .filter(score => score !== undefined && score !== null && typeof score === 'number');

    const subjectScores = [project.score_from_subject_teacher || 0]

    const allScores = [...adviserScores, ...directorScores, ...subjectScores];

    if (allScores.length === 0) {
      return null;
    }

    const totalScore = allScores.reduce((sum, score) => sum + score, 0);
    return totalScore 
  }
</script>

<div class="min-h-screen bg-gray-50 py-6 px-4">
  <div class="max-w-full mx-auto">
    <!-- Header -->
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">คะแนนโครงงาน</h1>
      <p class="text-sm text-gray-600">ระบบแสดงผลคะแนนโครงงานในรูปแบบตาราง (3 ประเภทคะแนน)</p>
    </div>

    <!-- Score Legend -->
    {#if selectedTermId}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <h3 class="text-sm font-medium text-gray-700 mb-2">คะแนนเต็มของแต่ละประเภท:</h3>
        <div class="flex flex-wrap gap-4 text-sm">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>คะแนนรายวิชา: {selectedTermScoreLimits.subjectScoreLimit}</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>คะแนนที่ปรึกษา: {selectedTermScoreLimits.adviserScoreLimit}</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>คะแนนกรรมการ: {selectedTermScoreLimits.directorScoreLimit}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Controls -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="grid md:grid-cols-2 gap-4">
        <!-- Term Selection -->
        <div>
          <label for="term-select" class="block text-sm font-medium text-gray-700 mb-2">
            เลือกเทอม
          </label>
          <select 
            id="term-select" 
            bind:value={selectedTermId} 
            disabled={isLoading || (terms.length === 0 && !error)}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">เลือกเทอม...</option>
            {#each terms as term (term.id)}
              <option value={term.id}>{term.term}</option>
            {/each}
          </select>
        </div>

        <!-- Search -->
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
            ค้นหา (ชื่อโครงงาน, อาจารย์, กรรมการ, อาจารย์ประจำวิชา)
          </label>
          <div class="relative">
            <input
              id="search"
              type="text"
              bind:value={searchQuery}
              placeholder="พิมพ์เพื่อค้นหา..."
              disabled={!selectedTermId || isLoading}
              class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
            <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Results Summary -->
      {#if selectedTermId && filteredProjects.length > 0}
        <div class="mt-3 text-sm text-gray-600">
          แสดง {filteredProjects.length} จาก {projectScores.length} โครงงาน
          {#if searchQuery.trim()}
            สำหรับ "{searchQuery}"
          {/if}
        </div>
      {/if}
    </div>

    <!-- Loading -->
    {#if isLoading}
      <div class="flex justify-center py-12">
        <div class="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <span class="ml-2 text-gray-600">กำลังโหลด...</span>
      </div>

    <!-- Error -->
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center text-red-800">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-sm font-medium">เกิดข้อผิดพลาด: {error}</span>
        </div>
      </div>

    <!-- No Term Selected -->
    {:else if !selectedTermId}
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <svg class="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-blue-800">กรุณาเลือกเทอมเพื่อแสดงข้อมูล</p>
      </div>

    <!-- Table -->
    {:else if filteredProjects.length > 0}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  ชื่อโครงงาน
                </th>
                <th class="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-300">
                  <div class="flex items-center justify-center">
                    <div class="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                    คะแนนรายวิชา
                  </div>
                </th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  อาจารย์ที่ปรึกษา
                </th>
                <th class="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-300">
                  <div class="flex items-center justify-center">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    คะแนนที่ปรึกษา
                  </div>
                </th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  กรรมการสอบ
                </th>
                <th class="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-300">
                  <div class="flex items-center justify-center">
                    <div class="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    คะแนนกรรมการ
                  </div>
                </th>
                <th class="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-400">
                  คะแนนรวม (เต็ม 100)
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredProjects as project, i}
                {@const currentOverallAverage = calculateOverallAverage(project)}
                <tr class="hover:bg-gray-50 transition-colors">
                  <!-- Project Name -->
                  <td class="px-3 py-3 text-sm text-gray-900 max-w-xs">
                    <div class="font-medium leading-tight">
                      {project.project_name_th || 'ไม่ระบุชื่อโครงงาน'}
                    </div>
                  </td>

               

                  <!-- Subject Scores -->
                  <td class="px-3 py-3 text-sm text-center bg-gray-100">
                    <div class="font-medium text-orange-600 flex flex-wrap justify-center gap-1">
                      {#if project.score_from_subject_teacher }
                       
                          {#if project.score_from_subject_teacher !== undefined && project.score_from_subject_teacher !== null}
                            <span
                              class="cursor-default"
                            >{project.score_from_subject_teacher }</span>
                          {:else}
                            <span
                              class="cursor-default"
                            >-</span>
                          {/if}
                        
                      {:else}
                        -
                      {/if}
                    </div>
                  </td>

                  <!-- Advisers -->
                  <td class="px-3 py-3 text-sm text-gray-700 max-w-xs">
                    <div class="text-sm text-gray-700 flex items-center space-x-1">
												<span>{project.adviser[0].name || 'N/A'}</span>

													<TeacherTooltip members={project.adviser} />
										</div>
                  </td>

                  <!-- Adviser Scores -->
                  <td class="px-3 py-3 text-sm text-center bg-gray-100">
                    <div class="font-medium text-blue-600 flex flex-wrap justify-center gap-1">
                      {#if project.adviser && project.adviser.length > 0}
                        {#each project.adviser as person}
                          {#if person.score !== undefined && person.score !== null}
                            <span
                              on:mouseenter={(e) => showTooltip(e, person.name || person.email)}
                              on:mouseleave={hideTooltip}
                              class="cursor-default"
                            >{person.score}</span>
                          {:else}
                            <span
                              on:mouseenter={(e) => showTooltip(e, person.name || person.email)}
                              on:mouseleave={hideTooltip}
                              class="cursor-default"
                            >-</span>
                          {/if}
                          {#if person !== project.adviser[project.adviser.length - 1]}
                            ,
                          {/if}
                        {/each}
                      {:else}
                        -
                      {/if}
                    </div>
                  </td>

                  <!-- Directors -->
                  <td class="px-3 py-3 text-sm text-gray-700 max-w-xs">
                    <div class="text-sm text-gray-700 flex items-center space-x-1">
												<span>{project.directors[0]?.name || 'ยังไม่มีกรรมการ' || 'N/A'}</span>

													<TeacherTooltip members={project.directors} />
										</div>
                  </td>

                  <!-- Director Scores -->
                  <td class="px-3 py-3 text-sm text-center bg-gray-100">
                    <div class="font-medium text-green-600 flex flex-wrap justify-center gap-1">
                      {#if project.directors && project.directors.length > 0}
                        {#each project.directors as director}
                          {#if director.score !== undefined && director.score !== null}
                            <span
                              on:mouseenter={(e) => showTooltip(e, director.name || director.email)}
                              on:mouseleave={hideTooltip}
                              class="cursor-default"
                            >{director.score}</span>
                          {:else}
                            <span
                              on:mouseenter={(e) => showTooltip(e, director.name || director.email)}
                              on:mouseleave={hideTooltip}
                              class="cursor-default"
                            >-</span>
                          {/if}
                          {#if director !== project.directors[project.directors.length - 1]}
                            ,
                          {/if}
                        {/each}
                      {:else}
                        -
                      {/if}
                    </div>
                  </td>

                  <!-- Overall Average Score -->
                  <td class="px-3 py-3 text-sm text-center bg-gray-200">
                    {#if currentOverallAverage !== null}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                        {currentOverallAverage.toFixed(2)}
                      </span>
                    {:else}
                      <span class="text-gray-400 text-xs">-</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

    <!-- No Results -->
    {:else if searchQuery.trim()}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <svg class="w-8 h-8 text-yellow-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <p class="text-yellow-800">ไม่พบผลลัพธ์สำหรับ "{searchQuery}"</p>
        <button 
          on:click={() => searchQuery = ''}
          class="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
        >
          ล้างการค้นหา
        </button>
      </div>

    <!-- No Projects -->
    {:else}
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p class="text-gray-600">ไม่มีข้อมูลโครงงานสำหรับเทอม "{selectedTermName}"</p>
      </div>
    {/if}
  </div>

  <!-- Custom Tooltip -->
  {#if tooltipVisible}
    <div
      class="absolute bg-gray-900 text-white text-xs rounded-md px-2 py-1 shadow-lg z-50 pointer-events-none"
      style="left: {tooltipX}px; top: {tooltipY}px;"
    >
      {tooltipText}
    </div>
  {/if}
</div>

<style>
  /* Custom table styles */
  table {
    font-size: 0.875rem;
  }
  
  /* Responsive table scroll */
  .overflow-x-auto {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  
  .overflow-x-auto::-webkit-scrollbar {
    height: 6px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>