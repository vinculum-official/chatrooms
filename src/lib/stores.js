import { writable } from 'svelte/store';
import { auth } from '$lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const user = writable(undefined); 
// undefined = auth loading
// null = logged out
// object = logged in

export const authReady = writable(false);

onAuthStateChanged(auth, (u) => {
  user.set(u ?? null);
  authReady.set(true);
});
