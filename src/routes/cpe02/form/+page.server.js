export async function load({ fetch }) {
  try {
    const response = await fetch("/api/form-data?isOpen=true", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch form data: ${response.statusText}`);
    }
    const { data } = await response.json();
    // Extract the latest term from the array
    const latestTerm = data[0];
    return { term : latestTerm };
  } catch (error) {
    console.error("Error loading form data:", error);
    return {
      error: "Error loading form data: " + error.message,
    };
  }
}
