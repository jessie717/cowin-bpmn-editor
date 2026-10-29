import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import {
  VARIABLE_TYPES,
  createParameterId,
  parseParameterList,
  stringifyParameterList
} from '../../../shared/config'
import {
  ElButton,
  ElDialog,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn
} from '../../../../element-plus'
import { ExpressionHelper } from '../../../../editor/components/ExpressionHelper'
import {
  ExpressionEditor,
  type ExpressionInsert
} from '../../../../editor/components/ExpressionEditor'
import { InputContext } from '../../../../editor/components/InputContext'
import { createExpressionSymbols } from '../../../../editor/expression'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'
import {
  RUN_APF_RULE_CONFIG_KEYS,
  RUN_APF_RULE_CONNECTORS,
  RUN_APF_RULE_FIXED_INPUT_NAME,
  RUN_APF_RULE_SERVICE_HARD_CODED,
  getRunApfRuleService,
  type RunApfRuleInputArgument
} from './config'

const TABLE_TYPE_ICON = (
  <svg
    class="cowin-output-argument-icon"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <rect x="1.5" y="2.5" width="11" height="9" rx="1" stroke="#0878be" />
    <path d="M1.5 5.5h11M5.5 5.5v6" stroke="#0878be" />
  </svg>
)

type FxTarget = 'value' | 'timeout'

