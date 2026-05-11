<script>
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase.js';
  import { user } from '$lib/stores.js';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { query, collection, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

  export let params;
  let roomCode = params.code;

  let currentUser = null;
  let authReady = false;

  const unsubscribeUser = user.subscribe(u => {
    if (u === undefined) return;
    currentUser = u;
    authReady = true;
  });

  let posts = [];
  let postText = '';
  let statusMessage = '';
  let unsubscribePosts;

  function listenToPosts() {
    if (!browser) return;

    const q = query(
      collection(db, `rooms/${roomCode}/messages`),
      orderBy('createdAt', 'asc')
    );

    unsubscribePosts = onSnapshot(q, (snapshot) => {
      posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  async function postMessage() {
    statusMessage = '';

    if (!postText.trim()) return;

    if (!currentUser) {
      statusMessage = 'You must be signed in to send messages.';
      return;
    }

    try {
      await addDoc(collection(db, `rooms/${roomCode}/messages`), {
        text: postText,
        createdAt: serverTimestamp(),
        createdBy: currentUser.displayName ?? 'Anonymous'
      });

      postText = '';
    } catch (e) {
      console.error(e);
      statusMessage = e.message;
    }
  }

  onMount(() => {
    if (!browser) return;

    const allowedRoom = sessionStorage.getItem('lastRoomCode');

    if (allowedRoom !== roomCode) {
      sessionStorage.setItem('roomRedirectCode', roomCode);
      goto(resolve(`/?code=${roomCode}`), { replaceState: true });
      return;
    }

    listenToPosts();
  });

  onDestroy(() => {
    unsubscribePosts?.();
    unsubscribeUser();
  });
</script>

<svelte:head>
  <title>chatrooms – {roomCode}</title>
</svelte:head>

<div class="chat-header">
  {#if !authReady}
    <div>Checking session…</div>
  {:else if currentUser}
    <div>{currentUser.displayName}</div>
  {:else}
    <div>Guest</div>
  {/if}

  <div>Room: {roomCode}</div>
</div>

{#if statusMessage}
  <div class="status-message">{statusMessage}</div>
{/if}

<div class="chat-feed">
  {#if posts.length === 0}
    <p>No messages yet</p>
  {/if}

  {#each posts as post (post.id)}
    <div class="chat-message">
      <div style="font-size: 0.8rem; color: #555;">
        {post.createdBy}
        @
        {post.createdAt?.seconds
          ? new Date(post.createdAt.seconds * 1000).toLocaleTimeString()
          : 'Just now'}
      </div>

      <div>{post.text}</div>
    </div>
  {/each}
</div>

{#if authReady && currentUser}
  <div class="chat-input">
    <input
      bind:value={postText}
      placeholder="Type your message..."
      on:keydown={(e) => e.key === 'Enter' && postMessage()}
    />
    <button on:click={postMessage}>Send</button>
  </div>
{:else if authReady}
  <p>Sign in to send messages.</p>
{/if}

<footer>
  <nav>
    <center>
      <span>/</span>
      <a href={resolve('/')}>home</a>
      <span>/</span>
      <a href={resolve('/cs.html')}>customer service</a>
      <span>/</span>
      <a href={resolve('/tos.html')}>terms of service</a>
      <span>/</span>
      <a href={resolve('/privacy.html')}>privacy policy</a>
    </center>
  </nav>
</footer>