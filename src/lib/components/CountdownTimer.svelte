<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let targetDate: Date;

  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
    isReady: false, // To prevent initial flash of 0s
  };

  let interval: ReturnType<typeof setInterval>;

  function calculateTimeLeft() {
    if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, isReady: true };
      if (interval) clearInterval(interval);
      return;
    }

    const difference = +targetDate - +new Date();
    if (difference <= 0) {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, isReady: true };
      if (interval) clearInterval(interval);
      return;
    }

    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isPast: false,
      isReady: true,
    };
  }

  onMount(() => {
    calculateTimeLeft(); // Initial calculation
    if (!timeLeft.isPast) {
      interval = setInterval(calculateTimeLeft, 1000);
    }
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

{#if !timeLeft.isReady}
  <p class="text-sm text-gray-500 animate-pulse">กำลังคำนวณเวลา...</p>
{:else if timeLeft.isPast}
  <p class="text-sm font-semibold text-red-600">ถึงเวลาแล้ว หรือ ผ่านไปแล้ว</p>
{:else}
  <div class="grid grid-cols-4 gap-2 text-center tabular-nums">
    <div><div class="text-2xl font-bold">{String(timeLeft.days).padStart(2, '0')}</div><div class="text-xs uppercase text-gray-500">วัน</div></div>
    <div><div class="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div><div class="text-xs uppercase text-gray-500">ชั่วโมง</div></div>
    <div><div class="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div><div class="text-xs uppercase text-gray-500">นาที</div></div>
    <div><div class="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div><div class="text-xs uppercase text-gray-500">วินาที</div></div>
  </div>
{/if}