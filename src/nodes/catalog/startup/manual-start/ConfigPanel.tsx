import { defineComponent, nextTick, onBeforeUnmount, ref } from 'vue'
import type { PropType } from 'vue'
import {
  CONFIG_KEYS,
  VARIABLE_TYPES,
  createParameterId,
  parseParameterList,
  stringifyParameterList,
  type ManualStartParameter
} from '../../../shared/config'
import {
  ElButton,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn
} from '../../../../element-plus'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

function readManualStartParameters(
  config: NodeConfigPanelProps['node']['config']
) {
  const parameters = parseParameterList<ManualStartParameter>(
    config[CONFIG_KEYS.manualParameters]
  )

  if (parameters.length) {
    return parameters
  }

  const legacyName = config[CONFIG_KEYS.manualName]?.trim()

  return legacyName
    ? [
        {
          id: createParameterId('manual'),
          name: legacyName,
          type: config[CONFIG_KEYS.manualType] || VARIABLE_TYPES[0]
        }
      ]
    : []
}

export const ManualStartConfigPanel = defineComponent({
  name: 'ManualStartConfigPanel',
  props: {
    node: {
      type: Object as PropType<NodeConfigPanelProps['node']>,
      required: true
    },
    onUpdateConfig: {
      type: Function as PropType<NodeConfigPanelProps['onUpdateConfig']>,
      required: true
    },
    onClose: {
      type: Function as PropType<NodeConfigPanelProps['onClose']>,
      required: true
    }
  },
  setup(props) {
    const tableRef = ref<HTMLElement | null>(null)
    const dragSourceIndex = ref<number | null>(null)
    const draftParameters = ref(readManualStartParameters(props.node.config))
    const cleanupDragHandlers: Array<() => void> = []

    function readParameters() {
      return draftParameters.value
    }

    function writeParameters(parameters: ManualStartParameter[]) {
      draftParameters.value = parameters
    }

    function applyConfig() {
      props.onUpdateConfig(
        CONFIG_KEYS.manualParameters,
        stringifyParameterList(draftParameters.value)
      )
      props.onClose()
    }

    function updateParameter(id: string, patch: Partial<ManualStartParameter>) {
      writeParameters(
        readParameters().map((parameter) =>
          parameter.id === id ? { ...parameter, ...patch } : parameter
        )
      )
    }

    function addParameter() {
      writeParameters([
        ...readParameters(),
        {
          id: createParameterId('manual'),
          name: '',
          type: VARIABLE_TYPES[0]
        }
      ])
    }

    function removeParameter(id: string) {
      writeParameters(
        readParameters().filter((parameter) => parameter.id !== id)
      )
    }

    function moveParameter(fromIndex: number, toIndex: number) {
      const parameters = readParameters()

      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= parameters.length ||
        toIndex >= parameters.length
      ) {
        return
      }

      const nextParameters = [...parameters]
      const [parameter] = nextParameters.splice(fromIndex, 1)
      nextParameters.splice(toIndex, 0, parameter)
      writeParameters(nextParameters)
    }

    function clearDragHandlers() {
      while (cleanupDragHandlers.length) {
        cleanupDragHandlers.pop()?.()
      }
    }

    function bindRowDragHandlers() {
      nextTick(() => {
        clearDragHandlers()

        const root = tableRef.value

        if (!root) {
          return
        }

        const rows = Array.from(
          root.querySelectorAll<HTMLTableRowElement>(
            '.cowin-manual-start-table .el-table__body-wrapper tbody tr'
          )
        )

        rows.forEach((row, index) => {
          row.draggable = true
          row.classList.add('cowin-draggable-row')

          const onDragStart = (event: DragEvent) => {
            dragSourceIndex.value = index
            row.classList.add('cowin-draggable-row-active')
            event.dataTransfer?.setData('text/plain', String(index))
            event.dataTransfer?.setDragImage(row, 12, 12)
          }
          const onDragOver = (event: DragEvent) => {
            event.preventDefault()
            row.classList.add('cowin-draggable-row-over')
          }
          const onDragLeave = () => {
            row.classList.remove('cowin-draggable-row-over')
          }
          const onDrop = (event: DragEvent) => {
            event.preventDefault()
            const fromIndex = dragSourceIndex.value
            dragSourceIndex.value = null
            row.classList.remove('cowin-draggable-row-over')

            if (fromIndex !== null) {
              moveParameter(fromIndex, index)
            }
          }
          const onDragEnd = () => {
            dragSourceIndex.value = null
            row.classList.remove(
              'cowin-draggable-row-active',
              'cowin-draggable-row-over'
            )
          }

          row.addEventListener('dragstart', onDragStart)
          row.addEventListener('dragover', onDragOver)
          row.addEventListener('dragleave', onDragLeave)
          row.addEventListener('drop', onDrop)
          row.addEventListener('dragend', onDragEnd)

          cleanupDragHandlers.push(() => {
            row.draggable = false
            row.classList.remove(
              'cowin-draggable-row',
              'cowin-draggable-row-active',
              'cowin-draggable-row-over'
            )
            row.removeEventListener('dragstart', onDragStart)
            row.removeEventListener('dragover', onDragOver)
            row.removeEventListener('dragleave', onDragLeave)
            row.removeEventListener('drop', onDrop)
            row.removeEventListener('dragend', onDragEnd)
          })
        })
      })
    }

    onBeforeUnmount(clearDragHandlers)

    return () => {
      const parameters = readParameters()

      bindRowDragHandlers()

      return (
        <div class="cowin-parameter-section" ref={tableRef}>
          <div class="cowin-parameter-title-row">
            <h3>Arguments</h3>
            <ElButton size="small" nativeType="button" onClick={addParameter}>
              New
            </ElButton>
          </div>

          <ElTable
            class="cowin-parameter-table cowin-manual-start-table"
            data={parameters}
            rowKey="id"
            border
            emptyText="暂无启动参数"
          >
            <ElTableColumn
              prop="name"
              label="Name"
              minWidth={180}
              v-slots={{
                default: ({ row }: { row: ManualStartParameter }) => (
                  <ElInput
                    class="cowin-parameter-control"
                    modelValue={row.name}
                    onInput={(value: string | number) =>
                      updateParameter(row.id, { name: String(value ?? '') })
                    }
                  />
                )
              }}
            />
            <ElTableColumn
              prop="type"
              label="Type"
              minWidth={160}
              v-slots={{
                default: ({ row }: { row: ManualStartParameter }) => (
                  <ElSelect
                    class="cowin-parameter-control"
                    modelValue={row.type || VARIABLE_TYPES[0]}
                    filterable
                    allowCreate
                    defaultFirstOption
                    onChange={(value: string | number) =>
                      updateParameter(row.id, { type: String(value) })
                    }
                  >
                    {Array.from(
                      new Set([...VARIABLE_TYPES, row.type].filter(Boolean))
                    ).map((type) => (
                      <ElOption key={type} label={type} value={type} />
                    ))}
                  </ElSelect>
                )
              }}
            />
            <ElTableColumn
              label="Action"
              width={120}
              align="center"
              v-slots={{
                default: ({ row }: { row: ManualStartParameter }) => (
                  <ElButton
                    class="cowin-parameter-remove"
                    nativeType="button"
                    size="small"
                    type="danger"
                    onClick={() => removeParameter(row.id)}
                  >
                    Delete
                  </ElButton>
                )
              }}
            />
          </ElTable>

          <div class="cowin-parameter-actions">
            <ElButton nativeType="button" onClick={props.onClose}>
              Cancel
            </ElButton>
            <ElButton nativeType="button" type="primary" onClick={applyConfig}>
              Apply
            </ElButton>
          </div>
        </div>
      )
    }
  }
})
