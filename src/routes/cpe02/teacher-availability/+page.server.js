// +page.server.js
export async function load({ fetch }) {
    let projects = [];
    let fixedTerm = null;
    let maxDirectors = 0;
    let error = null;

    try {
        // 1. Fetch form data to get the fixed term
        const formRes = await fetch(`/api/form-data?isOpen=true`);
        
        if (!formRes.ok) {
            const formDataError = await formRes.json();
            throw new Error(formDataError.error || "ไม่สามารถโหลดข้อมูลฟอร์มสำหรับภาคการศึกษาได้");
        }
        
        const formDataResponse = await formRes.json();
        const openForm = formDataResponse.data.find(form => form.isOpen === true);

        if (openForm && openForm.term) {
            fixedTerm = openForm.term;

            // 2. Fetch all projects from Firestore
            const project_data = await fetch(`/api/project-data?term=${fixedTerm}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "max-age=60",
                },
            });
            
            let allFetchedProjects = await project_data.json();
            allFetchedProjects = allFetchedProjects.data;

            // 3. Filter these projects by the fixedTerm
            projects = allFetchedProjects.filter(p => p.term === fixedTerm);

            // 4. Process the term-specific projects for director info
            if (projects.length > 0) {
                projects = projects.map((projectData) => {
                    // Handle case where directors may be undefined or not an array
                    const directorsArray = Array.isArray(projectData.directors) ? projectData.directors : [];
                    
                    // Safely extract director names with fallback values
                    const extractedDirectorNames = directorsArray.map(
                        (d) => {
                            // Handle potential null/undefined directors
                            if (!d) return "ไม่ระบุ";
                            return d.name || d.email || "ไม่ระบุ";
                        }
                    );
                    const directorCount = directorsArray.length;

                    if (directorCount > maxDirectors) {
                        maxDirectors = directorCount;
                    }

                    return {
                        ...projectData,
                        directorNames: extractedDirectorNames,
                        directorCount: directorCount,
                    };
                });
            } else {
                maxDirectors = 0; // No projects for this term
            }
        } else {
            error = "ไม่พบภาคการศึกษาที่เปิดให้แสดงข้อมูลโครงงาน";
            projects = [];
            maxDirectors = 0;
        }
    } catch (err) {
        console.error("Error fetching projects:", err);
        error = "เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน กรุณาลองใหม่อีกครั้ง";
        projects = [];
        maxDirectors = 0;
    }

    return {
        projects,
        fixedTerm,
        maxDirectors,
        error
    };
}