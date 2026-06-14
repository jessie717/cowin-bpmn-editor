import { defineComponent } from 'vue'
import { BpmnEditor } from '../editor/BpmnEditor'

export const HomePage = defineComponent({
  name: 'HomePage',
  setup() {
    return () => <BpmnEditor />
  }
})
