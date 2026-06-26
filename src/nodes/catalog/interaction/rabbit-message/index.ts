import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const rabbitMessageNode = createNodeModule({
  type: 'rabbit-message',
  label: 'Rabbit Message',
  icon: '!',
  group: 'interaction',
  groupLabel: 'Interaction节点',
  order: 260,
  color: NODE_COLORS.yellow
})
