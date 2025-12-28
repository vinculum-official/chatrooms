<script>
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase.js';
  import { user } from '$lib/stores.js';
  import { onMount, onDestroy } from 'svelte';
  import { query, collection, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
  import { marked } from 'marked';

  export let params;
  const roomCode = params.code;

  let currentUser = null;
  let authReady = false;

  const unsubscribeUser = user.subscribe(u => {
    if (u === undefined) return; // auth still loading
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

    await addDoc(collection(db, `rooms/${roomCode}/messages`), {
      text: postText,
      createdAt: serverTimestamp(),
      createdBy: currentUser.displayName ?? 'Anonymous'
    });

    postText = '';
  }

  onMount(listenToPosts);

  onDestroy(() => {
    unsubscribePosts?.();
    unsubscribeUser();
  });
</script>

<svelte:head>
  <title>chatrooms – {roomCode}</title>
</svelte:head>

<!-- HEADER -->
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

<!-- STATUS -->
{#if statusMessage}
  <div class="status-message">{statusMessage}</div>
{/if}

<!-- CHAT FEED -->
<div class="chat-feed">
  {#if posts.length === 0}
    <p>No messages yet</p>
  {/if}

  {#each posts as post}
    <div class="chat-message">
      <div style="font-size: 0.8rem; color: #555;">
        {post.createdBy}
        @
        {post.createdAt?.seconds
          ? new Date(post.createdAt.seconds * 1000).toLocaleTimeString()
          : 'Just now'}
      </div>
      <div>{@html marked(post.text)}</div>
    </div>
  {/each}
</div>

<!-- INPUT -->
{#if authReady && currentUser}
  <div class="chat-input">
    <input
      bind:value={postText}
      placeholder="Type your message…"
      on:keydown={(e) => e.key === 'Enter' && postMessage()}
    />
    <button on:click={postMessage}>Send</button>
  </div>
{:else if authReady}
  <p class="guest-hint">Sign in to send messages.</p>
{/if}

<footer>
  <nav>
    <center>
      <span>/</span>
      <a href="/">home</a>
      <span>/</span>
      <a href="/cs.html">customer service</a>
      <span>/</span>
      <a href="/tos.html">terms of service</a>
      <span>/</span>
      <a href="/privacy.html">privacy policy</a>
    </center>
  </nav>
</footer>
