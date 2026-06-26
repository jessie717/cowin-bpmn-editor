import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const exportSqlNode = createNodeModule({
  type: 'export-sql',
  label: 'Export SQL',
  icon: '◉',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 550,
  color: NODE_COLORS.blue
})
