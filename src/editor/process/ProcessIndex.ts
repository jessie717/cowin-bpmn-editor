import { getElementDefinition, readNodeConfig } from '../../nodes/registry'

export interface IndexedNode {
  id: string
  type: string
  label: string
  incoming: string[]
  outgoing: string[]
  config: Record<string, string>
}

export class ProcessIndex {
  private nodes = new Map<string, IndexedNode>()

  rebuild(modeler: any) {
    const elementRegistry = modeler.get('elementRegistry')
    const nextNodes = new Map<string, IndexedNode>()

    for (const element of elementRegistry.getAll()) {
      const definition = getElementDefinition(element)

      if (!definition) {
        continue
      }

      nextNodes.set(element.id, {
        id: element.id,
        type: definition.type,
        label: element.businessObject?.name || definition.label,
        incoming: (element.incoming ?? []).map(
          (connection: any) => connection.id
        ),
        outgoing: (element.outgoing ?? []).map(
          (connection: any) => connection.id
        ),
        config: readNodeConfig(element)
      })
    }

    this.nodes = nextNodes
  }

  getNode(id: string) {
    return this.nodes.get(id)
  }

  getAllNodes() {
    return Array.from(this.nodes.values())
  }
}
