import { defineComponent } from 'vue'
import type { PropType } from 'vue'
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
    return () =>
      props.node ? (
        <div class="cowin-node-dialog-mask" onClick={props.onClose}>
          <section
            class="cowin-node-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <header class="cowin-node-dialog-header">
              <div>
                <h2>{props.node.definition.label}</h2>
                <p>{props.node.id}</p>
              </div>
              <button type="button" onClick={props.onClose}>
                ×
              </button>
            </header>

            <div class="cowin-node-dialog-body">
              <NodeConfigPanel
                node={props.node}
                availableVariables={props.availableVariables}
                onUpdateConfig={props.onUpdateConfig}
              />
            </div>
          </section>
        </div>
      ) : null
  }
})
