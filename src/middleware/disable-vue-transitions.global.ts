export default defineNuxtRouteMiddleware((to) => {
  if (!document?.startViewTransition) {
    return
  }

  // Disable built-in Vue transitions
  to.meta.pageTransition = false
  to.meta.layoutTransition = false
})
