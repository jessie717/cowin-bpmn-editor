import { getNodeModule } from '../nodes/registry'
import type { NodeOutputVariable } from '../nodes/types'
import type { SelectedNode } from './types'

export {
  CONFIG_KEYS,
  VARIABLE_TYPES,
  createParameterId,
  parseParameterList,
  stringifyParameterList
} from '../nodes/shared/config'
export type {
  FunctionInputParameter,
  FunctionOutputParameter
} from '../nodes/shared/config'

export interface WorkflowVariable extends NodeOutputVariable {}

export function getNodeOutputVariables(node?: SelectedNode | null) {
  if (!node) {
    return []
  }

  const moduleResolver = getNodeModule(node.definition.type)?.getOutputVariables

  if (moduleResolver) {
    return moduleResolver(node)
  }

  return Object.entries(node.config)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => ({
      id: `${node.id}:${key}`,
      name: key,
      type: 'String',
      value,
      nodeId: node.id,
      nodeLabel: node.definition.label
    }))
}
