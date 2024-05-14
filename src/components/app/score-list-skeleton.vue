<template>
  <div class="score">
    <div class="flex gap-3">
      <div class="hidden md:block">
        <div class="object-cover w-20 h-16 shadow-md rounded-xl skeleton" />
      </div>
      <div class="space-y-2 grow">
        <div class="h-6 skeleton" />

        <div class="h-4 w-96 skeleton" />

        <div class="h-3 w-96 lg:h-4 skeleton map-date" />
      </div>
      <div class="w-32 space-y-2">
        <div class="h-6 skeleton" />
        <div class="w-20 h-4 ms-auto skeleton" />

        <div class="w-20 h-3 lg:h-4 ms-auto skeleton" />
      </div>
      <div class="w-6 me-4 md:w-12 skeleton" />
    </div>
  </div>
</template>

<style lang="postcss">
.score {
  @apply py-2;
}

.score + .score {
  @apply border-t-2 border-gbase-500/20;
}
</style>
