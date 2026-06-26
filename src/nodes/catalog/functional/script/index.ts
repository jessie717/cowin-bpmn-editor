import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const scriptNode = createNodeModule({
  type: 'script',
  label: 'Script',
  icon: '⌞',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 580,
  color: NODE_COLORS.blue
})
