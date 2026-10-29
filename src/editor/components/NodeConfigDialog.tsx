import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { ElDialog } from '../../element-plus'
import type { SelectedNode } from '../types'
import type { WorkflowVariable } from '../variables'
import { NodeConfigPanel } from './node-config/NodeConfigPanel'

export const NodeConfigDialog = defineComponent({
  name: 'NodeConfigDialog',
  props: {
    node: {
      type: Object as PropType<SelectedNode | null>,
      default: null
    },
    availableVariables: {
      type: Array as PropType<WorkflowVariable[]>,
      default: () => []
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    onUpdateConfig: {
      type: Function as PropType<(key: string, value: string) => void>,
      required: true
    }
  },
  setup(props) {
    return () => {
      const node = props.node
      const dialogWidth = 'min(760px, calc(100vw - 48px))'

      return node ? (
        <ElDialog
          class="cowin-node-dialog"
          modelValue={Boolean(node)}
          width={dialogWidth}
          destroyOnClose
          closeOnClickModal
          onClose={props.onClose}
          v-slots={{
            header: () => (
              <div>
                <h2>{node.definition.label}</h2>
                {/* <p>{node.id}</p> */}
              </div>
            )
          }}
        >
          <NodeConfigPanel
            node={node}
            availableVariables={props.availableVariables}
            onClose={props.onClose}
            onUpdateConfig={props.onUpdateConfig}
          />
        </ElDialog>
      ) : null
    }
  }
})
