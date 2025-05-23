<script>

    export let  Theory_principles, imagePreviews, selectedFiles, fileInput, handleTab ;


    function handleFileSelect(event) {
        fileInput = event.target;
        const files = Array.from(event.target.files);
        const MAX_SIZE_MB = 2;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

        // Filter out files that are too large *before* processing
        const validFiles = files.filter(file => {
            if (file.size > MAX_SIZE_BYTES) {
                // Consider using a toast notification library here for better UX
                alert(`ไฟล์ "${file.name}" มีขนาดเกิน ${MAX_SIZE_MB}MB และจะไม่ถูกเพิ่ม`);
                return false;
            }
            return file.type.startsWith("image/");
        });

        // Reset arrays before adding new valid files
        selectedFiles = [];
        imagePreviews = [];

        validFiles.forEach((file) => {
            selectedFiles = [...selectedFiles, file];

            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreviews = [
                    ...imagePreviews,
                    {
                        url: e.target.result,
                        name: file.name,
                        size: (file.size / 1024 / 1024).toFixed(2),
                        originalFile: file,
                        title: "", // Keep title for each image
                    },
                ];
            };
            reader.readAsDataURL(file);
        });

        // If no valid files were selected (e.g., all too large or wrong type), clear the input
        if (validFiles.length === 0 && fileInput) {
             fileInput.value = "";
        }
    }

    function removeImage(index) {
        imagePreviews = imagePreviews.filter((_, i) => i !== index);
        selectedFiles = selectedFiles.filter((_, i) => i !== index);

        // Clear the file input if all images are removed to allow re-selection
        if (imagePreviews.length === 0 && fileInput) {
            fileInput.value = "";
        }
    }
</script>

<div>

    <div>
        <label for="theory_principles" class="block text-sm font-medium text-gray-700"
          >7. ทฤษฎีและหลักการ <span class="text-red-500 font-bold">*</span>
        </label>
        <textarea
          id="theory_principles"
          name="theory_principles"
          rows="10"
          required
          class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          bind:value={Theory_principles}
          on:keydown={(event) =>
            handleTab(event, (value) => (Theory_principles = value))}
          placeholder="อธิบายทฤษฎีและหลักการที่ใช้ในโครงงาน..."
        ></textarea>
         {#if !Theory_principles || Theory_principles.trim() === ""}
            <p class="mt-1 text-xs text-gray-500">กรุณากรอกข้อมูลทฤษฎีและหลักการ</p>
         {/if}
      </div>

      
    <label for="multiple_files" class="block text-sm font-medium text-gray-700"
      >รูปภาพประกอบ <span class="text-gray-500 text-xs">(ถ้ามี, แต่ละไฟล์ห้ามเกิน 2MB)</span>
      <!-- Removed red asterisk if images are optional, add back if required -->
      <!-- <span class="text-red-500 font-bold">*</span> -->
    </label>
    <input
      id="multiple_files"
      type="file"
      accept="image/*"
      multiple
      class="mt-1 block w-full text-sm text-gray-500
             file:mr-4 file:py-2 file:px-4
             file:rounded-md file:border-0
             file:text-sm file:font-semibold
             file:bg-indigo-50 file:text-indigo-700
             hover:file:bg-indigo-100
             border border-gray-300 rounded-md cursor-pointer
             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      on:change={handleFileSelect}
      bind:this={fileInput} 
    />
    <!-- Optional: Add helper text if needed, e.g., if required but none selected -->
     {#if imagePreviews.length === 0 && false} <!-- Change 'false' to a variable if upload is truly required -->
        <p class="mt-1 text-xs text-gray-500">กรุณาเลือกไฟล์รูปภาพ</p>
     {/if}

    <!-- Image Preview Grid -->
    {#if imagePreviews.length > 0}
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each imagePreviews as preview, index}
          <div class="relative group border border-gray-200 rounded-md p-2 shadow-sm">
            <img
              src={preview.url}
              alt={preview.name}
              class="h-32 w-full object-cover rounded-md mb-2"
            />
            <div class="space-y-1">
               <span class="text-xs text-gray-500 block truncate" title={preview.name}>{preview.name}</span>
               <span class="text-xs text-gray-500 block">{preview.size} MB</span>
              <input
                type="text"
                placeholder="คำอธิบายรูปภาพ (ถ้ามี)"
                class="block w-full p-1.5 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                bind:value={preview.title}
              />
              <button
                type="button"
                class="mt-1 w-full inline-flex items-center justify-center px-2.5 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                on:click={() => removeImage(index)}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                   <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                 </svg>
                ลบ
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>