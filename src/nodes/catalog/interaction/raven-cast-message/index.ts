import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const ravenCastMessageNode = createNodeModule({
  type: 'raven-cast-message',
  label: 'Raven Cast Message',
  icon: '✈',
  group: 'interaction',
  groupLabel: 'Interaction节点',
  order: 270,
  color: NODE_COLORS.yellow
})
