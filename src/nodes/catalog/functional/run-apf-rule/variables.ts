import type { NodeOutputContext, NodeOutputVariable } from '../../../types'
import { RUN_APF_RULE_CONFIG_KEYS, getRunApfRuleService } from './config'

export function getRunApfRuleOutputVariables(
  node: NodeOutputContext
): NodeOutputVariable[] {
  const service = getRunApfRuleService(
    node.config[RUN_APF_RULE_CONFIG_KEYS.serviceName]
  )

  return service.outputArguments.map((argument) => ({
    id: `${node.id}:output:${argument.id}`,
    name: argument.name,
    type: argument.type,
    value: '',
    nodeId: node.id,
    nodeLabel: node.definition.label
  }))
}
