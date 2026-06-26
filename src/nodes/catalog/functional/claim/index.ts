import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const claimNode = createNodeModule({
  type: 'claim',
  label: 'Claim',
  icon: '▣',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 460,
  color: NODE_COLORS.blue
})
