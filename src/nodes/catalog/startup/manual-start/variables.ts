import { CONFIG_KEYS, VARIABLE_TYPES } from '../../../shared/config'
import type { NodeOutputContext, NodeOutputVariable } from '../../../types'

export function getManualStartOutputVariables(
  node: NodeOutputContext
): NodeOutputVariable[] {
  const name = node.config[CONFIG_KEYS.manualName]?.trim()

  if (!name) {
    return []
  }

  return [
    {
      id: `${node.id}:${name}`,
      name,
      type: node.config[CONFIG_KEYS.manualType] || VARIABLE_TYPES[0],
      value: node.config[CONFIG_KEYS.manualValue] || '',
      nodeId: node.id,
      nodeLabel: node.definition.label
    }
  ]
}
