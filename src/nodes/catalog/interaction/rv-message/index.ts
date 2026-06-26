import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const rvMessageNode = createNodeModule({
  type: 'rv-message',
  label: 'RV Message',
  icon: 'RV',
  group: 'interaction',
  groupLabel: 'Interaction节点',
  order: 250,
  color: NODE_COLORS.yellow
})
