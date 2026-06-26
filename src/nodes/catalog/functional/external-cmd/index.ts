import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const externalCmdNode = createNodeModule({
  type: 'external-cmd',
  label: 'External CMD',
  icon: '>',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 590,
  color: NODE_COLORS.blue
})
