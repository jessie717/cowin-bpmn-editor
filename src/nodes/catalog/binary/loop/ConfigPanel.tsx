import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import { ElButton, ElRadio, ElRadioGroup } from '../../../../element-plus'
import { ExpressionHelper } from '../../../../editor/components/ExpressionHelper'
import {
  ExpressionEditor,
  type ExpressionInsert
} from '../../../../editor/components/ExpressionEditor'
import { InputContext } from '../../../../editor/components/InputContext'
import { createExpressionSymbols } from '../../../../editor/expression'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

const LOOP_CONFIG_KEYS = {
  type: 'loopType',
  expression: 'loopExpression'
}

const LOOP_TYPE_OPTIONS = [
  {
    value: 'for-each',
    label: 'Iterate over each item',
    expectedType: 'Array'
  },
  {
    value: 'while',
    label: 'When the expression is true',
    expectedType: 'Boolean'
  },
  {
    value: 'fixed',
    label: 'Fixed number of times',
    expectedType: 'Number'
  }
]

export const LoopConfigPanel = defineComponent({
  name: 'LoopConfigPanel',
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
    const insertExpression = ref<ExpressionInsert>()
    const loopType = ref(
      props.node.config[LOOP_CONFIG_KEYS.type] || LOOP_TYPE_OPTIONS[0].value
    )
    const expression = ref(props.node.config[LOOP_CONFIG_KEYS.expression] || '')
    const expressionSymbols = computed(() =>
      createExpressionSymbols(props.availableVariables)
    )
    const expectedExpressionType = computed(
      () =>
        LOOP_TYPE_OPTIONS.find((option) => option.value === loopType.value)
          ?.expectedType ?? ''
    )

    function applyConfig() {
      props.onUpdateConfig(LOOP_CONFIG_KEYS.type, loopType.value)
      props.onUpdateConfig(LOOP_CONFIG_KEYS.expression, expression.value)
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
              insertExpression.value?.(value)
            }}
          />
          <ExpressionHelper
            modelValue={selectedExpression.value}
            onChange={(value) => {
              selectedExpression.value = value
              insertExpression.value?.(value)
            }}
          />
        </div>

        <div class="cowin-parameter-title-row">
          <h3>Settings</h3>
        </div>
        <div class="cowin-parameter-form">
          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Loop Type</span>
            <ElRadioGroup
              modelValue={loopType.value}
              onChange={(value: unknown) => {
                loopType.value = String(value)
              }}
            >
              {LOOP_TYPE_OPTIONS.map((option) => (
                <ElRadio key={option.value} value={option.value}>
                  {option.label}
                </ElRadio>
              ))}
            </ElRadioGroup>
          </label>

          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Expression</span>
            <ExpressionEditor
              modelValue={expression.value}
              symbols={expressionSymbols.value}
              expectedType={expectedExpressionType.value}
              onChange={(value) => {
                expression.value = value
              }}
              onReady={(insert) => {
                insertExpression.value = insert
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
