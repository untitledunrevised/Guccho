<script lang="ts" setup>
import { useSession } from '~/store/session'

const app = useNuxtApp()
const session = useSession()
useHead({
  title: () => app.$i18n.t(localeKey.title['admin-panel'].__path__),
  titleTemplate: title => `${title} - ${app.$i18n.t(localeKey.server.name.__path__)}`,
})
</script>

<template>
  <div class="join drop-shadow-lg">
    <t-nuxt-link-button
      :to="{
        name: 'article-edit',
      }"
      class="join-item"
    >
      {{ $t(localeKey.title.articles.__path__) }}
    </t-nuxt-link-button>
    <t-nuxt-link-button
      v-if="session.role.admin"
      :to="{
        name: 'admin-logs',
      }"
      class="join-item"
    >
      {{ $t(localeKey.title.logs.__path__) }}
    </t-nuxt-link-button>
    <t-nuxt-link-button
      :to="{
        name: 'admin-users',
      }"
      class="join-item"
    >
      {{ $t(localeKey.title['user-management'].__path__) }}
    </t-nuxt-link-button>
  </div>
</template>
