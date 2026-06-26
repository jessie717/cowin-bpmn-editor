import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const webServiceNode = createNodeModule({
  type: 'web-service',
  label: 'Web Service',
  icon: '◎',
  group: 'interaction',
  groupLabel: 'Interaction节点',
  order: 230,
  color: NODE_COLORS.yellow
})
