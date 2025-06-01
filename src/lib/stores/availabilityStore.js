import { writable } from 'svelte/store';

/**
 * A simple store to signal when project availability data has been updated.
 * Incrementing the value will trigger subscribers.
 */
export const availabilitySignature = writable(0);

/**
 * Call this function to signal that availability data has changed.
 */
export function triggerAvailabilityUpdate() {
    availabilitySignature.update(n => n + 1);
}