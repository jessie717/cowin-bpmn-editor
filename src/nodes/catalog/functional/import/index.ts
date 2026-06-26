import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const importNode = createNodeModule({
  type: 'import',
  label: 'Import',
  icon: '⇩',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 450,
  color: NODE_COLORS.blue
})
