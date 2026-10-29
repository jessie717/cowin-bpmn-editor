import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import {
  CONFIG_KEYS,
  VARIABLE_TYPES,
  createParameterId,
  parseParameterList,
  stringifyParameterList,
  type FunctionInputParameter,
  type FunctionOutputParameter
} from '../../../shared/config'
import {
  ElButton,
  ElDialog,
  ElInput,
  ElMessage,
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
import {
  createExpressionSymbols,
  validateExpression
} from '../../../../editor/expression'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

function renderVariableTypeSelect(
  value: string,
  onChange: (value: string) => void,
  className = 'cowin-parameter-control'
) {
  return (
    <ElSelect
      class={className}
      modelValue={value || VARIABLE_TYPES[0]}
      onChange={(nextValue: string | number) => onChange(String(nextValue))}
    >
      {VARIABLE_TYPES.map((type) => (
        <ElOption key={type} label={type} value={type} />
      ))}
    </ElSelect>
  )
}

export const FunctionConfigPanel = defineComponent({
  name: 'FunctionConfigPanel',
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
    const draftInputParameters = ref(
      parseParameterList<FunctionInputParameter>(
        props.node.config[CONFIG_KEYS.functionInputs]
      )
    )
    const draftOutputParameters = ref(
      parseParameterList<FunctionOutputParameter>(
        props.node.config[CONFIG_KEYS.functionOutputs]
      )
    )
    const parameterDialogOpen = ref(false)
    const insertExpression = ref<ExpressionInsert>()
    const expressionSymbols = computed(() =>
      createExpressionSymbols(props.availableVariables)
    )
    const editingParameterId = ref<string | null>(null)
    const parameterForm = ref<FunctionOutputParameter>({
      id: '',
      name: '',
      type: VARIABLE_TYPES[0],
      expression: ''
    })

    function openParameterDialog(parameter?: FunctionOutputParameter) {
      editingParameterId.value = parameter?.id ?? null
      selectedContext.value = ''
      selectedExpression.value = parameter?.expression ?? ''
      parameterForm.value = parameter
        ? { ...parameter }
        : {
            id: createParameterId('output'),
            name: '',
            type: VARIABLE_TYPES[0],
            expression: selectedExpression.value || selectedContext.value
          }
      parameterDialogOpen.value = true
    }

    function closeParameterDialog() {
      parameterDialogOpen.value = false
      editingParameterId.value = null
    }

    function updateParameterForm(patch: Partial<FunctionOutputParameter>) {
      parameterForm.value = {
        ...parameterForm.value,
        ...patch
      }
    }

    function submitParameterDialog() {
      const nextParameter = { ...parameterForm.value }
      const validation = validateExpression(
        nextParameter.expression,
        expressionSymbols.value,
        nextParameter.type
      )
      if (!validation.valid) {
        ElMessage.error(validation.diagnostics[0]?.message || 'Expression is invalid')
        return
      }

      draftOutputParameters.value = editingParameterId.value
        ? draftOutputParameters.value.map((parameter) =>
            parameter.id === editingParameterId.value
              ? nextParameter
              : parameter
          )
        : [...draftOutputParameters.value, nextParameter]

      closeParameterDialog()
    }

    function removeParameter(id: string) {
      draftOutputParameters.value = draftOutputParameters.value.filter(
        (parameter) => parameter.id !== id
      )
    }

    function applyConfig() {
      const invalidParameter = draftOutputParameters.value.find((parameter) =>
        !validateExpression(
          parameter.expression,
          expressionSymbols.value,
          parameter.type
        ).valid
      )
      if (invalidParameter) {
        const validation = validateExpression(
          invalidParameter.expression,
          expressionSymbols.value,
          invalidParameter.type
        )
        ElMessage.error(
          `${invalidParameter.name || 'Argument'}: ${validation.diagnostics[0]?.message || 'Expression is invalid'}`
        )
        return
      }
      props.onUpdateConfig(
        CONFIG_KEYS.functionInputs,
        stringifyParameterList(draftInputParameters.value)
      )
      props.onUpdateConfig(
        CONFIG_KEYS.functionOutputs,
        stringifyParameterList(draftOutputParameters.value)
      )
      props.onClose()
    }

    return () => {
      const outputParameters = draftOutputParameters.value

      return (
        <div class="cowin-parameter-section">
          <div class="cowin-function-helper-row">
            <InputContext
              modelValue={selectedContext.value}
              upstreamVariables={props.availableVariables}
              onChange={(value) => {
                selectedContext.value = value
              }}
            />
            <ExpressionHelper
              modelValue={selectedExpression.value}
              onChange={(value) => {
                selectedExpression.value = value
              }}
            />
          </div>

          <div>
            <div class="cowin-parameter-title-row">
              <h3>Arguments</h3>
              <ElButton
                size="small"
                nativeType="button"
                onClick={() => openParameterDialog()}
              >
                New
              </ElButton>
            </div>
            <ElTable
              class="cowin-parameter-table"
              data={outputParameters}
              rowKey="id"
              border
              emptyText="No arguments"
            >
              <ElTableColumn prop="name" label="Name" minWidth={140} />
              <ElTableColumn prop="type" label="Type" minWidth={100} />
              <ElTableColumn
                prop="expression"
                label="Expression"
                minWidth={180}
              />
              <ElTableColumn
                label="Order"
                width={80}
                v-slots={{
                  default: ({ $index }: { $index: number }) => $index + 1
                }}
              />
              <ElTableColumn
                label="Action"
                width={150}
                v-slots={{
                  default: ({ row }: { row: FunctionOutputParameter }) => (
                    <>
                      <ElButton
                        size="small"
                        nativeType="button"
                        onClick={() => openParameterDialog(row)}
                      >
                        Edit
                      </ElButton>
                      <ElButton
                        class="cowin-parameter-remove"
                        size="small"
                        nativeType="button"
                        type="danger"
                        onClick={() => removeParameter(row.id)}
                      >
                        Delete
                      </ElButton>
                    </>
                  )
                }}
              />
            </ElTable>
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
            modelValue={parameterDialogOpen.value}
            width="min(760px, calc(100vw - 48px))"
            destroyOnClose
            closeOnClickModal={false}
            onClose={closeParameterDialog}
            v-slots={{
              header: () => (
                <div>
                  <h2>
                    {editingParameterId.value
                      ? 'Edit Argument'
                      : 'New Argument'}
                  </h2>
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
                <span>Name</span>
                <ElInput
                  class="cowin-node-dialog-control"
                  modelValue={parameterForm.value.name}
                  onInput={(value: string | number) =>
                    updateParameterForm({ name: String(value ?? '') })
                  }
                />
              </label>
              <label class="cowin-node-dialog-field cowin-parameter-form-field">
                <span>Type</span>
                {renderVariableTypeSelect(
                  parameterForm.value.type,
                  (type) => updateParameterForm({ type }),
                  'cowin-node-dialog-control'
                )}
              </label>
              <label class="cowin-node-dialog-field cowin-parameter-form-field">
                <span>Expression</span>
                <ExpressionEditor
                  modelValue={parameterForm.value.expression}
                  symbols={expressionSymbols.value}
                  expectedType={parameterForm.value.type}
                  onChange={(value) => updateParameterForm({ expression: value })}
                  onReady={(insert) => {
                    insertExpression.value = insert
                  }}
                />
              </label>
              <div class="cowin-parameter-actions">
                <ElButton nativeType="button" onClick={closeParameterDialog}>
                  Cancel
                </ElButton>
                <ElButton
                  nativeType="button"
                  type="primary"
                  onClick={submitParameterDialog}
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
