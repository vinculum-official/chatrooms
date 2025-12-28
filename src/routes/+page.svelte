<script>
  import { posts } from '../lib/stores.js'; // <- import it
  import { browser } from '$app/environment'; // or remove if no alias
  import { auth, db } from '../lib/firebase.js';
  import { user, authLoading } from '../lib/stores.js';
  import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
  import Dialog from './Dialog.svelte';
  import { marked } from "marked";
  import { query, collection, where, getDocs, doc, getDoc, setDoc, orderBy, serverTimestamp, addDoc, onSnapshot } from 'firebase/firestore';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(async () => {
  if (!browser) return;

  await setPersistence(auth, browserLocalPersistence);

  onAuthStateChanged(auth, (u) => {
    user.set(u);
    currentUser = u;
    authLoading.set(false);

    //  if (u) listenToPosts();
  });
  });

  let currentUser;
  let showDialog = false;
  let dialog;
  let postText;
  let statusMessage = '';
  let joinCode = '';
  let errorMessage = '';


  async function loginWithGoogle() {
    if (!browser) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("loginWithGoogle error:", e);
    }
  }

  async function loginWithGitHub() {
  if (!browser) return;
  const provider = new GithubAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error("loginWithGitHub error:", e);
  }
}

function generateRoomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function createRoom(currentUser) {
  let code;
  let exists = true;

  while (exists) {
    code = generateRoomCode();
    const ref = doc(db, 'rooms', code);
    const snap = await getDoc(ref);
    exists = snap.exists();
  }

  await setDoc(doc(db, 'rooms', code), {
    createdAt: serverTimestamp(),
    createdBy: currentUser.uid,
    isActive: true
  });

  return code;
}

async function handleCreateRoom() {
  if (!currentUser) return;

  try {
    const code = await createRoom(currentUser);
    goto(`/room/${code}`);
  } catch (e) {
    console.error(e);
    errorMessage = 'Failed to create room';
  }
}

async function handleJoinRoom() {
  if (!currentUser) return;

  const code = joinCode.trim().toUpperCase();
  if (code.length !== 8) {
    errorMessage = 'Room code must be 8 characters';
    return;
  }

  try {
    const ref = doc(db, 'rooms', code);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      errorMessage = 'Room not found';
      return;
    }

    goto(`/room/${code}`);
  } catch (e) {
    console.error(e);
    errorMessage = 'Failed to join room';
  }
}

</script>

<svelte:head>
  <title>chatrooms</title>
</svelte:head>


<main>
{#if currentUser}
  <center>
    <h2 class="font-semibold text-2xl">
      Welcome back to
      <span class="[color:#7757FF]">chat</span><span class="[color:#1d1d20]">rooms</span>,
      {currentUser.displayName}!
    </h2>

    <br />

    <h2 class="text-xl">Create a room</h2>
    <button on:click={handleCreateRoom}>
      Generate Room Code
    </button>

    <br /><br />

    <h2 class="text-xl">Join a room</h2>
    <input
      type="text"
      id="a"
      maxlength="8"
      bind:value={joinCode}
      placeholder="Enter 8-char code"
      style="text-transform: uppercase; padding: 0.5rem;"
    />

    <br />
    <button on:click={handleJoinRoom}>
      Join Room
    </button>

    {#if errorMessage}
      <p style="color: red; margin-top: 1rem;">{errorMessage}</p>
    {/if}
<br /><br />

   / <a href="/privacy.html" class="underline text-blue-600">Read our Privacy Policy</a> / 
  <a href="/tos.html" class="underline text-blue-600">Read our TOS</a> / 
  <a href="/cs.html" class="underline text-blue-600">Customer Support</a> / 

<p>if you want to report anything, please email me at: <a href="mailto:m4.sh@tuta.io">m4.sh@tuta.io (mailto link)</a></p>
  </center>
{:else}

  <h2 class="text-2xl">welcome to <span class="font-semibold"><span class="[color:#7757FF]">chat</span><span class="[color:#1d1d20]">rooms</span></span></h2>
  <button on:click={loginWithGoogle}>
    Login with Google
  </button>
  <button on:click={loginWithGitHub}>
    Login with GitHub
  </button>
  <br />
  <p>By creating an account, you confirm that you are 13 years or older, and you agree to our Privacy Policy and TOS.</p>
   / <a href="/privacy.html" class="underline text-blue-600">Read our Privacy Policy</a> / 
  <a href="/tos.html" class="underline text-blue-600">Read our TOS</a> / 
  <a href="/cs.html" class="underline text-blue-600">Customer Support</a> / 
  {/if}
</main>
