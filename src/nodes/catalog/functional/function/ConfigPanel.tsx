import { defineComponent } from 'vue'
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
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

function getInputValue(event: Event) {
  return (
    event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  ).value
}

function renderVariableTypeSelect(
  value: string,
  onChange: (value: string) => void
) {
  return (
    <select
      class="cowin-parameter-control"
      value={value || VARIABLE_TYPES[0]}
      onChange={(event) => onChange(getInputValue(event))}
    >
      {VARIABLE_TYPES.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
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
    onUpdateConfig: {
      type: Function as PropType<NodeConfigPanelProps['onUpdateConfig']>,
      required: true
    }
  },
  setup(props) {
    function readInputParameters() {
      return parseParameterList<FunctionInputParameter>(
        props.node.config[CONFIG_KEYS.functionInputs]
      )
    }

    function readOutputParameters() {
      return parseParameterList<FunctionOutputParameter>(
        props.node.config[CONFIG_KEYS.functionOutputs]
      )
    }

    function updateInputParameter(
      id: string,
      patch: Partial<FunctionInputParameter>
    ) {
      const nextParameters = readInputParameters().map((parameter) =>
        parameter.id === id ? { ...parameter, ...patch } : parameter
      )

      props.onUpdateConfig(
        CONFIG_KEYS.functionInputs,
        stringifyParameterList(nextParameters)
      )
    }

    function updateOutputParameter(
      id: string,
      patch: Partial<FunctionOutputParameter>
    ) {
      const nextParameters = readOutputParameters().map((parameter) =>
        parameter.id === id ? { ...parameter, ...patch } : parameter
      )

      props.onUpdateConfig(
        CONFIG_KEYS.functionOutputs,
        stringifyParameterList(nextParameters)
      )
    }

    function addInputParameter() {
      props.onUpdateConfig(
        CONFIG_KEYS.functionInputs,
        stringifyParameterList([
          ...readInputParameters(),
          {
            id: createParameterId('input'),
            name: '',
            type: VARIABLE_TYPES[0],
            source: props.availableVariables[0]?.id ?? '',
            expression: ''
          }
        ])
      )
    }

    function addOutputParameter() {
      props.onUpdateConfig(
        CONFIG_KEYS.functionOutputs,
        stringifyParameterList([
          ...readOutputParameters(),
          {
            id: createParameterId('output'),
            name: '',
            type: VARIABLE_TYPES[0],
            expression: ''
          }
        ])
      )
    }

    function removeInputParameter(id: string) {
      props.onUpdateConfig(
        CONFIG_KEYS.functionInputs,
        stringifyParameterList(
          readInputParameters().filter((parameter) => parameter.id !== id)
        )
      )
    }

    function removeOutputParameter(id: string) {
      props.onUpdateConfig(
        CONFIG_KEYS.functionOutputs,
        stringifyParameterList(
          readOutputParameters().filter((parameter) => parameter.id !== id)
        )
      )
    }

    function renderSourceOptions() {
      return (
        <>
          <option value="">手动输入</option>
          {props.availableVariables.map((variable) => (
            <option key={variable.id} value={variable.id}>
              {variable.nodeLabel ? `${variable.nodeLabel}.` : ''}
              {variable.name}
            </option>
          ))}
        </>
      )
    }

    return () => {
      const inputParameters = readInputParameters()
      const outputParameters = readOutputParameters()

      return (
        <div class="cowin-parameter-section">
          <div class="cowin-parameter-title-row">
            <h3>Input Parameters</h3>
            <button type="button" onClick={addInputParameter}>
              Add
            </button>
          </div>
          <table class="cowin-parameter-table">
            <thead>
              <tr>
                <th>参数名称</th>
                <th>类型</th>
                <th>来源参数</th>
                <th>转换表达式</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {inputParameters.length ? (
                inputParameters.map((parameter) => (
                  <tr key={parameter.id}>
                    <td>
                      <input
                        class="cowin-parameter-control"
                        value={parameter.name}
                        onInput={(event) =>
                          updateInputParameter(parameter.id, {
                            name: getInputValue(event)
                          })
                        }
                      />
                    </td>
                    <td>
                      {renderVariableTypeSelect(parameter.type, (value) =>
                        updateInputParameter(parameter.id, { type: value })
                      )}
                    </td>
                    <td>
                      <select
                        class="cowin-parameter-control"
                        value={parameter.source}
                        onChange={(event) =>
                          updateInputParameter(parameter.id, {
                            source: getInputValue(event)
                          })
                        }
                      >
                        {renderSourceOptions()}
                      </select>
                    </td>
                    <td>
                      <input
                        class="cowin-parameter-control"
                        placeholder="例如：source.userId"
                        value={parameter.expression}
                        onInput={(event) =>
                          updateInputParameter(parameter.id, {
                            expression: getInputValue(event)
                          })
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        class="cowin-parameter-remove"
                        onClick={() => removeInputParameter(parameter.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colspan={5} class="cowin-parameter-empty">
                    暂无输入参数
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div class="cowin-parameter-title-row">
            <h3>Output Parameters</h3>
            <button type="button" onClick={addOutputParameter}>
              Add
            </button>
          </div>
          <table class="cowin-parameter-table">
            <thead>
              <tr>
                <th>参数名称</th>
                <th>类型</th>
                <th>处理表达式</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {outputParameters.length ? (
                outputParameters.map((parameter) => (
                  <tr key={parameter.id}>
                    <td>
                      <input
                        class="cowin-parameter-control"
                        value={parameter.name}
                        onInput={(event) =>
                          updateOutputParameter(parameter.id, {
                            name: getInputValue(event)
                          })
                        }
                      />
                    </td>
                    <td>
                      {renderVariableTypeSelect(parameter.type, (value) =>
                        updateOutputParameter(parameter.id, { type: value })
                      )}
                    </td>
                    <td>
                      <input
                        class="cowin-parameter-control"
                        placeholder="例如：input.amount * 100"
                        value={parameter.expression}
                        onInput={(event) =>
                          updateOutputParameter(parameter.id, {
                            expression: getInputValue(event)
                          })
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        class="cowin-parameter-remove"
                        onClick={() => removeOutputParameter(parameter.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colspan={4} class="cowin-parameter-empty">
                    暂无输出参数
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )
    }
  }
})