export const RunApfRuleConfigPanel = defineComponent({
  name: 'RunApfRuleConfigPanel',
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
    const config = props.node.config
    const service = getRunApfRuleService(RUN_APF_RULE_SERVICE_HARD_CODED)

    const savedConnector = config[RUN_APF_RULE_CONFIG_KEYS.connector]
    const selectedConnector = ref(
      RUN_APF_RULE_CONNECTORS.includes(savedConnector)
        ? savedConnector
        : RUN_APF_RULE_CONNECTORS[0] || ''
    )
    const savedInputArguments = parseParameterList<RunApfRuleInputArgument>(
      config[RUN_APF_RULE_CONFIG_KEYS.inputArguments]
    )
    const draftInputArguments = ref(
      savedInputArguments.length
        ? savedInputArguments
        : [
            {
              id: createParameterId('run-apf-rule-input'),
              name: RUN_APF_RULE_FIXED_INPUT_NAME,
              type: VARIABLE_TYPES[0],
              value: ''
            }
          ]
    )
    const timeout = ref(config[RUN_APF_RULE_CONFIG_KEYS.timeout] || '')

    const fxDialogOpen = ref(false)
    const fxTarget = ref<FxTarget>('value')
    const fxArgumentId = ref('')
    const fxExpression = ref('')
    const selectedContext = ref('')
    const selectedExpression = ref('')
    const insertExpression = ref<ExpressionInsert>()
    const expressionSymbols = computed(() =>
      createExpressionSymbols(props.availableVariables)
    )

    function updateArgument(id: string, patch: Partial<RunApfRuleInputArgument>) {
      draftInputArguments.value = draftInputArguments.value.map((argument) =>
        argument.id === id ? { ...argument, ...patch } : argument
      )
    }

    function addArgument() {
      draftInputArguments.value = [
        ...draftInputArguments.value,
        {
          id: createParameterId('run-apf-rule-input'),
          name: '',
          type: VARIABLE_TYPES[0],
          value: ''
        }
      ]
    }

    function removeArgument(id: string) {
      const index = draftInputArguments.value.findIndex(
        (argument) => argument.id === id
      )

      // 第一行为固定参数，不可删除
      if (index <= 0) {
        return
      }

      draftInputArguments.value = draftInputArguments.value.filter(
        (argument) => argument.id !== id
      )
    }

    function openFxDialog(target: FxTarget, argumentId = '') {
      fxTarget.value = target
      fxArgumentId.value = argumentId
      selectedContext.value = ''
      selectedExpression.value = ''
      fxExpression.value =
        target === 'timeout'
          ? timeout.value
          : (draftInputArguments.value.find(
              (argument) => argument.id === argumentId
            )?.value ?? '')
      fxDialogOpen.value = true
    }

    function closeFxDialog() {
      fxDialogOpen.value = false
      fxArgumentId.value = ''
    }

    function submitFxDialog() {
      if (fxTarget.value === 'timeout') {
        timeout.value = fxExpression.value
      } else if (fxArgumentId.value) {
        updateArgument(fxArgumentId.value, { value: fxExpression.value })
      }

      closeFxDialog()
    }

    function applyConfig() {
      props.onUpdateConfig(
        RUN_APF_RULE_CONFIG_KEYS.connector,
        selectedConnector.value
      )
      props.onUpdateConfig(
        RUN_APF_RULE_CONFIG_KEYS.serviceName,
        RUN_APF_RULE_SERVICE_HARD_CODED
      )
      props.onUpdateConfig(
        RUN_APF_RULE_CONFIG_KEYS.inputArguments,
        stringifyParameterList(draftInputArguments.value)
      )
      props.onUpdateConfig(RUN_APF_RULE_CONFIG_KEYS.timeout, timeout.value)
      props.onClose()
    }

    return () => {
      return (
        <div class="cowin-parameter-section cowin-run-apf-rule-config">
          <div class="cowin-parameter-title-row">
            <h3>Socket Connector</h3>
          </div>
          <div class="cowin-parameter-form">
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>
                <strong>*</strong> Connector Address
              </span>
              <div class="cowin-inline-control">
                <ElSelect
                  class="cowin-node-dialog-control"
                  modelValue={selectedConnector.value}
                  onChange={(value: string | number) => {
                    selectedConnector.value = String(value)
                  }}
                >
                  {RUN_APF_RULE_CONNECTORS.map((connector) => (
                    <ElOption
                      key={connector}
                      label={connector}
                      value={connector}
                    />
                  ))}
                </ElSelect>
              </div>
            </label>
          </div>

          <div class="cowin-parameter-title-row">
            <h3>Interface Settings</h3>
          </div>
          <div class="cowin-parameter-form">
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>
                <strong>*</strong> ServiceHardCoded
              </span>
              <ElInput
                class="cowin-node-dialog-control"
                modelValue={RUN_APF_RULE_SERVICE_HARD_CODED}
                readonly
              />
            </label>
          </div>

          <div class="cowin-parameter-title-row">
            <h3>Input Arguments</h3>
            <ElButton size="small" nativeType="button" onClick={addArgument}>
              New
            </ElButton>
          </div>
          <ElTable
            class="cowin-parameter-table"
            data={draftInputArguments.value}
            rowKey="id"
            border
            emptyText="No input arguments"
          >
            <ElTableColumn
              prop="name"
              label="Name"
              minWidth={160}
              v-slots={{
                default: ({ row }: { row: RunApfRuleInputArgument }) => (
                  <ElInput
                    class="cowin-parameter-control"
                    modelValue={row.name}
                    onInput={(value: string | number) =>
                      updateArgument(row.id, { name: String(value ?? '') })
                    }
                  />
                )
              }}
            />
            <ElTableColumn
              prop="type"
              label="Type"
              minWidth={120}
              v-slots={{
                default: ({ row }: { row: RunApfRuleInputArgument }) => (
                  <ElSelect
                    class="cowin-parameter-control"
                    modelValue={row.type || VARIABLE_TYPES[0]}
                    filterable
                    allowCreate
                    defaultFirstOption
                    onChange={(value: string | number) =>
                      updateArgument(row.id, { type: String(value) })
                    }
                  >
                    {Array.from(
                      new Set([...VARIABLE_TYPES, row.type].filter(Boolean))
                    ).map((type) => (
                      <ElOption key={type} label={type} value={type} />
                    ))}
                  </ElSelect>
                )
              }}
            />
            <ElTableColumn
              prop="value"
              label="Value"
              minWidth={220}
              v-slots={{
                default: ({
                  row,
                  $index
                }: {
                  row: RunApfRuleInputArgument
                  $index: number
                }) => (
                  <div class="cowin-inline-control cowin-argument-value-control">
                    <ElInput
                      class="cowin-parameter-control"
                      modelValue={row.value ?? ''}
                      onInput={(value: string | number) =>
                        updateArgument(row.id, { value: String(value ?? '') })
                      }
                    />
                    <ElButton
                      size="small"
                      nativeType="button"
                      onClick={() => openFxDialog('value', row.id)}
                    >
                      Fx
                    </ElButton>
                    {/* 第一行为固定参数，不提供删除按钮，但保留同宽占位以保持各行列对齐 */}
                    {$index > 0 ? (
                      <ElButton
                        class="cowin-parameter-remove"
                        size="small"
                        nativeType="button"
                        type="danger"
                        onClick={() => removeArgument(row.id)}
                      >
                        Delete
                      </ElButton>
                    ) : (
                      <ElButton
                        class="cowin-parameter-remove cowin-argument-delete-placeholder"
                        size="small"
                        nativeType="button"
                        type="danger"
                      >
                        Delete
                      </ElButton>
                    )}
                  </div>
                )
              }}
            />
          </ElTable>

          <div class="cowin-parameter-form cowin-parameter-sub-form">
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>Result Type</span>
              <ElSelect
                class="cowin-node-dialog-control"
                modelValue={service.resultType}
                disabled
              >
                <ElOption
                  label={service.resultType}
                  value={service.resultType}
                />
              </ElSelect>
            </label>
          </div>

          <div class="cowin-parameter-title-row">
            <h3>Output Arguments</h3>
          </div>
          <ElTable
            class="cowin-parameter-table"
            data={service.outputArguments}
            rowKey="id"
            border
            emptyText="No output arguments"
          >
            <ElTableColumn
              prop="name"
              label="Name"
              minWidth={180}
              v-slots={{
                default: ({
                  row
                }: {
                  row: { name: string; type: string }
                }) => (
                  <span class="cowin-output-argument-name">
                    {row.type === 'Table' ? TABLE_TYPE_ICON : null}
                    {row.name}
                  </span>
                )
              }}
            />
            <ElTableColumn prop="type" label="Type" minWidth={120} />
          </ElTable>

          <div class="cowin-parameter-form cowin-parameter-sub-form">
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>Timeout</span>
              <div class="cowin-inline-control">
                <ElInput
                  class="cowin-node-dialog-control"
                  modelValue={timeout.value}
                  placeholder="返回一个 Duration 类型的值"
                  onInput={(value: string | number) => {
                    timeout.value = String(value ?? '')
                  }}
                />
                <ElButton
                  nativeType="button"
                  onClick={() => openFxDialog('timeout')}
                >
                  Fx
                </ElButton>
              </div>
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

          <ElDialog
            class="cowin-node-dialog cowin-parameter-dialog"
            modelValue={fxDialogOpen.value}
            width="min(760px, calc(100vw - 48px))"
            destroyOnClose
            closeOnClickModal={false}
            onClose={closeFxDialog}
            v-slots={{
              header: () => (
                <div>
                  <h2>Edit Expression</h2>
                </div>
              )
            }}
          >
            <div class="cowin-parameter-form">
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
              <label class="cowin-node-dialog-field cowin-parameter-form-field">
                <span>Expression</span>
                <ExpressionEditor
                  modelValue={fxExpression.value}
                  symbols={expressionSymbols.value}
                  expectedType={
                    fxTarget.value === 'value'
                      ? (draftInputArguments.value.find(
                          (argument) => argument.id === fxArgumentId.value
                        )?.type ?? '')
                      : ''
                  }
                  onChange={(value) => {
                    fxExpression.value = value
                  }}
                  onReady={(insert) => {
                    insertExpression.value = insert
                  }}
                />
              </label>
              <div class="cowin-parameter-actions">
                <ElButton nativeType="button" onClick={closeFxDialog}>
                  Cancel
                </ElButton>
                <ElButton
                  nativeType="button"
                  type="primary"
                  onClick={submitFxDialog}
                >
                  OK
                </ElButton>
              </div>
            </div>
          </ElDialog>
        </div>
      )
    }
  }
})
