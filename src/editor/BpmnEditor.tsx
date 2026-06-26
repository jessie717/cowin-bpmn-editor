import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'diagram-js-minimap/assets/diagram-js-minimap.css'
import 'element-plus/es/components/message/style/css'

import { ElMessage } from 'element-plus'
import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { getElementDefinition, readNodeConfig } from '../nodes/registry'
import type { ValidationIssue } from '../nodes/types'
import { EditorToolbar } from './components/EditorToolbar'
import { EditorFooter } from './components/EditorFooter'
import { EditorMiniMap } from './components/EditorMiniMap'
import { NodeConfigDialog } from './components/NodeConfigDialog'
import { OutputVariablesPanel } from './components/OutputVariablesPanel'
import { createModeler } from './createModeler'
import { MOCK_PROCESS_200_XML } from './mock/mockProcess200'
import { ProcessIndex } from './process/ProcessIndex'
import { DEFAULT_PROCESS_XML } from './sampleXml'
import type { SelectedNode } from './types'
import {
  applyValidationMarkers,
  validateProcess
} from './validation/validateProcess'
import { getNodeOutputVariables, type WorkflowVariable } from './variables'

export const BpmnEditor = defineComponent({
  name: 'BpmnEditor',
  setup() {
    const canvasRef = ref<HTMLDivElement | null>(null)
    const modelerRef = ref<any>(null)
    const selectedNode = ref<SelectedNode | null>(null)
    const outputNode = ref<SelectedNode | null>(null)
    const configNode = ref<SelectedNode | null>(null)
    const debugMode = ref(false)
    const debugBreakpointIds = ref<Set<string>>(new Set())
    const breakpointVersion = ref(0)
    const issues = ref<ValidationIssue[]>([])
    const processIndex = new ProcessIndex()
    let hoverBreakpointOverlayId: string | null = null
    let hoverBreakpointOverlayElement: any = null
    let hoverBreakpointHideTimer: ReturnType<typeof window.setTimeout> | null =
      null
    const persistentBreakpointOverlayIds = new Map<string, string>()

    const outputVariablesNode = computed(
      () => outputNode.value ?? selectedNode.value
    )
    const debugOutputNodes = computed<SelectedNode[]>(() => {
      breakpointVersion.value

      if (!debugMode.value) {
        return []
      }

      return getSortedDebugBreakpointElements()
        .map((element) => readSelectedNode(element))
        .filter(Boolean) as SelectedNode[]
    })
    const configNodeAvailableVariables = computed<WorkflowVariable[]>(() => {
      const modeler = modelerRef.value
      const node = configNode.value

      if (!modeler || !node) {
        return []
      }

      const element = modeler.get('elementRegistry').get(node.id)

      if (!element) {
        return []
      }

      const variables = new Map<string, WorkflowVariable>()

      for (const connection of element.incoming ?? []) {
        const sourceNode = readSelectedNode(connection.source)

        for (const variable of getNodeOutputVariables(sourceNode)) {
          variables.set(variable.id, {
            ...variable,
            nodeId: connection.source.id,
            nodeLabel:
              connection.source.businessObject?.name ||
              sourceNode?.definition.label ||
              variable.nodeLabel
          })
        }
      }

      return Array.from(variables.values())
    })

    function readSelectedNode(element?: any): SelectedNode | null {
      const definition = getElementDefinition(element)

      if (!element || !definition) {
        return null
      }

      return {
        id: element.id,
        name: element.businessObject?.name || definition.label,
        definition,
        config: readNodeConfig(element)
      }
    }

    function syncSelectedNode(element?: any) {
      selectedNode.value = readSelectedNode(element)
      outputNode.value = null
    }

    function canDebugElement(element?: any) {
      const definition = getElementDefinition(element)

      return Boolean(definition && definition.type !== 'manual-start')
    }

    function hasProcessNodes() {
      const modeler = modelerRef.value

      if (!modeler) {
        return false
      }

      return modeler
        .get('elementRegistry')
        .getAll()
        .some((element: any) => Boolean(getElementDefinition(element)))
    }

    function compareElementPosition(a: any, b: any) {
      return (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0)
    }

    function getSortedDebugBreakpointElements() {
      const modeler = modelerRef.value

      if (!modeler || !debugBreakpointIds.value.size) {
        return []
      }

      const elementRegistry = modeler.get('elementRegistry')
      const allElements = elementRegistry
        .getAll()
        .filter((element: any) => getElementDefinition(element))
      const breakpointElements = Array.from(debugBreakpointIds.value)
        .map((elementId) => elementRegistry.get(elementId))
        .filter((element) => element && canDebugElement(element))
      const breakpointIds = new Set(
        breakpointElements.map((element) => element.id)
      )
      const orderedBreakpointIds: string[] = []
      const visited = new Set<string>()
      const roots = allElements
        .filter((element: any) => {
          const definition = getElementDefinition(element)
          return (
            definition?.type === 'manual-start' ||
            (element.incoming?.length ?? 0) === 0
          )
        })
        .sort(compareElementPosition)

      function visit(element: any) {
        if (!element || visited.has(element.id)) {
          return
        }

        visited.add(element.id)

        if (breakpointIds.has(element.id)) {
          orderedBreakpointIds.push(element.id)
        }

        for (const connection of element.outgoing ?? []) {
          visit(connection.target)
        }
      }

      const traversalRoots = roots.length
        ? roots
        : allElements.sort(compareElementPosition)

      for (const root of traversalRoots) {
        visit(root)
      }

      const orderedSet = new Set(orderedBreakpointIds)
      const remainingElements = breakpointElements
        .filter((element) => !orderedSet.has(element.id))
        .sort(compareElementPosition)

      return [
        ...orderedBreakpointIds
          .map((elementId) => elementRegistry.get(elementId))
          .filter(Boolean),
        ...remainingElements
      ]
    }

    function bumpBreakpointVersion() {
      breakpointVersion.value += 1
    }

    function updateDebugBreakpointIds(nextIds: Set<string>) {
      debugBreakpointIds.value = nextIds
      bumpBreakpointVersion()
    }

    function hasDebugBreakpoint(elementId: string) {
      return debugBreakpointIds.value.has(elementId)
    }

    function clearBreakpointHideTimer() {
      if (!hoverBreakpointHideTimer) {
        return
      }

      window.clearTimeout(hoverBreakpointHideTimer)
      hoverBreakpointHideTimer = null
    }

    function removeOverlay(overlayId: string) {
      try {
        modelerRef.value?.get('overlays').remove(overlayId)
      } catch {
        // The overlay may already be removed when its BPMN element is deleted.
      }
    }

    function clearHoverBreakpointOverlay() {
      clearBreakpointHideTimer()

      if (hoverBreakpointOverlayId) {
        removeOverlay(hoverBreakpointOverlayId)
      }

      hoverBreakpointOverlayId = null
      hoverBreakpointOverlayElement = null
    }

    function scheduleBreakpointOverlayClear() {
      clearBreakpointHideTimer()
      hoverBreakpointHideTimer = window.setTimeout(
        clearHoverBreakpointOverlay,
        120
      )
    }

    function removePersistentBreakpointOverlay(elementId: string) {
      const overlayId = persistentBreakpointOverlayIds.get(elementId)

      if (overlayId) {
        removeOverlay(overlayId)
      }

      persistentBreakpointOverlayIds.delete(elementId)
    }

    function clearPersistentBreakpointOverlays() {
      for (const elementId of Array.from(
        persistentBreakpointOverlayIds.keys()
      )) {
        removePersistentBreakpointOverlay(elementId)
      }
    }

    function clearDebugBreakpoints() {
      updateDebugBreakpointIds(new Set())
      clearPersistentBreakpointOverlays()
    }

    function createBreakpointButton(element: any, active: boolean) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = [
        'cowin-debug-breakpoint-button',
        active ? 'cowin-debug-breakpoint-button-active' : ''
      ]
        .filter(Boolean)
        .join(' ')
      button.title = active ? '取消断点' : '添加断点'
      button.addEventListener('mouseenter', clearBreakpointHideTimer)

      if (!active) {
        button.addEventListener('mouseleave', scheduleBreakpointOverlayClear)
      }

      button.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()

        modelerRef.value?.get('selection').select(element)
        selectedNode.value = readSelectedNode(element)
        toggleDebugBreakpoint(element)
      })

      return button
    }

    function addPersistentBreakpointOverlay(element: any) {
      const modeler = modelerRef.value

      if (!modeler || persistentBreakpointOverlayIds.has(element.id)) {
        return
      }

      const overlayId = modeler.get('overlays').add(element, 'debug', {
        position: {
          top: -8,
          right: -8
        },
        html: createBreakpointButton(element, true)
      })

      persistentBreakpointOverlayIds.set(element.id, overlayId)
    }

    function addDebugBreakpoint(element: any) {
      if (!debugMode.value || !canDebugElement(element)) {
        return
      }

      const nextIds = new Set(debugBreakpointIds.value)
      nextIds.add(element.id)
      updateDebugBreakpointIds(nextIds)
      addPersistentBreakpointOverlay(element)

      if (hoverBreakpointOverlayElement?.id === element.id) {
        clearHoverBreakpointOverlay()
      }
    }

    function removeDebugBreakpoint(elementOrId: any) {
      const elementId =
        typeof elementOrId === 'string' ? elementOrId : elementOrId?.id

      if (!elementId || !debugBreakpointIds.value.has(elementId)) {
        return
      }

      const nextIds = new Set(debugBreakpointIds.value)
      nextIds.delete(elementId)
      updateDebugBreakpointIds(nextIds)
      removePersistentBreakpointOverlay(elementId)
    }

    function toggleDebugBreakpoint(element: any) {
      if (hasDebugBreakpoint(element.id)) {
        removeDebugBreakpoint(element.id)
      } else {
        addDebugBreakpoint(element)
      }
    }

    function syncDebugBreakpoints() {
      if (!debugMode.value) {
        return
      }

      const modeler = modelerRef.value

      if (!modeler) {
        clearDebugBreakpoints()
        return
      }

      const elementRegistry = modeler.get('elementRegistry')
      const nextIds = new Set<string>()

      for (const elementId of debugBreakpointIds.value) {
        const element = elementRegistry.get(elementId)

        if (element && canDebugElement(element)) {
          nextIds.add(elementId)
          addPersistentBreakpointOverlay(element)
        } else {
          removePersistentBreakpointOverlay(elementId)
        }
      }

      for (const elementId of Array.from(
        persistentBreakpointOverlayIds.keys()
      )) {
        if (!nextIds.has(elementId)) {
          removePersistentBreakpointOverlay(elementId)
        }
      }

      const changed =
        nextIds.size !== debugBreakpointIds.value.size ||
        Array.from(nextIds).some(
          (elementId) => !debugBreakpointIds.value.has(elementId)
        )

      if (changed) {
        updateDebugBreakpointIds(nextIds)
      } else {
        bumpBreakpointVersion()
      }
    }

    function showBreakpointOverlay(element: any) {
      if (!debugMode.value || !canDebugElement(element)) {
        clearHoverBreakpointOverlay()
        return
      }

      if (hasDebugBreakpoint(element.id)) {
        clearHoverBreakpointOverlay()
        return
      }

      if (hoverBreakpointOverlayElement?.id === element.id) {
        clearBreakpointHideTimer()
        return
      }

      const modeler = modelerRef.value

      if (!modeler) {
        return
      }

      clearHoverBreakpointOverlay()

      hoverBreakpointOverlayElement = element
      hoverBreakpointOverlayId = modeler.get('overlays').add(element, 'debug', {
        position: {
          top: -8,
          right: -8
        },
        html: createBreakpointButton(element, false)
      })
    }

    function toggleDebugMode() {
      if (!debugMode.value && !hasProcessNodes()) {
        ElMessage.warning('请先添加流程节点')
        return
      }

      debugMode.value = !debugMode.value

      if (!debugMode.value) {
        outputNode.value = null
        clearHoverBreakpointOverlay()
        clearDebugBreakpoints()
      }
    }

    function refreshValidation() {
      const modeler = modelerRef.value

      if (!modeler) {
        return
      }

      processIndex.rebuild(modeler)
      issues.value = validateProcess(modeler)
      applyValidationMarkers(modeler, issues.value)
    }

    async function loadXml(xml: string) {
      const modeler = modelerRef.value

      if (!modeler) {
        return
      }

      await modeler.importXML(xml)
      modeler.get('canvas').zoom('fit-viewport', 'auto')

      if (debugMode.value) {
        clearHoverBreakpointOverlay()
        clearDebugBreakpoints()
      }

      refreshValidation()
    }

    function updateNodeConfig(key: string, value: string) {
      const modeler = modelerRef.value
      const current = configNode.value ?? selectedNode.value

      if (!modeler || !current) {
        return
      }

      const element = modeler.get('elementRegistry').get(current.id)
      const nextConfig = {
        ...current.config,
        [key]: value
      }

      modeler.get('modeling').updateProperties(element, {
        config: JSON.stringify(nextConfig)
      })
      const nextNode = readSelectedNode(element)
      selectedNode.value = nextNode
      configNode.value = nextNode

      if (outputNode.value?.id === current.id) {
        outputNode.value = nextNode
      }

      if (debugBreakpointIds.value.has(current.id)) {
        bumpBreakpointVersion()
      }

      refreshValidation()
    }

    function focusIssueElement(elementId: string, openConfig = false) {
      const modeler = modelerRef.value

      if (!modeler) {
        return
      }

      const element = modeler.get('elementRegistry').get(elementId)

      if (!element) {
        return
      }

      const canvas = modeler.get('canvas')
      const viewbox = canvas.viewbox()
      const elementCenter = {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2
      }

      modeler.get('selection').select(element)
      canvas.viewbox({
        x: elementCenter.x - viewbox.width / 2,
        y: elementCenter.y - viewbox.height / 2,
        width: viewbox.width,
        height: viewbox.height
      })

      const node = readSelectedNode(element)
      selectedNode.value = node

      if (openConfig) {
        configNode.value = node
      }
    }

    onMounted(async () => {
      if (!canvasRef.value) {
        return
      }

      const modeler = createModeler(canvasRef.value)
      modelerRef.value = modeler

      modeler.on('selection.changed', (event: any) => {
        syncSelectedNode(event.newSelection?.[0])
      })

      modeler.on('element.hover', (event: any) => {
        showBreakpointOverlay(event.element)
      })

      modeler.on('element.out', (event: any) => {
        if (hoverBreakpointOverlayElement?.id === event.element?.id) {
          scheduleBreakpointOverlayClear()
        }
      })

      modeler.on('element.dblclick', (event: any) => {
        const node = readSelectedNode(event.element)

        if (!node) {
          return
        }

        selectedNode.value = node
        configNode.value = node
      })

      modeler.on('commandStack.changed', () => {
        const selection = modeler.get('selection').get()
        const selected = readSelectedNode(selection?.[0])
        selectedNode.value = selected

        if (configNode.value) {
          const element = modeler
            .get('elementRegistry')
            .get(configNode.value.id)
          configNode.value = readSelectedNode(element)
        }

        refreshValidation()
        syncDebugBreakpoints()
      })

      // await loadXml(MOCK_PROCESS_200_XML)
      await loadXml(DEFAULT_PROCESS_XML)
    })

    onBeforeUnmount(() => {
      clearHoverBreakpointOverlay()
      clearPersistentBreakpointOverlays()
      modelerRef.value?.destroy()
    })

    return () => (
      <div class="cowin-editor-shell">
        <EditorToolbar
          modeler={modelerRef.value}
          debugActive={debugMode.value}
          onDebugToggle={toggleDebugMode}
        />

        <main class="cowin-editor-main">
          <aside class="cowin-editor-palette-slot">
            <OutputVariablesPanel
              node={debugMode.value ? null : outputVariablesNode.value}
              nodes={debugOutputNodes.value}
              debugActive={debugMode.value}
            />
          </aside>
          <section class="cowin-editor-canvas">
            <div
              ref={(element) =>
                (canvasRef.value = element as HTMLDivElement | null)
              }
              class="cowin-editor-canvas-host"
            />
            <EditorMiniMap modeler={modelerRef.value} />
          </section>
        </main>
        <EditorFooter
          issues={issues.value}
          onIssueClick={(elementId) => focusIssueElement(elementId)}
          onIssueDblclick={(elementId) => focusIssueElement(elementId, true)}
        />
        <NodeConfigDialog
          node={configNode.value}
          availableVariables={configNodeAvailableVariables.value}
          onClose={() => {
            configNode.value = null
          }}
          onUpdateConfig={updateNodeConfig}
        />
      </div>
    )
  }
})
