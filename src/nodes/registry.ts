import { allNodeDefinitions } from './paletteNodes'
import type { CustomNodeType, NodeDefinition } from './types'

const definitions = allNodeDefinitions

const definitionMap = new Map<CustomNodeType, NodeDefinition>(
  definitions.map((definition) => [definition.type, definition])
)

export function getNodeDefinitions() {
  return definitions
    .filter((definition) => definition.palette.visible !== false)
    .slice()
    .sort((a, b) => a.palette.order - b.palette.order)
}

export function getNodeDefinition(type?: string | null) {
  if (!type) {
    return undefined
  }

  return definitionMap.get(type as CustomNodeType)
}

export function getBusinessNodeType(
  businessObject: any
): CustomNodeType | undefined {
  return businessObject?.nodeType ?? businessObject?.$attrs?.['cowin:nodeType']
}

export function getElementNodeType(element: any): CustomNodeType | undefined {
  return getBusinessNodeType(element?.businessObject)
}

export function getElementDefinition(element: any) {
  return getNodeDefinition(getElementNodeType(element))
}

export function readNodeConfig(element: any) {
  const definition = getElementDefinition(element)
  const rawConfig =
    element?.businessObject?.config ??
    element?.businessObject?.$attrs?.['cowin:config']

  let parsedConfig: Record<string, string> = {}

  if (typeof rawConfig === 'string' && rawConfig.trim()) {
    try {
      parsedConfig = JSON.parse(rawConfig) as Record<string, string>
    } catch {
      parsedConfig = {}
    }
  }

  return {
    ...(definition?.defaultProperties ?? {}),
    ...parsedConfig
  }
}
