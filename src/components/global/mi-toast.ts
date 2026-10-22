import { useToast } from 'vue-toast-notification'

class MiToast {
  toast = useToast()
  failed(message: string) {
    this.toast.error(message)
  }
}

export default MiToast
