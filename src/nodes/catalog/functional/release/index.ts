import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const releaseNode = createNodeModule({
  type: 'release',
  label: 'Release',
  icon: '▣',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 470,
  color: NODE_COLORS.blue
})
