import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const waitForNode = createNodeModule({
  type: 'wait-for',
  label: 'Wait For',
  icon: '◷',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 420,
  color: NODE_COLORS.blue
})
