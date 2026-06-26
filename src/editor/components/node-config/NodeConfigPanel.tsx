import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { getNodeModule } from '../../../nodes/registry'
import { DefaultNodeConfigPanel } from './DefaultNodeConfigPanel'
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
      const ConfigPanel = getNodeModule(
        props.node.definition.type
      )?.ConfigPanel as any

      if (ConfigPanel) {
        return (
          <ConfigPanel
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
