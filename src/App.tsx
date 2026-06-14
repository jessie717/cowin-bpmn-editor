import { defineComponent } from 'vue'
import { HomePage } from './pages/HomePage'

export default defineComponent({
  name: 'App',
  setup() {
    return () => <HomePage />
  }
})
