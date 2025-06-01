
// Helper function to convert various timestamp formats to Date objects
export function convertToDate(timestamp) {
    if (!timestamp) return null;
    
    // Handle Firestore Timestamp object
    if (timestamp && typeof timestamp === 'object' && timestamp._seconds !== undefined) {
        // Convert Firestore timestamp to JavaScript Date
        return new Date(timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000));
    }
    
    // Handle string timestamps (ISO format)
    if (typeof timestamp === 'string') {
        return new Date(timestamp);
    }
    
    // Handle Date objects (already converted)
    if (timestamp instanceof Date) {
        return timestamp;
    }
    
    // Handle Unix timestamp (number)
    if (typeof timestamp === 'number') {
        return new Date(timestamp);
    }
    
    console.warn('Unknown timestamp format:', timestamp);
    return null;
}