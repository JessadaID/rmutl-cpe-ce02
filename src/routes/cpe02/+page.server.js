// +page.server.js
export async function load({ fetch }) {
  try {
    const response = await fetch("/api/form-data?isOpen=true",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'Cache-Control': 'max-age=60'
        },
      }
    ); // ใช้ fetch ที่ส่งเข้ามาจาก SvelteKit
    if (!response.ok) {
      throw new Error(`Failed to fetch form data: ${response.statusText}`);
    }
    
    const { data } = await response.json();
     // ดึง term ล่าสุดจาก array
    const lastestTerm = data[0]

    //console.log("lastestTerm:", lastestTerm); // แสดงผลใน console เพื่อตรวจสอบ
    return { lastestTerm }; // ส่ง term ล่าสุดกลับไป
  } catch (error) {
    console.error("Error loading form data:", error);

    return {
      error: "Error loading form data: " + error.message
    };
  }
}
