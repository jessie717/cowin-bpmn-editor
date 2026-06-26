import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const corbaNode = createNodeModule({
  type: 'corba',
  label: 'Corba',
  icon: 'ORB',
  group: 'interaction',
  groupLabel: 'Interaction节点',
  order: 240,
  color: NODE_COLORS.yellow
})
