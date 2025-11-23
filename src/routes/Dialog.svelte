<script>
  import { onMount, createEventDispatcher } from 'svelte';
  export let dialog;
  const dispatch = createEventDispatcher();

  onMount(() => {
    dialog.showModal();
  });

  function handleClose() {
    dispatch('close');
  }
</script>

<dialog bind:this={dialog} on:close={handleClose}>
  <slot />
</dialog>
