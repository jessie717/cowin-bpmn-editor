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
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn
} from '../../../../element-plus'
import {
  InputContext,
  getInputContextVariables
} from '../../../../editor/components/InputContext'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'
import type { WorkflowVariable } from '../../../../editor/variables'
import { OR_CONFIG_KEYS, type OrOutputVariable } from './config'

function createMappedOutput(variable: WorkflowVariable): OrOutputVariable {
  return {
    id: createParameterId('or-output'),
    name: variable.name,
    type: variable.type || VARIABLE_TYPES[0],
    value: variable.id,
    sourceId: variable.id,
    sourceBlock: variable.nodeLabel || variable.nodeId || 'Upstream Variables',
    custom: false
  }
}

export const OrConfigPanel = defineComponent({
  name: 'OrConfigPanel',
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
    const inputVariables = computed(() =>
      getInputContextVariables(props.availableVariables)
    )
    const outputVariables = ref(
      parseParameterList<OrOutputVariable>(
        props.node.config[OR_CONFIG_KEYS.outputVariables]
      )
    )
    const selectedInputId = ref('')
    const selectedOutputId = ref('')
    const variableDialogOpen = ref(false)
    const variableName = ref('')
    const variableType = ref(VARIABLE_TYPES[0])
    const selectedInputIsMapped = computed(() =>
      outputVariables.value.some(
        (variable) => variable.sourceId === selectedInputId.value
      )
    )

    function hasOutputName(name: string) {
      const normalizedName = name.trim().toLowerCase()

      return outputVariables.value.some(
        (variable) => variable.name.trim().toLowerCase() === normalizedName
      )
    }

    function bindInputVariable(inputId: string) {
      selectedInputId.value = inputId

      if (
        outputVariables.value.some((variable) => variable.sourceId === inputId)
      ) {
        return
      }

      const inputVariable = inputVariables.value.find(
        (variable) => variable.id === inputId
      )

      if (!inputVariable) {
        return
      }

      if (hasOutputName(inputVariable.name)) {
        ElMessage.warning(`Variable ${inputVariable.name} already exists`)
        return
      }

      outputVariables.value = [
        ...outputVariables.value,
        createMappedOutput(inputVariable)
      ]
    }

    function autoGenerate() {
      const mappedSourceIds = new Set(
        outputVariables.value
          .map((variable) => variable.sourceId)
          .filter(Boolean)
      )
      const outputNames = new Set(
        outputVariables.value.map((variable) =>
          variable.name.trim().toLowerCase()
        )
      )
      const generated: OrOutputVariable[] = []
      let skippedCount = 0

      inputVariables.value.forEach((variable) => {
        const normalizedName = variable.name.trim().toLowerCase()

        if (mappedSourceIds.has(variable.id)) {
          return
        }

        if (outputNames.has(normalizedName)) {
          skippedCount += 1
          return
        }

        generated.push(createMappedOutput(variable))
        mappedSourceIds.add(variable.id)
        outputNames.add(normalizedName)
      })

      outputVariables.value = [...outputVariables.value, ...generated]

      if (skippedCount) {
        ElMessage.warning(
          `${skippedCount} same-name variable${skippedCount > 1 ? 's were' : ' was'} skipped`
        )
      }
    }

    function unbindSelectedInput() {
      const unboundOutputIds = new Set(
        outputVariables.value
          .filter((variable) => variable.sourceId === selectedInputId.value)
          .map((variable) => variable.id)
      )

      outputVariables.value = outputVariables.value.filter(
        (variable) => variable.sourceId !== selectedInputId.value
      )

      if (unboundOutputIds.has(selectedOutputId.value)) {
        selectedOutputId.value = ''
      }
    }

    function openVariableDialog() {
      variableName.value = ''
      variableType.value = VARIABLE_TYPES[0]
      variableDialogOpen.value = true
    }

    function closeVariableDialog() {
      variableDialogOpen.value = false
    }

    function addCustomVariable() {
      const name = variableName.value.trim()

      if (!name) {
        ElMessage.error('Variable Name is required')
        return
      }

      if (hasOutputName(name)) {
        ElMessage.error(`Variable ${name} already exists`)
        return
      }

      outputVariables.value = [
        ...outputVariables.value,
        {
          id: createParameterId('or-output'),
          name,
          type: variableType.value,
          value: '',
          sourceBlock: 'Custom',
          custom: true
        }
      ]
      closeVariableDialog()
    }

    function deleteSelectedOutput() {
      outputVariables.value = outputVariables.value.filter(
        (variable) => variable.id !== selectedOutputId.value
      )
      selectedOutputId.value = ''
    }

    function applyConfig() {
      props.onUpdateConfig(
        OR_CONFIG_KEYS.outputVariables,
        stringifyParameterList(outputVariables.value)
      )
      props.onClose()
    }

    return () => (
      <div class="cowin-parameter-section">
        
        <div class="cowin-or-transfer-grid">
          <div class="cowin-or-transfer-column">
            <InputContext
              modelValue={selectedInputId.value}
              upstreamVariables={props.availableVariables}
              onChange={bindInputVariable}
            />
            <div class="cowin-or-transfer-actions">
              <ElButton nativeType="button" onClick={autoGenerate}>
                Auto-generate
              </ElButton>
              <ElButton
                nativeType="button"
                disabled={!selectedInputIsMapped.value}
                onClick={unbindSelectedInput}
              >
                Unbind
              </ElButton>
            </div>
          </div>

          <div class="cowin-or-transfer-column">
            <header class="cowin-context-helper-header">
              Output Variables
            </header>
            <ElTable
              class="cowin-parameter-table cowin-or-output-table"
              data={outputVariables.value}
              rowKey="id"
              height={260}
              border
              highlightCurrentRow
              emptyText="No output variables"
              onRow-click={(row) => {
                selectedOutputId.value = (row as OrOutputVariable).id
              }}
              rowClassName={({ row }: { row: OrOutputVariable }) =>
                row.id === selectedOutputId.value
                  ? 'cowin-table-row-active'
                  : ''
              }
            >
              <ElTableColumn prop="name" label="Variable Name" minWidth={150} />
              <ElTableColumn
                prop="sourceBlock"
                label="Source Block"
                minWidth={150}
              />
            </ElTable>
            <div class="cowin-or-transfer-actions cowin-or-transfer-actions-right">
              <ElButton nativeType="button" onClick={openVariableDialog}>
                New
              </ElButton>
              <ElButton
                nativeType="button"
                type="danger"
                disabled={!selectedOutputId.value}
                onClick={deleteSelectedOutput}
              >
                Delete
              </ElButton>
            </div>
          </div>
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
          modelValue={variableDialogOpen.value}
          width="min(520px, calc(100vw - 48px))"
          destroyOnClose
          closeOnClickModal={false}
          onClose={closeVariableDialog}
          v-slots={{
            header: () => (
              <div>
                <h2>New Output Variable</h2>
              </div>
            )
          }}
        >
          <div class="cowin-parameter-form">
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>
                Variable Name<strong>*</strong>
              </span>
              <ElInput
                class="cowin-node-dialog-control"
                modelValue={variableName.value}
                onInput={(value: string | number) => {
                  variableName.value = String(value ?? '')
                }}
              />
            </label>
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>Type</span>
              <ElSelect
                class="cowin-node-dialog-control"
                modelValue={variableType.value}
                onChange={(value: string | number) => {
                  variableType.value = String(value)
                }}
              >
                {VARIABLE_TYPES.map((type) => (
                  <ElOption key={type} label={type} value={type} />
                ))}
              </ElSelect>
            </label>
            <div class="cowin-parameter-actions">
              <ElButton nativeType="button" onClick={closeVariableDialog}>
                Cancel
              </ElButton>
              <ElButton
                nativeType="button"
                type="primary"
                onClick={addCustomVariable}
              >
                OK
              </ElButton>
            </div>
          </div>
        </ElDialog>
      </div>
    )
  }
})
