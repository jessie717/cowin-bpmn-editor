import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import compileErrorIcon from '../../assets/misc-svg/compile-error.svg'
import logIcon from '../../assets/misc-svg/log.svg'
import type { ValidationIssue } from '../../nodes/types'

type FooterPanel = 'compile-errors' | 'log'

const logColumns = [
  { key: 'index', label: '#', width: '50px' },
  { key: 'category', label: '分类', width: '100px' },
  { key: 'time', label: '时间', width: '160px' },
  { key: 'content', label: '内容', width: '120px' },
  { key: 'nodeName', label: '节点名称', width: '160px' },
  { key: 'processName', label: '流程名称', width: '260px' },
  { key: 'instanceId', label: '实例ID', width: '260px' },
  { key: 'subProcessName', label: '子流程名称', width: '260px' },
  { key: 'subProcessInstanceId', label: '子流程实例ID', width: '260px' },
  { key: 'ip', label: '应用执行IP', width: '150px' }
]

const compileErrorColumns = [
  { key: 'index', label: '序号', width: '60px' },
  { key: 'errorCode', label: '错误码', width: '120px' },
  { key: 'errorType', label: '错误类型', width: '120px' },
  { key: 'nodeName', label: '节点名称', width: '160px' },
  { key: 'description', label: '描述', width: '280px' },
  { key: 'processName', label: '流程名称', width: '260px' },
  { key: 'instanceId', label: '实例ID', width: '260px' },
  { key: 'subProcessName', label: '子流程名称', width: '260px' },
  { key: 'subProcessInstanceId', label: '子流程实例ID', width: '260px' },
  { key: 'ip', label: '应该执行IP', width: '150px' }
]

export const EditorFooter = defineComponent({
  name: 'EditorFooter',
  props: {
    issues: {
      type: Array as PropType<ValidationIssue[]>,
      default: () => []
    },
    onIssueClick: {
      type: Function as PropType<(elementId: string) => void>,
      default: undefined
    },
    onIssueDblclick: {
      type: Function as PropType<(elementId: string) => void>,
      default: undefined
    }
  },
  setup(props) {
    const activePanel = ref<FooterPanel | null>('compile-errors')

    const compileErrorRows = computed(() =>
      props.issues.map((issue, index) => ({
        index: index + 1,
        elementId: issue.elementId,
        errorCode: issue.level === 'error' ? 'E-COMPILE' : 'W-COMPILE',
        errorType: issue.level === 'error' ? 'Error' : 'Warning',
        nodeName: issue.elementId,
        description: issue.message,
        processName: 'Work Flow Name 0002',
        instanceId: 'Dcd82e4687f94257bb6bbcb634435c5c',
        subProcessName: 'Wf_7edc2531',
        subProcessInstanceId: 'Ver.20260319092509945',
        ip: '10.011.016.135'
      }))
    )

    const logRows = computed(() => [])

    function togglePanel(panel: FooterPanel) {
      activePanel.value = activePanel.value === panel ? null : panel
    }

    function renderTable() {
      const columns =
        activePanel.value === 'compile-errors'
          ? compileErrorColumns
          : logColumns
      const rows =
        activePanel.value === 'compile-errors'
          ? compileErrorRows.value
          : logRows.value

      return (
        <div class="cowin-footer-table-wrap">
          <table class="cowin-footer-table">
            <colgroup>
              {columns.map((column) => (
                <col key={column.key} style={{ width: column.width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr
                    key={`${row.index}-${row.nodeName}`}
                    class={
                      activePanel.value === 'compile-errors'
                        ? 'cowin-footer-clickable-row'
                        : ''
                    }
                    onClick={() => {
                      if (activePanel.value === 'compile-errors') {
                        props.onIssueClick?.(row.elementId)
                      }
                    }}
                    onDblclick={() => {
                      if (activePanel.value === 'compile-errors') {
                        props.onIssueDblclick?.(row.elementId)
                      }
                    }}
                  >
                    {columns.map((column) => (
                      <td key={column.key}>
                        {row[column.key as keyof typeof row]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
          {!rows.length ? (
            <div class="cowin-footer-empty-state">暂无数据</div>
          ) : null}
        </div>
      )
    }

    function renderTab(panel: FooterPanel, icon: string, label: string) {
      return (
        <button
          class={[
            'cowin-footer-tab',
            activePanel.value === panel ? 'cowin-footer-tab-active' : ''
          ]}
          type="button"
          onClick={() => togglePanel(panel)}
        >
          <img src={icon} alt="" />
          <span>{label}</span>
        </button>
      )
    }

    return () => (
      <footer class="cowin-editor-footer">
        {activePanel.value ? renderTable() : null}
        <div class="cowin-footer-tabs">
          {renderTab('compile-errors', compileErrorIcon, 'Compile Errors')}
          {renderTab('log', logIcon, 'Log')}
        </div>
      </footer>
    )
  }
})
