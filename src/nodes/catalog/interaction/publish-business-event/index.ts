import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const publishBusinessEventNode = createNodeModule({
  type: 'publish-business-event',
  label: 'Publish Business Event',
  icon: 'ϟ',
  group: 'interaction',
  groupLabel: 'Interaction节点',
  order: 310,
  color: NODE_COLORS.yellow
})
