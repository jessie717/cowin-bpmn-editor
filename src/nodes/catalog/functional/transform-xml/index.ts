import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const transformXmlNode = createNodeModule({
  type: 'transform-xml',
  label: 'Transform XML',
  icon: 'XML',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 490,
  color: NODE_COLORS.blue
})
