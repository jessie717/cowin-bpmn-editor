import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const emailNode = createNodeModule({
  type: 'email',
  label: 'Email',
  icon: '✉',
  group: 'interaction',
  groupLabel: 'Interaction节点',
  order: 290,
  color: NODE_COLORS.yellow
})
