import { toast } from "@zerodevx/svelte-toast"; // Import toast


export function successToast(message){
    toast.push(message, {
        theme: {
          "--toastBackground": "#4CAF50", // Green
          "--toastBarBackground": "#388E3C",
        },
      });
}

export function warningToast(message){
    toast.push(message, {
        theme: {
          "--toastBackground": "#f1c40f",
          "--toastBarBackground": "#d4ac0d",
        },pausable: true 
      });
}

export function dangerToast(message){
    toast.push(message, {
        theme: {
          "--toastBackground": "#e74c3c",
          "--toastBarBackground": "#cb4335",
        }, pausable: true 
      });
}