import type { NodeOutputContext, NodeOutputVariable } from '../../../types'
import { parseParameterList } from '../../../shared/config'
import {
  RUN_APF_RULE_CONFIG_KEYS,
  getRunApfRuleService,
  type RunApfRuleOutputArgument
} from './config'

export function getRunApfRuleOutputVariables(
  node: NodeOutputContext
): NodeOutputVariable[] {
  const service = getRunApfRuleService(
    node.config[RUN_APF_RULE_CONFIG_KEYS.serviceName]
  )
  const savedArguments = parseParameterList<RunApfRuleOutputArgument>(
    node.config[RUN_APF_RULE_CONFIG_KEYS.outputArguments]
  )
  const outputArguments = savedArguments.length
    ? savedArguments
    : service.outputArguments

  return outputArguments.map((argument) => ({
    id: `${node.id}:output:${argument.id}`,
    name: argument.name,
    type: argument.type,
    value: '',
    nodeId: node.id,
    nodeLabel: node.definition.label
  }))
}
