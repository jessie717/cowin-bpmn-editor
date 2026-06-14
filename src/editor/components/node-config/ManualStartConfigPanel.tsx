import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { CONFIG_KEYS, VARIABLE_TYPES } from '../../variables'
import { getInputValue } from './helpers'
import type { NodeConfigPanelProps } from './types'

export const ManualStartConfigPanel = defineComponent({
  name: 'ManualStartConfigPanel',
  props: {
    node: {
      type: Object as PropType<NodeConfigPanelProps['node']>,
      required: true
    },
    onUpdateConfig: {
      type: Function as PropType<NodeConfigPanelProps['onUpdateConfig']>,
      required: true
    }
  },
  setup(props) {
    return () => {
      const config = props.node.config

      return (
        <div class="cowin-parameter-section">
          <h3>Output Parameter</h3>
          <label class="cowin-node-dialog-field">
            <span>
              参数名称<strong>*</strong>
            </span>
            <input
              class="cowin-node-dialog-control"
              placeholder="例如：request"
              value={config[CONFIG_KEYS.manualName] ?? ''}
              onInput={(event) =>
                props.onUpdateConfig(CONFIG_KEYS.manualName, getInputValue(event))
              }
            />
          </label>
          <label class="cowin-node-dialog-field">
            <span>参数类型</span>
            <select
              class="cowin-node-dialog-control"
              value={config[CONFIG_KEYS.manualType] || VARIABLE_TYPES[0]}
              onChange={(event) =>
                props.onUpdateConfig(CONFIG_KEYS.manualType, getInputValue(event))
              }
            >
              {VARIABLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label class="cowin-node-dialog-field">
            <span>默认值</span>
            <textarea
              class="cowin-node-dialog-control"
              placeholder="调试时作为起始入参"
              value={config[CONFIG_KEYS.manualValue] ?? ''}
              onInput={(event) =>
                props.onUpdateConfig(CONFIG_KEYS.manualValue, getInputValue(event))
              }
            />
          </label>
        </div>
      )
    }
  }
})
