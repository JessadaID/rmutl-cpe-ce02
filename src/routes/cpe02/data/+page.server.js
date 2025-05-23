export async function load({ fetch }) {
  try {
    //const recive = await fetch("api/form-data");
    //const data = await recive.json();
    const response = await fetch("/api/form-data",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'Cache-Control': 'max-age=60'
        },
      }
    ); // ใช้ fetch ที่ส่งเข้ามาจาก SvelteKit
    
    const form_data = await response.json();
    //console.log("data:", form_data.data); // แสดงผลใน console เพื่อตรวจสอบ
    return {
      terms:form_data.data // ส่งกลับเป็น array ของชื่อ term
    };

  } catch (error) {
    console.error("Error loading terms:", error);

    // ส่งค่าว่างและข้อผิดพลาดกลับไป
    return {
      terms: [], // ส่ง array ว่างกลับไปในกรณีเกิดข้อผิดพลาด
      error: "Error loading terms: " + error.message
    };
  }
}
