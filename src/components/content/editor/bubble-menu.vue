<script setup lang="ts">
import { BubbleMenu, type Editor } from '@tiptap/vue-3'
import remixiconUrl from 'remixicon/fonts/remixicon.symbol.svg'

const props = defineProps<{
  editor: Editor
}>()
const link = shallowRef('')

function prevLink() {
  const _link = props.editor.getAttributes('link')
  link.value = _link.href
}

function setLink() {
  const url = link.value
  // empty
  if (!url) {
    props.editor.chain().focus().extendMarkRange('link').unsetLink().run()

    return
  }

  // update link
  props.editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run()

  link.value = ''
}
</script>

<template>
  <BubbleMenu
    class="bubble-menu"
    :tippy-options="{ duration: 100 }"
    :editor="editor"
  >
    <div class="dropdown">
      <div role="button" class="h-full" tabindex="0" @click="prevLink">
        <svg class="w-5 h-5 remix">
          <use :xlink:href="`${remixiconUrl}#ri-link`" fill="white" />
        </svg>
      </div>
      <div class="mt-2 dropdown-content menu rounded-xl bg-base-200">
        <span>URL</span>
        <div class="join">
          <input
            id="url"
            v-model="link"
            type="url"
            class="shadow-sm join-item input input-shadow input-sm"
          >
          <button
            class="join-item btn btn-shadow btn-sm btn-success"
            @click="setLink()"
          >
            apply
          </button>
        </div>
      </div>
    </div>
  </BubbleMenu>
</template>

<style lang="postcss">
.bubble-menu {
  display: flex;
  background-color: #0d0d0d;
  padding: 0.2rem;
  border-radius: 0.5rem;

  div[role="button"] {
    border: none;
    background: none;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0 0.2rem;
    opacity: 0.6;

    &:hover,
    &.is-active {
      opacity: 1;
    }
  }
}
</style>
