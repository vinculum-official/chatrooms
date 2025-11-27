<script>
  import { posts } from '../lib/stores.js'; // <- import it
  import { browser } from '$app/environment'; // or remove if no alias
  import { auth, db } from '../lib/firebase.js';
  import { user, authLoading } from '../lib/stores.js';
  import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
  import Dialog from './Dialog.svelte';
  import { marked } from "marked";
  import { query, collection, where, getDocs, orderBy, serverTimestamp, addDoc, onSnapshot } from 'firebase/firestore';
  import { onMount } from 'svelte';

  onMount(async () => {
  if (!browser) return;

  await setPersistence(auth, browserLocalPersistence);

  onAuthStateChanged(auth, (u) => {
    user.set(u);
    currentUser = u;
    authLoading.set(false);

    if (u) listenToPosts();
  });
  });

  let currentUser;
  let showDialog = false;
  let dialog;
  let postText;
  let statusMessage = '';

  function openDialog() {
    showDialog = true;
    dialog.showModal();
  }

  async function postDialog() {
    if (postText.trim() === '') return;
    statusMessage = 'Adding document...';
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        text: postText,
        createdAt: serverTimestamp(), // Use serverTimestamp for a reliable creation date
        createdBy: currentUser.displayName
      });
      statusMessage = `Document written with ID: ${docRef.id}`;
      postText = ''; // Clear input after successful submission
    } catch (e) {
      console.error("Error adding document: ", e);
      statusMessage = `Error adding document: ${e.message}`;
    }
    dialog.close();
    showDialog = false;
  }

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

  function listenToPosts() {
    if (!browser) return;

    const q = query(collection(db, "messages"), orderBy("createdAt"));

    onSnapshot(q, (snapshot) => {
      const loadedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      posts.set(loadedPosts);
    });
  }
</script>

<main>
    {#if showDialog}
    <Dialog bind:dialog on:close={() => (showDialog = false)}>
      <p>Write your post below. Markdown is supported, but no images yet.</p>
      <textarea
        bind:value={postText}
        placeholder="Post text here.."
        rows="4"
        cols="30"
        style="margin: 20px auto;"
      ></textarea>
      <br />
      <button on:click={postDialog}>Post</button>
    </Dialog>
    {/if}
  {#if currentUser}
    <h2><span class="font-semibold">Welcome back to <span class="[color:#7757FF]">simpl.</span><span class="[color:#1d1d20]">media</span>, {currentUser.displayName}!</span></h2>
    <br />
      <h2 class="text-2xl">Feed</h2>

  {#if $posts.length === 0}
    <p>No posts yet.</p>
  {/if}

  {#each $posts as post}
    <div class="p-2 border-b">
      <p><strong>{post.createdBy}</strong> • {new Date(post.createdAt?.seconds * 1000).toLocaleString()}</p>
      <p>{@html marked(post.text)}</p>
    </div>
  {/each}
  <button on:click={openDialog}>New Post</button>
  {:else}
  <h2 class="text-2xl">welcome to <span class="font-semibold"><span class="[color:#7757FF]">simpl.</span><span class="[color:#1d1d20]">media</span></span></h2>
  <button on:click={loginWithGoogle}>
    Login with Google
  </button>
  <button on:click={loginWithGitHub}>
    Login with GitHub
  </button>
  <br />
  <p>By creating an account, you confirm that you are 13 years or older, and you agree to our Privacy Policy and TOS.</p>
  <a href="/privacy.html" class="underline text-blue-600">Read our Privacy Policy</a>
  <a href="/tos.html" class="underline text-blue-600">Read our TOS</a>
  {/if}
</main>