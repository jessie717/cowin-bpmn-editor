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
  type RunApfRuleInputArgument,
  type RunApfRuleOutputArgument
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

    const savedOutputArguments = parseParameterList<RunApfRuleOutputArgument>(
      config[RUN_APF_RULE_CONFIG_KEYS.outputArguments]
    )
    const draftOutputArguments = ref(
      savedOutputArguments.length
        ? savedOutputArguments
        : [...service.outputArguments]
    )
    const batchDialogOpen = ref(false)
    const batchText = ref('')

    const fxDialogOpen = ref(false)
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

    function updateOutputArgument(
      id: string,
      patch: Partial<RunApfRuleOutputArgument>
    ) {
      draftOutputArguments.value = draftOutputArguments.value.map((argument) =>
        argument.id === id ? { ...argument, ...patch } : argument
      )
    }

    function addOutputArgument() {
      draftOutputArguments.value = [
        ...draftOutputArguments.value,
        {
          id: createParameterId('run-apf-rule-output'),
          name: '',
          type: ''
        }
      ]
    }

    function removeOutputArgument(id: string) {
      const index = draftOutputArguments.value.findIndex(
        (argument) => argument.id === id
      )

      // 第一行为服务默认输出（table），不可删除
      if (index <= 0) {
        return
      }

      draftOutputArguments.value = draftOutputArguments.value.filter(
        (argument) => argument.id !== id
      )
    }

    function openBatchDialog() {
      batchText.value = ''
      batchDialogOpen.value = true
    }

    function closeBatchDialog() {
      batchDialogOpen.value = false
    }

    // 批量格式：column:type|column:type|column:type
    function submitBatchDialog() {
      const rows = batchText.value
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const separatorIndex = part.indexOf(':')
          return separatorIndex === -1
            ? { name: part, type: '' }
            : {
                name: part.slice(0, separatorIndex).trim(),
                type: part.slice(separatorIndex + 1).trim()
              }
        })
        .filter((row) => row.name)

      if (rows.length) {
        draftOutputArguments.value = [
          ...draftOutputArguments.value,
          ...rows.map((row) => ({
            id: createParameterId('run-apf-rule-output'),
            ...row
          }))
        ]
      }

      closeBatchDialog()
    }

    function openFxDialog() {
      selectedContext.value = ''
      selectedExpression.value = ''
      fxExpression.value = timeout.value
      fxDialogOpen.value = true
    }

    function closeFxDialog() {
      fxDialogOpen.value = false
    }

    function submitFxDialog() {
      timeout.value = fxExpression.value
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
      props.onUpdateConfig(
        RUN_APF_RULE_CONFIG_KEYS.outputArguments,
        stringifyParameterList(draftOutputArguments.value)
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
              <ElSelect
                class="cowin-node-dialog-control"
                modelValue={selectedConnector.value}
                onChange={(value: string | number) => {
                  selectedConnector.value = String(value)
                }}
              >
                {RUN_APF_RULE_CONNECTORS.map((connector) => (
                  <ElOption key={connector} label={connector} value={connector} />
                ))}
              </ElSelect>
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
                  <ElInput
                    class="cowin-parameter-control"
                    modelValue={row.type || VARIABLE_TYPES[0]}
                    readonly
                    disabled
                  />
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

          <div class="cowin-parameter-title-row">
            <div class="cowin-output-title-left">
              <h3>Output Arguments</h3>
              <span class="cowin-result-type-hint">
                Result Type: <strong>{service.resultType}</strong>
              </span>
            </div>
            <div class="cowin-output-title-actions">
              <ElButton size="small" nativeType="button" onClick={addOutputArgument}>
                New
              </ElButton>
              <ElButton size="small" nativeType="button" onClick={openBatchDialog}>
                Batch New
              </ElButton>
            </div>
          </div>
          <ElTable
            class="cowin-parameter-table"
            data={draftOutputArguments.value}
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
                  row,
                  $index
                }: {
                  row: RunApfRuleOutputArgument
                  $index: number
                }) => (
                  <div class="cowin-output-argument-name">
                    {row.type === 'Table' ? TABLE_TYPE_ICON : null}
                    <ElInput
                      class="cowin-parameter-control"
                      modelValue={row.name}
                      readonly={$index === 0}
                      disabled={$index === 0}
                      onInput={(value: string | number) =>
                        updateOutputArgument(row.id, {
                          name: String(value ?? '')
                        })
                      }
                    />
                  </div>
                )
              }}
            />
            <ElTableColumn
              prop="type"
              label="Type"
              minWidth={220}
              v-slots={{
                default: ({
                  row,
                  $index
                }: {
                  row: RunApfRuleOutputArgument
                  $index: number
                }) => (
                  <div class="cowin-inline-control cowin-argument-value-control">
                    <ElInput
                      class="cowin-parameter-control"
                      modelValue={row.type}
                      readonly={$index === 0}
                      disabled={$index === 0}
                      onInput={(value: string | number) =>
                        updateOutputArgument(row.id, {
                          type: String(value ?? '')
                        })
                      }
                    />
                    {/* 第一行为服务默认输出，不提供删除按钮，但保留同宽占位以保持各行列对齐 */}
                    {$index > 0 ? (
                      <ElButton
                        class="cowin-parameter-remove"
                        size="small"
                        nativeType="button"
                        type="danger"
                        onClick={() => removeOutputArgument(row.id)}
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
              <span>Timeout（秒）</span>
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
                  onClick={openFxDialog}
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
                  onChange={(value: string) => {
                    selectedContext.value = value
                    insertExpression.value?.(value)
                  }}
                />
                <ExpressionHelper
                  modelValue={selectedExpression.value}
                  onChange={(value: string) => {
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
                  expectedType=""
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

          <ElDialog
            class="cowin-node-dialog cowin-parameter-dialog"
            modelValue={batchDialogOpen.value}
            width="min(560px, calc(100vw - 48px))"
            destroyOnClose
            closeOnClickModal={false}
            onClose={closeBatchDialog}
            v-slots={{
              header: () => (
                <div>
                  <h2>Batch Add Output Arguments</h2>
                </div>
              )
            }}
          >
            <div class="cowin-parameter-form">
              <ElInput
                type="textarea"
                rows={6}
                modelValue={batchText.value}
                placeholder="column:type|column:type|column:type"
                onInput={(value: string | number) => {
                  batchText.value = String(value ?? '')
                }}
              />
              <div class="cowin-parameter-actions">
                <ElButton nativeType="button" onClick={closeBatchDialog}>
                  Cancel
                </ElButton>
                <ElButton
                  nativeType="button"
                  type="primary"
                  onClick={submitBatchDialog}
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
