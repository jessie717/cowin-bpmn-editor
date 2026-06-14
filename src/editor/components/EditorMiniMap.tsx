import { defineComponent, onBeforeUnmount, ref, watch } from 'vue'
import type { PropType } from 'vue'
import mapIcon from '../../assets/map-svg/map.svg'
import resetIcon from '../../assets/map-svg/reset.svg'
import zoomInIcon from '../../assets/map-svg/zoom-in.svg'
import zoomOutIcon from '../../assets/map-svg/zoom-out.svg'

export const EditorMiniMap = defineComponent({
  name: 'EditorMiniMap',
  props: {
    modeler: {
      type: Object as PropType<any | null>,
      default: null
    }
  },
  setup(props) {
    const isOpen = ref(true)
    const zoom = ref(100)
    let cleanup: (() => void) | null = null

    function readZoom(modeler = props.modeler) {
      if (!modeler) {
        zoom.value = 100
        return
      }

      zoom.value = Math.round(modeler.get('canvas').viewbox().scale * 100)
    }

    function bindModeler(modeler: any | null) {
      cleanup?.()
      cleanup = null

      if (!modeler) {
        return
      }

      const eventBus = modeler.get('eventBus')
      const minimap = modeler.get('minimap')

      const onViewboxChanged = () => readZoom(modeler)
      const onMinimapToggle = (event: { open: boolean }) => {
        isOpen.value = event.open
      }

      eventBus.on('canvas.viewbox.changed', onViewboxChanged)
      eventBus.on('minimap.toggle', onMinimapToggle)

      isOpen.value = minimap.isOpen()
      readZoom(modeler)

      cleanup = () => {
        eventBus.off('canvas.viewbox.changed', onViewboxChanged)
        eventBus.off('minimap.toggle', onMinimapToggle)
      }
    }

    watch(() => props.modeler, bindModeler, { immediate: true })

    onBeforeUnmount(() => {
      cleanup?.()
    })

    function toggleMiniMap() {
      const minimap = props.modeler?.get('minimap')

      if (!minimap) {
        return
      }

      minimap.toggle(!minimap.isOpen())
      isOpen.value = minimap.isOpen()
    }

    function zoomBy(ratio: number) {
      const canvas = props.modeler?.get('canvas')

      if (!canvas) {
        return
      }

      const current = canvas.viewbox().scale
      canvas.zoom(Math.max(0.2, Math.min(4, current * ratio)), 'auto')
      readZoom()
    }

    function resetView() {
      const canvas = props.modeler?.get('canvas')

      if (!canvas) {
        return
      }

      canvas.zoom('fit-viewport', 'auto')
      readZoom()
    }

    return () => (
      <div class="cowin-minimap-controls">
        <button
          class={[
            'cowin-minimap-button',
            isOpen.value ? 'cowin-minimap-button-active' : ''
          ]}
          type="button"
          title="小地图"
          onClick={toggleMiniMap}
        >
          <img src={mapIcon} alt="" />
        </button>
        <button
          class="cowin-minimap-button"
          type="button"
          title="缩小"
          onClick={() => zoomBy(0.85)}
        >
          <img src={zoomOutIcon} alt="" />
        </button>
        <span class="cowin-minimap-zoom">{zoom.value}%</span>
        <button
          class="cowin-minimap-button"
          type="button"
          title="放大"
          onClick={() => zoomBy(1.15)}
        >
          <img src={zoomInIcon} alt="" />
        </button>
        <button
          class="cowin-minimap-button"
          type="button"
          title="重置视图"
          onClick={resetView}
        >
          <img src={resetIcon} alt="" />
        </button>
      </div>
    )
  }
})
