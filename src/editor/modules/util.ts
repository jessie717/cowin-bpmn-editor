import { getNodeDefinition, readNodeConfig } from '../../nodes/registry'
import type { CustomNodeType, NodeDefinition } from '../../nodes/types'

export function createBusinessObject(
  bpmnFactory: any,
  definition: NodeDefinition,
  overrides: Record<string, unknown> = {}
) {
  return bpmnFactory.create(definition.bpmnType, {
    nodeType: definition.type,
    config: JSON.stringify(definition.defaultProperties),
    ...overrides
  })
}

export function createShape(
  elementFactory: any,
  bpmnFactory: any,
  type: CustomNodeType
) {
  const definition = getNodeDefinition(type)

  if (!definition) {
    throw new Error(`Unknown custom node type: ${type}`)
  }

  return elementFactory.createShape({
    type: definition.bpmnType,
    width: definition.defaultSize.width,
    height: definition.defaultSize.height,
    businessObject: createBusinessObject(bpmnFactory, definition)
  })
}

export function isCustomElement(element: any) {
  return Boolean(
    element?.businessObject?.nodeType ??
    element?.businessObject?.$attrs?.['cowin:nodeType']
  )
}

export function getLabel(element: any) {
  const definition = getNodeDefinition(element?.businessObject?.nodeType)
  const config = readNodeConfig(element)

  return (
    element?.businessObject?.name ||
    config.label ||
    definition?.label ||
    '未知节点'
  )
}
