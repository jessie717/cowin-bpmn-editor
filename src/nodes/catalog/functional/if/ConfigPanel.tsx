import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import { ElButton, ElInput } from '../../../../element-plus'
import { ExpressionHelper } from '../../../../editor/components/ExpressionHelper'
import { InputContext } from '../../../../editor/components/InputContext'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

const IF_CONFIG_KEYS = {
  expression: 'ifExpression'
}

export const IfConfigPanel = defineComponent({
  name: 'IfConfigPanel',
  props: {
    node: {
      type: Object as PropType<NodeConfigPanelProps['node']>,
      required: true
    },
    availableVariables: {
      type: Array as PropType<NodeConfigPanelProps['availableVariables']>,
      default: () => []
    },
    onClose: {
      type: Function as PropType<NodeConfigPanelProps['onClose']>,
      required: true
    },
    onUpdateConfig: {
      type: Function as PropType<NodeConfigPanelProps['onUpdateConfig']>,
      required: true
    }
  },
  setup(props) {
    const selectedContext = ref('')
    const selectedExpression = ref('')
    const expression = ref(props.node.config[IF_CONFIG_KEYS.expression] || '')

    function updateExpression(value: string) {
      expression.value = value
    }

    function applyConfig() {
      props.onUpdateConfig(IF_CONFIG_KEYS.expression, expression.value)
      props.onClose()
    }

    return () => (
      <div class="cowin-parameter-section">
        <div class="cowin-function-helper-row">
          <InputContext
            modelValue={selectedContext.value}
            upstreamVariables={props.availableVariables}
            onChange={(value) => {
              selectedContext.value = value
              updateExpression(value)
            }}
          />
          <ExpressionHelper
            modelValue={selectedExpression.value}
            onChange={(value) => {
              selectedExpression.value = value
              updateExpression(value)
            }}
          />
        </div>

        <div class="cowin-parameter-form">
          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Expression</span>
            <ElInput
              class="cowin-node-dialog-control"
              modelValue={expression.value}
              onInput={(value: string | number) => {
                updateExpression(String(value ?? ''))
              }}
            />
          </label>
        </div>

        <div class="cowin-parameter-actions">
          <ElButton nativeType="button" onClick={props.onClose}>
            Cancel
          </ElButton>
          <ElButton nativeType="button" type="primary" onClick={applyConfig}>
            Apply
          </ElButton>
        </div>
      </div>
    )
  }
})
