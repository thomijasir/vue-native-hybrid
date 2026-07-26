import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { NotFoundState } from './NotFound.interface'

export function useNotFoundController() {
  const router = useRouter()
  const code = ref<NotFoundState['code']>('404')
  const message = ref<NotFoundState['message']>('Page not found')

  function goBack() {
    // Prefer browser history when available, otherwise fall back to home.
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/home')
    }
  }

  return { code, message, goBack }
}
