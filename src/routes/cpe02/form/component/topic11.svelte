<script>
    import { tick } from 'svelte';
  
    export let budgetItems = [
      { id: crypto.randomUUID(), description: '', amount: 0 },
    ];

    //console.log('Initial budgetItems:', JSON.stringify(budgetItems));
  
    let editingCell = null; // { itemId: string, field: 'description' | 'amount' } | null
    let editValue = '';
  
    function addRow() {
      budgetItems = [
        ...budgetItems,
        { id: crypto.randomUUID(), description: '', amount: 0 },
      ];
      //console.log('addRow called, new budgetItems:', JSON.stringify(budgetItems));
    }

    function removeItem(itemId) {
      budgetItems = budgetItems.filter(item => item.id !== itemId);
      //console.log('removeItem called, item ${itemId} removed, new budgetItems:', JSON.stringify(budgetItems));
    }
  
    async function startEditing(itemId, field, currentValue) {
      //console.log(`startEditing called for item ${itemId}, field ${field}, value: ${currentValue}`);
      editingCell = { itemId, field };
      editValue = currentValue;
      // Wait for the input to render, then focus it
      await tick();
      const inputElement = document.querySelector(`input[data-editing-id="${itemId}"][data-editing-field="${field}"]`);
      inputElement?.focus();
      inputElement?.select();
    }
  
    function handleInputBlur(itemId, field) {
      const index = budgetItems.findIndex(item => item.id === itemId);
      //console.log(`handleInputBlur called for item ${itemId}, field ${field}, editValue: ${editValue}`);
      if (index !== -1) {
        const updatedValue = field === 'amount' ? parseFloat(editValue) || 0 : editValue;
        budgetItems[index][field] = updatedValue;
        // Trigger reactivity
        budgetItems = budgetItems;
        //console.log('budgetItems updated after blur:', JSON.stringify(budgetItems));
      }
      editingCell = null;
    }
  
    function handleInputKeydown(event, itemId, field) {
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission if inside one
        handleInputBlur(itemId, field);
      } else if (event.key === 'Escape') {
        //console.log(`Editing cancelled for item ${itemId}, field ${field}`);
        editingCell = null; // Cancel editing
      }
    }

    // Reactive declaration for total amount
    $: totalAmount = budgetItems.reduce((sum, item) => sum + item.amount, 0);
    // Log totalAmount whenever it changes
    //$: console.log('totalAmount updated:', totalAmount);
  </script>
  

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1"
        >11. ประโยชน์ที่คาดว่าจะได้รับ <span class="text-red-500 font-bold">*</span> (คลิกที่ตารางเพื่อแก้ไข)
      </label>
  <div class="overflow-x-auto relative border rounded-md mb-4">
    
    <table class="w-full text-sm text-left text-gray-500 ">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50  ">
      <tr>
        <th scope="col" class="py-3 px-6 w-16 text-center">ลำดับ</th>
        <th scope="col" class="py-3 px-6">รายละเอียด</th>
        <th scope="col" class="py-3 px-6 text-right">จำนวนเงิน (บาท)</th>
        <th scope="col" class="py-3 px-6 text-center">จัดการ</th>
      </tr>
    </thead>
    <tbody>
      {#each budgetItems as item, index (item.id)}
        <tr class="bg-white border-b hover:bg-gray-50 ">
          <td class="py-3 px-6 text-center">{index + 1}</td>
          <td class="py-3 px-6 cursor-pointer" on:click={() => startEditing(item.id, 'description', item.description)}>
            {#if editingCell?.itemId === item.id && editingCell?.field === 'description'}
              <input
                type="text"
                bind:value={editValue}
                data-editing-id={item.id}
                data-editing-field="description"
                on:blur={() => handleInputBlur(item.id, 'description')}
                on:keydown={(e) => handleInputKeydown(e, item.id, 'description')}
                class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            {:else}
              {item.description || '(คลิกเพื่อแก้ไข)'}
            {/if}
          </td>
          <td class="py-3 px-6 text-right cursor-pointer" on:click={() => startEditing(item.id, 'amount', item.amount)}>
            {#if editingCell?.itemId === item.id && editingCell?.field === 'amount'}
              <input
                type="number"
                step="any"
                bind:value={editValue}
                data-editing-id={item.id}
                data-editing-field="amount"
                on:blur={() => handleInputBlur(item.id, 'amount')}
                on:keydown={(e) => handleInputKeydown(e, item.id, 'amount')}
                class="w-full px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 "
              />
            {:else}
              {item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {/if}
          </td>
           <td class="py-3 px-6 text-center">
            <button
              type="button"
              on:click={() => removeItem(item.id)}
              class="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 rounded hover:bg-red-100 transition-colors"
              title="ลบรายการนี้"
            >
              ลบ
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
    <tfoot class="text-xs text-gray-700 uppercase bg-gray-50  font-semibold">
        <tr class="border-t ">
            <td colspan="3" class="py-3 px-6 text-right">รวมทั้งสิ้น</td>
            <td class="py-3 px-6 text-right">
                {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
        </tr>
    </tfoot>
  </table>
  </div>
  
  <button
    type="button"
    on:click={addRow}
    class="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition"
  >
    เพิ่มรายการ
  </button>
</div>
