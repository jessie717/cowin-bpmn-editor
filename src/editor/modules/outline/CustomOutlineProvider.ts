import { attr as svgAttr, create as svgCreate } from 'tiny-svg'
import { CANVAS_NODE_ICON_SIZE } from '../../../nodes/nodeLayout'
import { getElementDefinition } from '../../../nodes/registry'

const OUTLINE_PADDING = 4

export function CustomOutlineProvider(this: any, outline: any) {
  outline.registerProvider(2000, this)
}

CustomOutlineProvider.$inject = ['outline']

CustomOutlineProvider.prototype.getOutline = function (element: any) {
  if (!getElementDefinition(element)) {
    return undefined
  }

  return svgCreate('rect', {
    class: 'djs-outline',
    rx: 0,
    ry: 0
  })
}

CustomOutlineProvider.prototype.updateOutline = function (
  element: any,
  outline: SVGElement
) {
  if (!getElementDefinition(element)) {
    return false
  }

  svgAttr(outline, {
    x: -OUTLINE_PADDING,
    y: -OUTLINE_PADDING,
    width: Math.max(element.width, CANVAS_NODE_ICON_SIZE) + OUTLINE_PADDING * 2,
    height:
      Math.max(element.height, CANVAS_NODE_ICON_SIZE) + OUTLINE_PADDING * 2
  })

  return true
}
