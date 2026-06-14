import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { renderDefaultConfigField } from './helpers'
import type { NodeConfigPanelProps } from './types'

export const DefaultNodeConfigPanel = defineComponent({
  name: 'DefaultNodeConfigPanel',
  props: {
    node: {
      type: Object as PropType<NodeConfigPanelProps['node']>,
      required: true
    },
    onUpdateConfig: {
      type: Function as PropType<NodeConfigPanelProps['onUpdateConfig']>,
      required: true
    }
  },
  setup(props) {
    return () =>
      props.node.definition.propertiesSchema.length ? (
        props.node.definition.propertiesSchema.map((field) =>
          renderDefaultConfigField({
            field,
            value: props.node.config[field.key] ?? '',
            onUpdateConfig: props.onUpdateConfig
          })
        )
      ) : (
        <p class="cowin-node-dialog-empty">当前节点暂无可配置属性</p>
      )
  }
})
