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
import { InputContext } from '../../../../editor/components/InputContext'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

const HTTP_CALL_CONFIG_KEYS = {
  connector: 'httpCallConnector',
  inputArguments: 'httpCallInputArguments',
  outputArguments: 'httpCallOutputArguments'
}

interface HttpConnector {
  id: string
  name: string
  apiAddress: string
  method: string
  retryCounts: string
  timeout: string
}

interface HttpInputArgument {
  id: string
  name: string
  value: string
}

interface HttpOutputArgument {
  id: string
  name: string
  type: string
  value: string
}

type ArgumentKind = 'input' | 'output'
type ArgumentForm = HttpInputArgument &
  Partial<Pick<HttpOutputArgument, 'type'>>

const CONNECTORS: HttpConnector[] = [
  {
    id: 'customer-profile',
    name: 'Customer Profile API',
    apiAddress: 'https://api.example.com/customer/profile',
    method: 'GET',
    retryCounts: '3',
    timeout: '5000'
  },
  {
    id: 'order-submit',
    name: 'Order Submit API',
    apiAddress: 'https://api.example.com/order/submit',
    method: 'POST',
    retryCounts: '2',
    timeout: '8000'
  },
  {
    id: 'risk-check',
    name: 'Risk Check API',
    apiAddress: 'https://api.example.com/risk/check',
    method: 'POST',
    retryCounts: '1',
    timeout: '3000'
  }
]

function renderVariableTypeSelect(
  value: string,
  onChange: (value: string) => void
) {
  return (
    <ElSelect
      class="cowin-node-dialog-control"
      modelValue={value || VARIABLE_TYPES[0]}
      onChange={(nextValue: string | number) => onChange(String(nextValue))}
    >
      {VARIABLE_TYPES.map((type) => (
        <ElOption key={type} label={type} value={type} />
      ))}
    </ElSelect>
  )
}

