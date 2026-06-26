import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const sqlNode = createNodeModule({
  type: 'sql',
  label: 'SQL',
  icon: '◯',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 540,
  color: NODE_COLORS.blue
})
