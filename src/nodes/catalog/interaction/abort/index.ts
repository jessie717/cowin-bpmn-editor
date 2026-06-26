import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const abortNode = createNodeModule({
  type: 'abort',
  label: 'Abort',
  icon: '⊘',
  group: 'interaction',
  groupLabel: 'Interaction节点',
  order: 210,
  color: NODE_COLORS.yellow
})
