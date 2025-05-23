<script>
  import { onMount } from 'svelte';

  export let selectedDate;
  let availableTimes = [];
  let selectedTime = null;
  let loading = true;
  let error = null;

  onMount(async () => {
    if (!selectedDate) {
      error = 'No date selected.';
      loading = false;
      return;
    }
    try {
      // Simulate fetching available times from an API
      // Replace this with your actual API call
      const response = await fetchAvailableTimes(selectedDate);
      availableTimes = response;
    } catch (err) {
      error = 'Failed to fetch available times.';
      console.error(err);
    } finally {
      loading = false;
    }
  });

  async function fetchAvailableTimes(date) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Example: Generate some dummy available times
    const times = [];
    for (let i = 9; i <= 17; i++) {
      times.push(`${i.toString().padStart(2, '0')}:00`);
      times.push(`${i.toString().padStart(2, '0')}:30`);
    }
    // Filter out times that are not available on the selected date (for demo)
    if (date.getDate() % 2 === 0) {
      return times.filter((time, index) => index % 3 !== 0);
    }
    return times;
  }

  function handleTimeSelect(time) {
    selectedTime = time;
  }

  function handleConfirm() {
    if (selectedTime) {
      alert(`Appointment scheduled for ${selectedDate.toDateString()} at ${selectedTime}`);
      // Here you would typically send the selected date and time to your backend
    } else {
      alert('Please select a time.');
    }
  }
</script>

<div class="appointment-scheduler">
  {#if loading}
    <p>Loading available times...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if availableTimes.length === 0}
    <p>No available times for this date.</p>
  {:else}
    <h2>Available Times for {selectedDate.toDateString()}</h2>
    <div class="time-slots">
      {#each availableTimes as time}
        <button
          class:selected={selectedTime === time}
          on:click={() => handleTimeSelect(time)}
        >
          {time}
        </button>
      {/each}
    </div>
    <button class="confirm-button" on:click={handleConfirm} disabled={!selectedTime}>
      Confirm Appointment
    </button>
  {/if}
</div>

<style>
  .appointment-scheduler {
    margin: 20px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  .time-slots {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }
  button.selected {
    background-color: #007bff;
    color: white;
  }
  .error {
    color: red;
  }
</style>