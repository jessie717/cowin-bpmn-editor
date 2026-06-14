import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { DefaultNodeConfigPanel } from './DefaultNodeConfigPanel'
import { FunctionConfigPanel } from './FunctionConfigPanel'
import { ManualStartConfigPanel } from './ManualStartConfigPanel'
import type { NodeConfigPanelProps } from './types'

export const NodeConfigPanel = defineComponent({
  name: 'NodeConfigPanel',
  props: {
    node: {
      type: Object as PropType<NodeConfigPanelProps['node']>,
      required: true
    },
    availableVariables: {
      type: Array as PropType<NodeConfigPanelProps['availableVariables']>,
      default: () => []
    },
    onUpdateConfig: {
      type: Function as PropType<NodeConfigPanelProps['onUpdateConfig']>,
      required: true
    }
  },
  setup(props) {
    return () => {
      if (props.node.definition.type === 'manual-start') {
        return (
          <ManualStartConfigPanel
            node={props.node}
            onUpdateConfig={props.onUpdateConfig}
          />
        )
      }

      if (props.node.definition.type === 'function') {
        return (
          <FunctionConfigPanel
            node={props.node}
            availableVariables={props.availableVariables}
            onUpdateConfig={props.onUpdateConfig}
          />
        )
      }

      return (
        <DefaultNodeConfigPanel
          node={props.node}
          onUpdateConfig={props.onUpdateConfig}
        />
      )
    }
  }
})
