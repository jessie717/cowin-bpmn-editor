import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { SelectedNode } from '../types'
import { getNodeOutputVariables } from '../variables'

interface OutputVariableRow {
  key: string
  nodeName?: string
  name: string
  type: string
  value: string
}

export const OutputVariablesPanel = defineComponent({
  name: 'OutputVariablesPanel',
  props: {
    node: {
      type: Object as PropType<SelectedNode | null>,
      default: null
    },
    nodes: {
      type: Array as PropType<SelectedNode[]>,
      default: () => []
    },
    debugActive: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const rows = computed<OutputVariableRow[]>(() => {
      if (props.debugActive) {
        return props.nodes.flatMap((node) =>
          getNodeOutputVariables(node).map((variable) => ({
            key: `${node.id}:${variable.id}`,
            nodeName: node.name ?? node.definition.label,
            name: variable.name,
            type: variable.type,
            value: variable.value || variable.type
          }))
        )
      }

      if (!props.node) {
        return []
      }

      return getNodeOutputVariables(props.node).map((variable) => ({
        key: variable.id,
        name: variable.name,
        type: variable.type,
        value: variable.value || variable.type
      }))
    })

    function renderEmptyState() {
      if (props.debugActive) {
        return (
          <div class="cowin-output-empty">
            {props.nodes.length ? '当前断点节点暂无输出参数' : '请点击节点断点'}
          </div>
        )
      }

      return (
        <div class="cowin-output-empty">
          {props.node ? '当前节点暂无输出参数' : '请选择画布节点'}
        </div>
      )
    }

    return () => (
      <section class="cowin-output-variables">
        <header class="cowin-output-header">Output Variables</header>
        <div class="cowin-output-body">
          {rows.value.length ? (
            <table
              class={[
                'cowin-output-table',
                props.debugActive ? 'cowin-output-table-debug' : ''
              ]}
            >
              <thead>
                <tr>
                  {props.debugActive ? <th>Node Name</th> : null}
                  <th>Variable Name</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {rows.value.map((row) => (
                  <tr key={row.key}>
                    {props.debugActive ? (
                      <td title={row.nodeName}>{row.nodeName}</td>
                    ) : null}
                    <td title={row.name}>{row.name}</td>
                    <td title={row.value}>{row.type || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            renderEmptyState()
          )}
        </div>
      </section>
    )
  }
})
