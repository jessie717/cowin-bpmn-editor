import { VARIABLE_TYPES, parseParameterList } from '../../../shared/config'
import type { NodeOutputContext, NodeOutputVariable } from '../../../types'
import { OR_CONFIG_KEYS, type OrOutputVariable } from './config'

export function getOrOutputVariables(
  node: NodeOutputContext
): NodeOutputVariable[] {
  return parseParameterList<OrOutputVariable>(
    node.config[OR_CONFIG_KEYS.outputVariables]
  )
    .filter((variable) => variable.name.trim())
    .map((variable) => ({
      id: variable.id,
      name: variable.name,
      type: variable.type || VARIABLE_TYPES[0],
      value: variable.value,
      expression: variable.sourceId,
      nodeId: node.id,
      nodeLabel: node.definition.label
    }))
}
