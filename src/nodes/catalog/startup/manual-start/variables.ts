import {
  CONFIG_KEYS,
  VARIABLE_TYPES,
  parseParameterList,
  type ManualStartParameter
} from '../../../shared/config'
import type { NodeOutputContext, NodeOutputVariable } from '../../../types'

function readManualStartParameters(node: NodeOutputContext) {
  const parameters = parseParameterList<ManualStartParameter>(
    node.config[CONFIG_KEYS.manualParameters]
  )

  if (parameters.length) {
    return parameters
  }

  const legacyName = node.config[CONFIG_KEYS.manualName]?.trim()

  return legacyName
    ? [
        {
          id: `${node.id}:${legacyName}`,
          name: legacyName,
          type: node.config[CONFIG_KEYS.manualType] || VARIABLE_TYPES[0]
        }
      ]
    : []
}

export function getManualStartOutputVariables(
  node: NodeOutputContext
): NodeOutputVariable[] {
  return readManualStartParameters(node)
    .filter((parameter) => parameter.name.trim())
    .map((parameter) => ({
      id: parameter.id,
      name: parameter.name,
      type: parameter.type || VARIABLE_TYPES[0],
      value: '',
      nodeId: node.id,
      nodeLabel: node.definition.label
    }))
}
