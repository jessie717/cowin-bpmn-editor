import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const saveNode = createNodeModule({
  type: 'save',
  label: 'Save',
  icon: '▣',
  group: 'interaction',
  groupLabel: 'Interaction节点',
  order: 280,
  color: NODE_COLORS.yellow
})
