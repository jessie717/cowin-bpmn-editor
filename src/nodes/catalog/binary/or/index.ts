import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'
import { OrConfigPanel } from './ConfigPanel'
import { getOrOutputVariables } from './variables'

export const orNode = createNodeModule(
  {
    type: 'or',
    label: 'Or',
    icon: 'OR',
    group: 'binary',
    groupLabel: 'Binary节点',
    order: 120,
    color: NODE_COLORS.green,
    bpmnType: 'bpmn:ExclusiveGateway'
  },
  {
    ConfigPanel: OrConfigPanel,
    getOutputVariables: getOrOutputVariables
  }
)
