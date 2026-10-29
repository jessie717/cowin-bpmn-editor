import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'
import { RunApfRuleConfigPanel } from './ConfigPanel'
import { getRunApfRuleOutputVariables } from './variables'

export const runApfRuleNode = createNodeModule(
  {
    type: 'run-apf-rule',
    label: 'RunApfRule',
    icon: '▧',
    group: 'functional',
    groupLabel: 'Functional节点',
    order: 525,
    color: NODE_COLORS.blue
  },
  {
    ConfigPanel: RunApfRuleConfigPanel,
    getOutputVariables: getRunApfRuleOutputVariables
  }
)
