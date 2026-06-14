import { defineComponent, type PropType } from 'vue'
// import backIcon from '../../assets/tool-svg/back.svg'
import bidirectionalIcon from '../../assets/tool-svg/bidirectional.svg'
import debugIcon from '../../assets/tool-svg/debug.svg'
import exportIcon from '../../assets/tool-svg/export.svg'
import flowIcon from '../../assets/tool-svg/flow.svg'
import lassoIcon from '../../assets/tool-svg/lasso.svg'
import publishIcon from '../../assets/tool-svg/publish.svg'
import redoIcon from '../../assets/tool-svg/redo.svg'
import saveMultipleIcon from '../../assets/tool-svg/save-multiple.svg'
import saveIcon from '../../assets/tool-svg/save.svg'
import selectIcon from '../../assets/tool-svg/select.svg'
import tabIcon from '../../assets/tool-svg/tab.svg'
import undoIcon from '../../assets/tool-svg/undo.svg'
import upRightIcon from '../../assets/tool-svg/up-right.svg'
import versionIcon from '../../assets/tool-svg/version.svg'

interface ToolbarAction {
  key: string
  title: string
  icon: string
  active?: boolean
  danger?: boolean
}

const leftActions: ToolbarAction[] = [
  { key: 'lasso', title: '移动画布', icon: lassoIcon },
  { key: 'select', title: '框选节点', icon: selectIcon },
  { key: 'bidirectional', title: 'Move', icon: bidirectionalIcon },
  { key: 'up-right', title: 'Connect', icon: upRightIcon },
  { key: 'tab', title: 'Open', icon: tabIcon },
  { key: 'undo', title: '撤销', icon: undoIcon },
  { key: 'redo', title: '恢复', icon: redoIcon }
]

const rightActions: ToolbarAction[] = [
  { key: 'debug', title: 'Debug', icon: debugIcon },
  { key: 'save', title: 'Save', icon: saveIcon },
  { key: 'publish', title: 'Deploy', icon: publishIcon },
  { key: 'save-multiple', title: 'Save as Version', icon: saveMultipleIcon },
  { key: 'version', title: 'Version', icon: versionIcon },
  { key: 'export', title: 'Export', icon: exportIcon },
  { key: 'flow', title: 'Flow', icon: flowIcon },
  { key: 'close', title: 'Close', icon: '', danger: true }
  // { key: 'back', title: 'Pan', icon: backIcon },
]

function triggerEditorAction(modeler: any, actionName: string) {
  if (!modeler) {
    return false
  }

  const editorActions = modeler?.get?.('editorActions', false)

  if (editorActions?.isRegistered?.(actionName)) {
    editorActions.trigger(actionName)
    return true
  }

  if (actionName === 'undo' || actionName === 'redo') {
    modeler?.get?.('commandStack')?.[actionName]?.()
    return true
  }

  return false
}

function renderAction(
  action: ToolbarAction,
  active: boolean,
  onClick?: () => void
) {
  return (
    <button
      class={[
        'cowin-toolbar-button',
        active ? 'cowin-toolbar-button-active' : '',
        action.danger ? 'cowin-toolbar-button-danger' : ''
      ]}
      type="button"
      title={action.title}
      onClick={onClick}
    >
      {action.icon ? <img src={action.icon} alt="" /> : <span>×</span>}
    </button>
  )
}

export const EditorToolbar = defineComponent({
  name: 'EditorToolbar',
  props: {
    modeler: {
      type: Object as PropType<any | null>,
      default: null
    },
    debugActive: {
      type: Boolean,
      default: false
    },
    onDebugToggle: {
      type: Function as PropType<() => void>,
      default: undefined
    }
  },
  setup(props) {
    function handleLeftAction(action: ToolbarAction) {
      if (action.key === 'lasso' || action.key === 'select') {
        return
      }

      const actionMap: Record<string, string> = {
        undo: 'undo',
        redo: 'redo'
      }
      const editorAction = actionMap[action.key]

      if (editorAction) {
        triggerEditorAction(props.modeler, editorAction)
      }
    }

    function handleRightAction(action: ToolbarAction) {
      if (action.key === 'debug') {
        props.onDebugToggle?.()
      }
    }

    return () => (
      <header class="cowin-editor-toolbar">
        <div class="cowin-toolbar-side">
          {leftActions.map((action) => (
            <span key={action.key}>
              {renderAction(
                action,
                Boolean(action.active),
                () => handleLeftAction(action)
              )}
            </span>
          ))}
        </div>

        <div class="cowin-toolbar-center">
          <span class="cowin-toolbar-flow-name">WorkFlow_vb890</span>
          <span class="cowin-toolbar-status-dot">*</span>
          <span class="cowin-toolbar-chevron">⌄</span>
          <span class="cowin-toolbar-divider">/</span>
          <span>Version: 1</span>
          <span class="cowin-toolbar-chevron">⌄</span>
          <span class="cowin-toolbar-deploy">DEPLOY</span>
        </div>

        <div class="cowin-toolbar-side cowin-toolbar-side-right">
          {rightActions.map((action) => (
            <span key={action.key}>
              {renderAction(
                action,
                action.key === 'debug'
                  ? props.debugActive
                  : Boolean(action.active),
                () => handleRightAction(action)
              )}
            </span>
          ))}
        </div>
      </header>
    )
  }
})
