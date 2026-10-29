import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import { ElButton, ElTable, ElTableColumn } from '../../../../element-plus'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

interface AndVariableRow {
  id: string
  variableName: string
  sourceBlock: string
}

export const AndConfigPanel = defineComponent({
  name: 'AndConfigPanel',
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
    const variableRows = computed<AndVariableRow[]>(() =>
      props.availableVariables.map((variable) => ({
        id: variable.id,
        variableName: variable.name,
        sourceBlock: variable.nodeLabel || variable.nodeId || '-'
      }))
    )

    return () => (
      <div class="cowin-parameter-section">
        <div class="cowin-parameter-title-row">
          <h3>Input Context</h3>
        </div>
        <ElTable
          class="cowin-parameter-table"
          data={variableRows.value}
          rowKey="id"
          border
          emptyText="No variables"
        >
          <ElTableColumn
            prop="variableName"
            label="Variable Name"
            minWidth={220}
          />
          <ElTableColumn
            prop="sourceBlock"
            label="Source Block"
            minWidth={220}
          />
        </ElTable>

        <div class="cowin-parameter-actions">
          <ElButton nativeType="button" onClick={props.onClose}>
            Cancel
          </ElButton>
          <ElButton nativeType="button" type="primary" onClick={props.onClose}>
            Apply
          </ElButton>
        </div>
      </div>
    )
  }
})
