import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const externalRuleNode = createNodeModule({
  type: 'external-rule',
  label: 'External Rule',
  icon: '☍',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 530,
  color: NODE_COLORS.blue
})
