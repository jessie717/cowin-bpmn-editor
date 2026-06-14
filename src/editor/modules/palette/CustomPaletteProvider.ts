import { getNodeDefinitions } from '../../../nodes/registry'
import type { CustomNodeType } from '../../../nodes/types'
import { createShape } from '../util'

const searchIconUrl = new URL(
  '../../../assets/node-svg/search.svg',
  import.meta.url
).href

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function CustomPaletteProvider(
  this: any,
  palette: any,
  create: any,
  elementFactory: any,
  bpmnFactory: any,
  handTool: any,
  lassoTool: any,
  globalConnect: any
) {
  this._create = create
  this._elementFactory = elementFactory
  this._bpmnFactory = bpmnFactory
  this._handTool = handTool
  this._lassoTool = lassoTool
  this._globalConnect = globalConnect

  palette.registerProvider(this)
}

CustomPaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'bpmnFactory',
  'handTool',
  'lassoTool',
  'globalConnect'
]

CustomPaletteProvider.prototype.getPaletteEntries = function () {
  const create = this._create
  const elementFactory = this._elementFactory
  const bpmnFactory = this._bpmnFactory

  const entries: Record<string, unknown> = {
    header: {
      group: 'header',
      separator: true,
      html: '<div class="cowin-palette-header">Node</div>'
    },
    search: {
      group: 'header',
      separator: true,
      html: `<div class="cowin-palette-search"><img src="${searchIconUrl}" alt="" /><span>Search</span></div>`
    }
  }

  const renderedGroups = new Set<string>()

  for (const definition of getNodeDefinitions()) {
    if (!renderedGroups.has(definition.palette.group)) {
      renderedGroups.add(definition.palette.group)
      entries[`group-${definition.palette.group}`] = {
        group: definition.palette.group,
        separator: true,
        html: `<div class="cowin-palette-group-title">${escapeHtml(definition.palette.groupLabel ?? definition.palette.group)}</div>`
      }
    }

    const start = (event: MouseEvent) => {
      create.start(
        event,
        createShape(
          elementFactory,
          bpmnFactory,
          definition.type as CustomNodeType
        )
      )
    }

    entries[`create-${definition.type}`] = {
      group: definition.palette.group,
      className: `cowin-palette-entry cowin-palette-${definition.type}${definition.type === 'schedule' ? ' cowin-palette-entry-active' : ''}`,
      html: `<div class="entry cowin-palette-entry" draggable="true" style="--cowin-node-color: ${definition.palette.color ?? definition.renderer.stroke}"><span class="cowin-palette-icon">${
        definition.palette.iconUrl
          ? `<img src="${definition.palette.iconUrl}" alt="" />`
          : escapeHtml(definition.palette.icon)
      }</span><span class="cowin-palette-label">${escapeHtml(definition.label)}</span></div>`,
      title: definition.label,
      action: {
        click: start,
        dragstart: start
      }
    }
  }

  return entries
}
