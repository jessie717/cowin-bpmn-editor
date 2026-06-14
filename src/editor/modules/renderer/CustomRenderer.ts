import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer'
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate
} from 'tiny-svg'
import { CANVAS_NODE_ICON_SIZE } from '../../../nodes/nodeLayout'
import { getElementDefinition } from '../../../nodes/registry'
import { getLabel } from '../util'

const HIGH_PRIORITY = 2000
const ICON_SIZE = CANVAS_NODE_ICON_SIZE
const LABEL_GAP = 10
const LABEL_BASELINE = ICON_SIZE + LABEL_GAP + 14

export function CustomRenderer(this: any, eventBus: any) {
  BaseRenderer.call(this, eventBus, HIGH_PRIORITY)
}

CustomRenderer.$inject = ['eventBus']
CustomRenderer.prototype = Object.create(BaseRenderer.prototype)
CustomRenderer.prototype.constructor = CustomRenderer

CustomRenderer.prototype.canRender = function (element: any) {
  return !element.labelTarget && Boolean(getElementDefinition(element))
}

CustomRenderer.prototype.drawShape = function (
  parentNode: SVGElement,
  element: any
) {
  const definition = getElementDefinition(element)

  if (!definition) {
    return undefined
  }

  const group = svgCreate('g')
  const label = getLabel(element)

  const hitArea = svgCreate('rect', {
    class: 'cowin-canvas-node-hit',
    width: ICON_SIZE,
    height: ICON_SIZE,
    rx: 0,
    ry: 0,
    fill: '#ffffff',
    stroke: 'transparent',
    'stroke-width': 1
  })
  svgAppend(group, hitArea)

  const iconBackground = svgCreate('rect', {
    class: 'cowin-canvas-icon-bg',
    x: 0,
    y: 0,
    width: ICON_SIZE,
    height: ICON_SIZE,
    fill: definition.renderer.stroke
  })
  svgAppend(group, iconBackground)

  if (definition.renderer.iconUrl) {
    const iconImage = svgCreate('image', {
      class: 'cowin-canvas-icon-image',
      x: 0,
      y: 0,
      width: ICON_SIZE,
      height: ICON_SIZE,
      href: definition.renderer.iconUrl
    })
    svgAppend(group, iconImage)
  } else {
    const iconText = svgCreate('text', {
      x: ICON_SIZE / 2,
      y: 14,
      fill: '#ffffff',
      'font-size': definition.renderer.icon.length > 1 ? 9 : 12,
      'font-weight': 700,
      'text-anchor': 'middle'
    })
    iconText.textContent = definition.renderer.icon
    svgAppend(group, iconText)
  }

  const text = svgCreate('text', {
    class: 'cowin-canvas-label',
    x: ICON_SIZE / 2,
    y: LABEL_BASELINE,
    fill: '#414141',
    'font-size': 14,
    'font-weight': 600,
    'text-anchor': 'middle'
  })
  text.textContent = label.length > 24 ? `${label.slice(0, 24)}...` : label
  svgAppend(group, text)

  svgAttr(group, {
    class: `cowin-node cowin-node-${definition.type}`
  })
  svgAppend(parentNode, group)

  return group
}

CustomRenderer.prototype.getShapePath = function (shape: any) {
  return `M 0 0 L ${shape.width} 0 L ${shape.width} ${shape.height} L 0 ${shape.height} Z`
}
