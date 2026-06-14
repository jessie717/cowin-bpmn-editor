/// <reference types="vite/client" />

declare module 'bpmn-js/lib/Modeler' {
  const Modeler: any
  export default Modeler
}

declare module 'diagram-js/lib/draw/BaseRenderer' {
  const BaseRenderer: any
  export default BaseRenderer
}

declare module 'diagram-js/lib/features/rules/RuleProvider' {
  const RuleProvider: any
  export default RuleProvider
}

declare module 'diagram-js-minimap' {
  const minimapModule: any
  export default minimapModule
}

declare module 'tiny-svg' {
  export function append(parent: SVGElement, child: SVGElement): SVGElement
  export function attr(node: SVGElement, attrs: Record<string, unknown>): void
  export function create(
    name: string,
    attrs?: Record<string, unknown>
  ): SVGElement
}
