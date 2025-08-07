export async function load({ fetch, params }) {
  try {
    //const recive = await fetch("api/form-data");
    //const data = await recive.json();
    const { term } = params; // Get the term from the URL parameters
    //console.log('Term from params:', term); // Log the term for debugging
    const res = await fetch(`/api/project-data?term=${term}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60'
      }
    });

    if (res.ok) {
      const responseData = await res.json();
      //console.log("Fetched data for term:", term, responseData.data); // Log the fetched data for debugging
      return {
        terms: responseData.data // Assuming responseData.data is an array of terms
      };
    } else {
      throw new Error(`Failed to fetch data for term: ${term}`);
    }
  } catch (error) {
    console.error("Error loading terms:", error);
    // ส่งค่าว่างและข้อผิดพลาดกลับไป
    return {
      terms: [], // ส่ง array ว่างกลับไปในกรณีเกิดข้อผิดพลาด
      error: "Error loading terms: " + error.message,
    };
  }
}
