import {
  CONFIG_KEYS,
  VARIABLE_TYPES,
  parseParameterList,
  type FunctionOutputParameter
} from '../../../shared/config'
import type { NodeOutputContext, NodeOutputVariable } from '../../../types'

export function getFunctionOutputVariables(
  node: NodeOutputContext
): NodeOutputVariable[] {
  return parseParameterList<FunctionOutputParameter>(
    node.config[CONFIG_KEYS.functionOutputs]
  )
    .filter((parameter) => parameter.name.trim())
    .map((parameter) => ({
      id: parameter.id,
      name: parameter.name,
      type: parameter.type || VARIABLE_TYPES[0],
      value: parameter.expression,
      expression: parameter.expression,
      nodeId: node.id,
      nodeLabel: node.definition.label
    }))
}