export const HttpCallConfigPanel = defineComponent({
  name: 'HttpCallConfigPanel',
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
    const selectedConnectorId = ref(
      props.node.config[HTTP_CALL_CONFIG_KEYS.connector] ||
        CONNECTORS[0]?.id ||
        ''
    )
    const draftInputArguments = ref(
      parseParameterList<HttpInputArgument>(
        props.node.config[HTTP_CALL_CONFIG_KEYS.inputArguments]
      )
    )
    const draftOutputArguments = ref(
      parseParameterList<HttpOutputArgument>(
        props.node.config[HTTP_CALL_CONFIG_KEYS.outputArguments]
      )
    )
    const previewOpen = ref(false)
    const argumentDialogOpen = ref(false)
    const argumentKind = ref<ArgumentKind>('input')
    const editingArgumentId = ref<string | null>(null)
    const argumentForm = ref<ArgumentForm>({
      id: '',
      name: '',
      value: '',
      type: VARIABLE_TYPES[0]
    })

    const selectedConnector = computed(
      () =>
        CONNECTORS.find(
          (connector) => connector.id === selectedConnectorId.value
        ) ?? CONNECTORS[0]
    )

    function openArgumentDialog(
      kind: ArgumentKind,
      argument?: HttpInputArgument | HttpOutputArgument
    ) {
      argumentKind.value = kind
      editingArgumentId.value = argument?.id ?? null
      selectedContext.value = ''
      selectedExpression.value = argument?.value ?? ''
      argumentForm.value = argument
        ? { ...argument }
        : {
            id: createParameterId(`http-${kind}`),
            name: '',
            value: selectedExpression.value || selectedContext.value,
            type: VARIABLE_TYPES[0]
          }
      argumentDialogOpen.value = true
    }

    function closeArgumentDialog() {
      argumentDialogOpen.value = false
      editingArgumentId.value = null
    }

    function updateArgumentForm(patch: Partial<ArgumentForm>) {
      argumentForm.value = {
        ...argumentForm.value,
        ...patch
      }
    }

    function submitArgumentDialog() {
      const nextArgument = { ...argumentForm.value }

      if (argumentKind.value === 'input') {
        const inputArgument: HttpInputArgument = {
          id: nextArgument.id,
          name: nextArgument.name,
          value: nextArgument.value
        }

        draftInputArguments.value = editingArgumentId.value
          ? draftInputArguments.value.map((argument) =>
              argument.id === editingArgumentId.value ? inputArgument : argument
            )
          : [...draftInputArguments.value, inputArgument]
      } else {
        const outputArgument: HttpOutputArgument = {
          id: nextArgument.id,
          name: nextArgument.name,
          type: nextArgument.type || VARIABLE_TYPES[0],
          value: nextArgument.value
        }

        draftOutputArguments.value = editingArgumentId.value
          ? draftOutputArguments.value.map((argument) =>
              argument.id === editingArgumentId.value
                ? outputArgument
                : argument
            )
          : [...draftOutputArguments.value, outputArgument]
      }

      closeArgumentDialog()
    }

    function removeInputArgument(id: string) {
      draftInputArguments.value = draftInputArguments.value.filter(
        (argument) => argument.id !== id
      )
    }

    function removeOutputArgument(id: string) {
      draftOutputArguments.value = draftOutputArguments.value.filter(
        (argument) => argument.id !== id
      )
    }

    function applyConfig() {
      props.onUpdateConfig(
        HTTP_CALL_CONFIG_KEYS.connector,
        selectedConnectorId.value
      )
      props.onUpdateConfig(
        HTTP_CALL_CONFIG_KEYS.inputArguments,
        stringifyParameterList(draftInputArguments.value)
      )
      props.onUpdateConfig(
        HTTP_CALL_CONFIG_KEYS.outputArguments,
        stringifyParameterList(draftOutputArguments.value)
      )
      props.onClose()
    }

    function updateArgumentValue(value: string) {
      updateArgumentForm({ value })
    }

    return () => {
      const connector = selectedConnector.value
      const previewConfig = connector
        ? JSON.stringify(
            {
              connector,
              inputArguments: draftInputArguments.value,
              outputArguments: draftOutputArguments.value
            },
            null,
            2
          )
        : ''

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

          <div class="cowin-parameter-title-row">
            <h3>Connector</h3>
          </div>
          <div class="cowin-parameter-form">
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>
                Connector<strong>*</strong>
              </span>
              <div class="cowin-inline-control">
                <ElSelect
                  class="cowin-node-dialog-control"
                  modelValue={selectedConnectorId.value}
                  onChange={(value: string | number) => {
                    selectedConnectorId.value = String(value)
                  }}
                >
                  {CONNECTORS.map((option) => (
                    <ElOption
                      key={option.id}
                      label={option.name}
                      value={option.id}
                    />
                  ))}
                </ElSelect>
                <ElButton
                  nativeType="button"
                  onClick={() => {
                    previewOpen.value = true
                  }}
                >
                  Preview
                </ElButton>
              </div>
            </label>

            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>API Address</span>
              <ElInput
                class="cowin-node-dialog-control"
                modelValue={connector?.apiAddress ?? ''}
                disabled
              />
            </label>
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>Method</span>
              <ElInput
                class="cowin-node-dialog-control"
                modelValue={connector?.method ?? ''}
                disabled
              />
            </label>
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>Retry Counts</span>
              <ElInput
                class="cowin-node-dialog-control"
                modelValue={connector?.retryCounts ?? ''}
                disabled
              />
            </label>
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>Timeout</span>
              <ElInput
                class="cowin-node-dialog-control"
                modelValue={connector?.timeout ?? ''}
                disabled
              />
            </label>
          </div>

          <div class="cowin-parameter-title-row">
            <h3>Input Arguments</h3>
            <ElButton
              size="small"
              nativeType="button"
              onClick={() => openArgumentDialog('input')}
            >
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
            <ElTableColumn prop="name" label="Name" minWidth={160} />
            <ElTableColumn prop="value" label="Value" minWidth={220} />
            <ElTableColumn
              label="Action"
              width={150}
              v-slots={{
                default: ({ row }: { row: HttpInputArgument }) => (
                  <>
                    <ElButton
                      size="small"
                      nativeType="button"
                      onClick={() => openArgumentDialog('input', row)}
                    >
                      Edit
                    </ElButton>
                    <ElButton
                      class="cowin-parameter-remove"
                      size="small"
                      nativeType="button"
                      type="danger"
                      onClick={() => removeInputArgument(row.id)}
                    >
                      Delete
                    </ElButton>
                  </>
                )
              }}
            />
          </ElTable>

          <div class="cowin-parameter-title-row">
            <h3>Output Arguments</h3>
            <ElButton
              size="small"
              nativeType="button"
              onClick={() => openArgumentDialog('output')}
            >
              New
            </ElButton>
          </div>
          <ElTable
            class="cowin-parameter-table"
            data={draftOutputArguments.value}
            rowKey="id"
            border
            emptyText="No output arguments"
          >
            <ElTableColumn prop="name" label="Name" minWidth={140} />
            <ElTableColumn prop="type" label="Type" minWidth={100} />
            <ElTableColumn prop="value" label="Value" minWidth={200} />
            <ElTableColumn
              label="Action"
              width={150}
              v-slots={{
                default: ({ row }: { row: HttpOutputArgument }) => (
                  <>
                    <ElButton
                      size="small"
                      nativeType="button"
                      onClick={() => openArgumentDialog('output', row)}
                    >
                      Edit
                    </ElButton>
                    <ElButton
                      class="cowin-parameter-remove"
                      size="small"
                      nativeType="button"
                      type="danger"
                      onClick={() => removeOutputArgument(row.id)}
                    >
                      Delete
                    </ElButton>
                  </>
                )
              }}
            />
          </ElTable>

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
            modelValue={previewOpen.value}
            width="min(620px, calc(100vw - 48px))"
            destroyOnClose
            onClose={() => {
              previewOpen.value = false
            }}
            v-slots={{
              header: () => (
                <div>
                  <h2>Connector Preview</h2>
                </div>
              )
            }}
          >
            <pre class="cowin-config-preview">{previewConfig}</pre>
          </ElDialog>

          <ElDialog
            class="cowin-node-dialog cowin-parameter-dialog"
            modelValue={argumentDialogOpen.value}
            width="min(760px, calc(100vw - 48px))"
            destroyOnClose
            closeOnClickModal={false}
            onClose={closeArgumentDialog}
            v-slots={{
              header: () => (
                <div>
                  <h2>
                    {editingArgumentId.value ? 'Edit Argument' : 'New Argument'}
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
                    updateArgumentValue(value)
                  }}
                />
                <ExpressionHelper
                  modelValue={selectedExpression.value}
                  onChange={(value) => {
                    selectedExpression.value = value
                    updateArgumentValue(value)
                  }}
                />
              </div>

              <label class="cowin-node-dialog-field cowin-parameter-form-field">
                <span>Name</span>
                <ElInput
                  class="cowin-node-dialog-control"
                  modelValue={argumentForm.value.name}
                  onInput={(value: string | number) =>
                    updateArgumentForm({ name: String(value ?? '') })
                  }
                />
              </label>
              {argumentKind.value === 'output' ? (
                <label class="cowin-node-dialog-field cowin-parameter-form-field">
                  <span>Type</span>
                  {renderVariableTypeSelect(
                    argumentForm.value.type ?? '',
                    (type) => updateArgumentForm({ type })
                  )}
                </label>
              ) : null}
              <label class="cowin-node-dialog-field cowin-parameter-form-field">
                <span>Value</span>
                <ElInput
                  class="cowin-node-dialog-control"
                  modelValue={argumentForm.value.value}
                  onInput={(value: string | number) =>
                    updateArgumentForm({ value: String(value ?? '') })
                  }
                />
              </label>

              <div class="cowin-parameter-actions">
                <ElButton nativeType="button" onClick={closeArgumentDialog}>
                  Cancel
                </ElButton>
                <ElButton
                  nativeType="button"
                  type="primary"
                  onClick={submitArgumentDialog}
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
