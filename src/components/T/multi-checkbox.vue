<script setup lang="ts" generic="T extends string | number">
import { match } from 'switch-pattern'
import type { HTMLAttributes } from 'vue'

interface Option {
  label: string | number
  value: T
  disabled?: boolean
  attrs?: HTMLAttributes
}

defineProps<{
  options: Option[]
  size?: 'xs' | 'sm' | 'lg'
}>()

const modelValue = defineModel<T[]>('modelValue')

function toggle(value: T, checked: boolean) {
  const _v = [modelValue.value!.includes(value), checked] as const

  const { exact, patterns: m } = match(_v)

  switch (m) {
    case (exact([true, true])):
    case (exact([false, false])):
    {
      return
    }

    case (exact([false, true])): {
      modelValue.value?.push(value)
      return
    }
    case (exact([true, false])): {
      modelValue.value?.splice(modelValue.value.findIndex(i => i === value), 1)
    }
  }
}
// checkbox-xs checkbox-md checkbox-lg
</script>

<template>
  <div>
    <div
      v-for="opt in options"
      :key="opt.value"
      class="form-control"
    >
      <label class="label cursor-pointer justify-start gap-4">
        <input
          class="checkbox"
          :class="{
            [`checkbox-${size}`]: size,
          }"
          type="checkbox"
          v-bind="opt.attrs"
          :checked="modelValue?.includes(opt.value)"
          @change="ev => toggle(opt.value, (ev.target as any).checked)"
        >
        <span class="label-text text-nowrap">{{ opt.label }}</span>
      </label>
    </div>
  </div>
</template>
