import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const resultNode = createNodeModule({
  type: 'result',
  label: 'Result',
  icon: '{x}',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 500,
  color: NODE_COLORS.blue
})
