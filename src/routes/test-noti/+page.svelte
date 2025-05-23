<script lang="ts">
  import { onMount } from 'svelte';

  let fcmToken = '';
  let messageBody = 'สวัสดีจาก Svelte!';
  let status = '';
  let loading = false;
  let sendTo = 'token'; // 'token' หรือ 'all'
  let title = 'ทดสอบการแจ้งเตือน';
  async function sendNotification() {
    try {
      loading = true;
      status = '📤 กำลังส่ง...';

      const payload  = { title,messageBody };

      //console.log('Sending notification with payload:', payload);
      if (sendTo === 'token') {
        if (!fcmToken) {
          status = '❗️ โปรดขอรับ Token ก่อน';
          loading = false;
          return;
        }
        payload.token = fcmToken;
        //console.log('Sending to token:', fcmToken);
      }

      const response = await fetch('/api/test-noti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log(result)
      if (result.success) {
        status = '✅ ส่งสำเร็จ';
      } else {
        status = `❌ ล้มเหลว: ${result.error}`;
      }
    } catch (error: any) {
      status = `❌ ข้อผิดพลาด: ${error.message}`;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!('Notification' in window)) {
      status = '❌ เบราว์เซอร์ไม่รองรับการแจ้งเตือน';
    }
  });
</script>

<div class="form-group">
  <label for="sendTo">ส่งถึง:</label>
  <select id="sendTo" bind:value={sendTo}>
    <option value="token">ผู้ใช้คนนี้ (โดย token)</option>
    <option value="all">ทุกคน</option>
  </select>
</div>

<div class="form-group">
  <label for="title">หัวข้อ:</label>
  <input 
    id="title" 
    type="text" 
    bind:value={title} 
    placeholder="ใส่หัวข้อที่ต้องการส่ง" 
  />
  <label for="message">ข้อความ:</label>
  <input 
    id="message" 
    type="text" 
    bind:value={messageBody} 
    placeholder="ใส่ข้อความที่ต้องการส่ง" 
  />
</div>

<button class="send-btn" on:click={sendNotification} disabled={loading}>
  {loading ? 'กำลังส่ง...' : '🔔 ส่งการแจ้งเตือน'}
</button>
