<script>
    import { page } from '$app/stores'; // Import page store to get params
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte'; // Import tick
    import { getCookie } from "cookies-next";
    import { db } from '$lib/firebase'; // Import Firestore instance
    import {
        doc,
        getDoc,
        setDoc,
        Timestamp,
    } from 'firebase/firestore';
    import Calendar from "./Calendar.svelte";
    import { successToast, dangerToast, warningToast } from '$lib/customtoast';
    import { triggerAvailabilityUpdate } from '$lib/stores/availabilityStore'; // Import the trigger
    import { convertToDate } from '$lib/convertToDate'; // Import utility function to handle date conversion


    let userRole = '';
    let email = '';
    let projectId = ''; // Variable to hold project ID
    let name = ''; // Variable to hold user's name

    let selectedDates = [];
    let selectedRange = { start: null, end: null };
    let savedSelections = []; // This will be loaded from Firestore and bound to Calendar
    let selectionMode = 'single';
    let isLoading = true; // Start in loading state
    let projectAvailabilityData = null; // To store the entire project document data

    
    // --- Firestore Collection Name ---
    const APPOINTMENTS_COLLECTION = 'project-availability'; // Or your preferred name

    onMount(async () => {
        userRole = getCookie('role');
        email = getCookie('email');
        name = getCookie('name'); // Get user's name from cookies
        projectId = $page.params.id; // Get project ID from route params

        if (!email || !projectId) {
            dangerToast("ไม่พบข้อมูลผู้ใช้หรือ ID โปรเจกต์");
            goto('/TS_Dashboard/Appointment'); // Redirect if essential info is missing
            return;
        }

        // Basic role check (adjust as needed)
        if (userRole !== 'subject_teacher' && userRole !== 'admin' && userRole !== 'teacher') {
            warningToast("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
            // Decide if you want to redirect unauthorized roles
            // goto('/some-other-page');
            isLoading = false; // Stop loading if unauthorized
            return;
        }

        await loadProjectAvailability(); // Load the single document for the project
        processUserData(); // Extract current user's data

        isLoading = false;
    });

    // --- Load current user's data ---
    async function loadProjectAvailability() {

        try {
            const respond = await fetch(`/api/project-availability/${projectId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await respond.json();
            projectAvailabilityData = data.projectData;
            
        } catch (error) {
            console.error("Error loading project availability:", error);
            dangerToast("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจกต์");
            projectAvailabilityData = null; // Indicate error state
        }
    }

    // --- Process data for the current user ---
  function processUserData() {
    const currentUserData = projectAvailabilityData?.usersAvailability?.[email];
    if (currentUserData && currentUserData.savedSelections) {
        // Convert Firestore timestamps and string timestamps to JS Dates
        savedSelections = (currentUserData.savedSelections || []).map(sel => ({
            ...sel,
            // Handle different timestamp formats
            date: convertToDate(sel.date),
            start: convertToDate(sel.start),
            end: convertToDate(sel.end),
        })).filter(sel => sel.id); // Ensure selections have an ID
    } else {
        console.log("No previous availability data found for this user in this project.");
        savedSelections = [];
    }
}


    // --- Load data for all users related to the project (OLD - replaced by processAllUsersData) ---
    // async function loadAllUsersAvailability() { ... } // Keep commented or remove

    // --- Event handler for the 'save' or 'delete' event from Calendar ---
    async function handleSave(event) {
        const updatedSelections = event.detail.savedSelections;
        const projectDocRef = doc(db, APPOINTMENTS_COLLECTION, projectId);

        // Convert JS Dates back to Firestore Timestamps before saving
        const selectionsToSave = updatedSelections.map(sel => ({
            ...sel,
            date: sel.date ? Timestamp.fromDate(sel.date) : null,
            start: sel.start ? Timestamp.fromDate(sel.start) : null,
            end: sel.end ? Timestamp.fromDate(sel.end) : null,
        }));

        // Prepare the data structure for merging into the document
        const dataToMerge = {
            projectId: projectId, // Optional: ensure projectId is in the doc
            usersAvailability: {
                [email]: { // Use computed property name to set the key dynamically
                    name:name,
                    savedSelections: selectionsToSave
                }
            }
        };

        try {
            // Use setDoc with merge: true to update only the current user's data
            // within the usersAvailability map.
            await setDoc(projectDocRef, dataToMerge, { merge: true });

            successToast("บันทึกวันที่เลือกสำเร็จ");

            // Refresh ALL data from the single document after successful save
            await loadProjectAvailability();
            processUserData(); // Update current user's view

            // Signal that availability data has changed for other components (like the layout)
            triggerAvailabilityUpdate();

        } catch (error) {
            console.error("Error saving availability:", error);
            dangerToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
        }
    }

  

</script>

<!-- Basic Loading State -->
{#if isLoading}
    <div class="flex justify-center items-center h-screen">
        <p class="text-lg text-gray-600">กำลังโหลดข้อมูลปฏิทิน...</p>
        <!-- Add a spinner here if you like -->
    </div>
{:else if !projectAvailabilityData && !isLoading}
    <div class="flex justify-center items-center h-screen">
        <p class="text-lg text-red-600">ไม่สามารถโหลดข้อมูลโปรเจกต์ได้</p>
    </div>
{:else}
    <!-- Only render content when not loading and authorized -->
    {#if userRole === 'subject_teacher' || userRole === 'admin' || userRole === 'teacher'}
        <div class="w-full min-h-screen mt-4 space-y-6">

            <!-- Calendar for Input -->
            <div class="bg-white p-4 rounded-lg shadow">
                 <h2 class="text-lg font-semibold mb-3">เลือก/แก้ไข วันที่ว่างของคุณ </h2>
                 <Calendar
                    bind:selectionMode
                    bind:selectedDates
                    bind:selectedRange
                    bind:savedSelections
                    on:save={handleSave}
                    on:delete={handleSave} 
                    on:update={handleSave}
                 />
            </div>



        </div>
    {:else}
         <div class="flex justify-center items-center h-screen">
             <p class="text-red-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
         </div>
    {/if}
{/if}