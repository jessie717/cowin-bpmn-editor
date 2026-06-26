import { createNodeDefinition } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'
import type { NodeModule } from '../../../types'
import { ManualStartConfigPanel } from './ConfigPanel'
import { getManualStartOutputVariables } from './variables'
import { validateManualStart } from './validation'

const definition = createNodeDefinition({
  type: 'manual-start',
  label: 'Manual Start',
  icon: '▶',
  group: 'startup',
  groupLabel: '启动触发节点',
  order: 10,
  color: NODE_COLORS.orange,
  bpmnType: 'bpmn:StartEvent',
  maxIncoming: 0
})

export const manualStartNode: NodeModule = {
  definition,
  ConfigPanel: ManualStartConfigPanel,
  validate: validateManualStart,
  getOutputVariables: getManualStartOutputVariables
}
