<script>
  import Calendarhorizontal from '$lib/components/Calendarhorizontal.svelte';
    import { onMount, onDestroy } from 'svelte'; // Import onMount and onDestroy
    import { dangerToast } from '$lib/customtoast';
    import { page } from '$app/stores'; // Import page store to get params
    import { availabilitySignature } from '$lib/stores/availabilityStore'; // Import the store
    import { convertToDate } from '$lib/convertToDate'; // Import utility function to handle date conversion

    let projectId = ''; // Variable to hold project ID
    let isLoading = true; // Start in loading state
    let showCalendar; // Reference to the ShowCalendar component
    let allUsersAvailability = []; // To store data for ShowCalendar
    let projectAvailabilityData = null; // To store the entire project document data

    let unsubscribeFromAvailabilityUpdates;

  // --- Load current user's data ---
    async function loadProjectAvailability() {
        try {   
            const response = await fetch(`/api/project-availability/${projectId}`);
            if (!response.ok) {
                console.error(`Error fetching project availability: ${response.statusText}`);
                dangerToast("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจกต์");
                isLoading = false; // Stop loading on error
                return;
            }
            const data = await response.json();
            projectAvailabilityData = data.projectData;
        } catch (error) {
            console.error("Error loading project availability:", error);
            dangerToast("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจกต์");
            projectAvailabilityData = null; // Indicate error state
            return;
        }
    }

    function processAllUsersData() {
        const usersDataMap = projectAvailabilityData?.usersAvailability;
        if (usersDataMap) {
            allUsersAvailability = Object.entries(usersDataMap).map(([userEmail, userData]) => {
                return {
                    email: userEmail,
                    name: userData.name,
                    // Convert Timestamps to JS Dates for ShowCalendar
                    savedSelections: (userData.savedSelections || []).map(sel => ({
                        ...sel,
                        date: convertToDate(sel.date),
                        start: convertToDate(sel.start),
                        end: convertToDate(sel.end),
                    })).filter(sel => sel.id) // Ensure selections have an ID
                };
            });
        } else {
            console.log("No user availability data found in the project document.");
            allUsersAvailability = [];
        }
    }

        // --- Function to update the ShowCalendar component ---
    function updateShowCalendarComponent() {
        if (showCalendar && typeof showCalendar.updateUserData === 'function') {
            showCalendar.updateUserData(allUsersAvailability);
        } else if (!isLoading) { // Avoid warning during initial load
            console.warn("ShowCalendar component reference not available yet or updateUserData is not a function.");
        }
    }

    async function reloadAndProcessLayoutData() {
        isLoading = true;
        projectId = $page.params.id;
        await loadProjectAvailability();
        processAllUsersData();
        updateShowCalendarComponent();
        isLoading = false;
    }

    onMount(async () => {
        // Initial load
        await reloadAndProcessLayoutData();

        // Subscribe to availability updates
        unsubscribeFromAvailabilityUpdates = availabilitySignature.subscribe(($signature) => {
           
            if ($signature > 0 && projectId === $page.params.id) {
                reloadAndProcessLayoutData();
            }
        });
    });

    onDestroy(() => {
        if (unsubscribeFromAvailabilityUpdates) {
            unsubscribeFromAvailabilityUpdates();
        }
    });

    // Reactive statement to reload data if projectId changes (e.g., navigating between different project appointment pages)
    $: if ($page.params.id !== projectId && typeof projectId !== 'undefined' && projectId !== '') { // Check projectId is initialized
        console.log('Project ID changed in layout, reloading data.');
        reloadAndProcessLayoutData();
    }
</script>

<div class="bg-white p-4 rounded-lg shadow">
    <h2 class="text-lg font-semibold mb-3">ปฏิทินวันสะดวกสอบของกรรมการทุกคน</h2>
    <Calendarhorizontal bind:this={showCalendar} isLoading={isLoading} />
</div>

<slot />