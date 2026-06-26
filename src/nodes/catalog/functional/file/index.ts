import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const fileNode = createNodeModule({
  type: 'file',
  label: 'File',
  icon: '◻',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 560,
  color: NODE_COLORS.blue
})
