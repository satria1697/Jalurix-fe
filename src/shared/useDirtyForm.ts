import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
export function useDirtyForm(isDirty: () => boolean) {
  let saved = false
  const guard = (event: BeforeUnloadEvent) => { if (!saved && isDirty()) { event.preventDefault(); event.returnValue = '' } }
  onMounted(() => window.addEventListener('beforeunload', guard))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', guard))
  onBeforeRouteLeave(() => saved || !isDirty() || window.confirm('Leave this form? Unsaved changes will be lost.'))
  return { markSaved: () => { saved = true }, resume: () => { saved = false } }
}
