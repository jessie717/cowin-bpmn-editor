import { createNodeDefinition } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'
import type { NodeModule } from '../../../types'
import { FunctionConfigPanel } from './ConfigPanel'
import { getFunctionOutputVariables } from './variables'
import { validateFunction } from './validation'

const definition = createNodeDefinition({
  type: 'function',
  label: 'Function',
  icon: 'ƒx',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 480,
  color: NODE_COLORS.blue
})

export const functionNode: NodeModule = {
  definition,
  ConfigPanel: FunctionConfigPanel,
  validate: validateFunction,
  getOutputVariables: getFunctionOutputVariables
}
