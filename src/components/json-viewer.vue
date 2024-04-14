<script lang="ts" setup>
import JsonViewer from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

defineProps<{
  value: any
}>()
</script>

<template>
  <JsonViewer :data="value" class="rounded-lg border-base bg-base-100 border p-4" :deep="1" />
</template>
