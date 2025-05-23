<script>
  // ลิงก์ PDF จาก Google Drive (ต้องเปิดแชร์ Anyone with the link)
  const driveViewUrl = "https://drive.google.com/file/d/10Cn0ivOKhljpacWvq8E-2oyK0KAQxxLy/view?usp=drive_link";

  // แปลงเป็นลิงก์แบบ preview เพื่อใช้ใน iframe
  const embedUrl = driveViewUrl.replace("/view", "/preview");
</script>

<h1>ดูเอกสาร PDF</h1>

<iframe
  src={embedUrl}
  width="100%"
  height="800px"
  style="border: none;"
  allow="autoplay"
/>
