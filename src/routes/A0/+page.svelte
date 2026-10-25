<script>
    import { base } from '$app/paths';

    let maxClick = $state(2);
    let cnt = $state(2);

    function onClick() {
      if (cnt > 0) {
        cnt -= 1;
      }
    }
</script>

<svelte:head>
  <title>Kun Chen's VIS Site</title>
</svelte:head>

<h1>Kun Chen's VIS Site</h1>
<img width="200" src="{base}/IMG_0457.jpeg" alt="A brown cat looking at the camera" />
<div>
  You can click up to
  <select
    aria-label="Maximum number of clicks"
    bind:value={maxClick}
    onchange={(event) => (cnt = Number(event.currentTarget.value))}>
    {#each [2, 4, 6] as optionNum}
      <option value={optionNum}>
        {optionNum}
      </option>
    {/each}
  </select>
  times
</div>
<button onclick={onClick}> Click Me </button>

{#if cnt > 0}
  <p id="info">Remaining Number of Clicks: {cnt}</p>
{:else}
  <p>No more clicks allowed</p>
{/if}

<style>
  :global(body) {
    font-family: Arial, Helvetica, sans-serif;
  }
  button {
    background-color: #44aa66;
    color: white;
    font-size: xx-large;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }
</style>
