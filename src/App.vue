<script setup>
// Game logic will go here
</script>

<template>
  <div class="game-container">
    <header>
      <h1>Freeordle</h1>
    </header>
    
    <main>
      <!-- Game Board will go here -->
    </main>
  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

header {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px; /* Standard header height */
  border-bottom: 1px solid var(--color-tone-4);
}

h1 {
  font-size: 24px; /* Specific size for header title */
  margin: 0;
  border: none; /* Override global h1 border */
  letter-spacing: 0.1rem;
}

main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
