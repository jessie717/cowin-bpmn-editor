import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import {
  ElButton,
  ElInput,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect
} from '../../../../element-plus'
import { ExpressionHelper } from '../../../../editor/components/ExpressionHelper'
import { InputContext } from '../../../../editor/components/InputContext'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

const LOG_CONFIG_KEYS = {
  category: 'logCategory',
  level: 'logLevel',
  executionMode: 'logExecutionMode',
  content: 'logContent'
}

const CATEGORY_OPTIONS = ['Business', 'System', 'Audit', 'Debug']
const LEVEL_OPTIONS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']
const EXECUTION_MODE_OPTIONS = ['sync', 'async']

export const LogConfigPanel = defineComponent({
  name: 'LogConfigPanel',
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
    const category = ref(
      props.node.config[LOG_CONFIG_KEYS.category] || CATEGORY_OPTIONS[0]
    )
    const level = ref(props.node.config[LOG_CONFIG_KEYS.level] || 'INFO')
    const executionMode = ref(
      props.node.config[LOG_CONFIG_KEYS.executionMode] ||
        EXECUTION_MODE_OPTIONS[0]
    )
    const content = ref(props.node.config[LOG_CONFIG_KEYS.content] || '')

    function applyConfig() {
      props.onUpdateConfig(LOG_CONFIG_KEYS.category, category.value)
      props.onUpdateConfig(LOG_CONFIG_KEYS.level, level.value)
      props.onUpdateConfig(LOG_CONFIG_KEYS.executionMode, executionMode.value)
      props.onUpdateConfig(LOG_CONFIG_KEYS.content, content.value)
      props.onClose()
    }

    function updateContent(value: string) {
      content.value = value
    }

    return () => (
      <div class="cowin-parameter-section">
        <div class="cowin-function-helper-row">
          <InputContext
            modelValue={selectedContext.value}
            upstreamVariables={props.availableVariables}
            onChange={(value) => {
              selectedContext.value = value
              updateContent(value)
            }}
          />
          <ExpressionHelper
            modelValue={selectedExpression.value}
            onChange={(value) => {
              selectedExpression.value = value
              updateContent(value)
            }}
          />
        </div>

        <div class="cowin-parameter-form">
          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Category</span>
            <ElSelect
              class="cowin-node-dialog-control"
              modelValue={category.value}
              onChange={(value: string | number) => {
                category.value = String(value)
              }}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <ElOption key={option} label={option} value={option} />
              ))}
            </ElSelect>
          </label>

          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Level</span>
            <ElSelect
              class="cowin-node-dialog-control"
              modelValue={level.value}
              onChange={(value: string | number) => {
                level.value = String(value)
              }}
            >
              {LEVEL_OPTIONS.map((option) => (
                <ElOption key={option} label={option} value={option} />
              ))}
            </ElSelect>
          </label>

          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Execution Mode</span>
            <ElRadioGroup
              modelValue={executionMode.value}
              onChange={(value: unknown) => {
                executionMode.value = String(value)
              }}
            >
              {EXECUTION_MODE_OPTIONS.map((option) => (
                <ElRadio key={option} value={option}>
                  {option}
                </ElRadio>
              ))}
            </ElRadioGroup>
          </label>

          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Content</span>
            <ElInput
              class="cowin-node-dialog-control"
              modelValue={content.value}
              onInput={(value: string | number) => {
                updateContent(String(value ?? ''))
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
