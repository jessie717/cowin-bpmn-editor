import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const runRuleNode = createNodeModule({
  type: 'run-rule',
  label: 'Run Rule',
  icon: '▧',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 520,
  color: NODE_COLORS.blue
})
