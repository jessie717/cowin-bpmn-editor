import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import {
  createParameterId,
  parseParameterList,
  stringifyParameterList
} from '../../../shared/config'
import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn
} from '../../../../element-plus'
import { ExpressionEditor } from '../../../../editor/components/ExpressionEditor'
import { createExpressionSymbols } from '../../../../editor/expression'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

const REPOSITORY_EVENT_CONFIG_KEYS = {
  connection: 'repositoryEventConnection',
  tableName: 'repositoryEventTableName',
  attributes: 'repositoryEventAttributes',
  multiLogicFormat: 'repositoryEventMultiLogicFormat',
  logicGroups: 'repositoryEventLogicGroups',
  triggerSql: 'repositoryEventTriggerSql'
}

interface RepositoryTable {
  name: string
  attributes: RepositoryAttribute[]
}

interface RepositoryConnection {
  id: string
  name: string
  tables: RepositoryTable[]
}

interface RepositoryAttribute {
  name: string
  type: string
  include: boolean
}

interface LogicGroup {
  id: string
  groupNumber: string
  columnName: string
  columnType: string
  condition: string
  conditionValue: string
  monitor: boolean
}

const CONNECTIONS: RepositoryConnection[] = [
  {
    id: 'core-db',
    name: 'Core DB',
    tables: [
      {
        name: 'customer_profile',
        attributes: [
          { name: 'customer_id', type: 'VARCHAR', include: true },
          { name: 'customer_name', type: 'VARCHAR', include: true },
          { name: 'status', type: 'VARCHAR', include: true },
          { name: 'updated_at', type: 'TIMESTAMP', include: false }
        ]
      },
      {
        name: 'order_header',
        attributes: [
          { name: 'order_id', type: 'VARCHAR', include: true },
          { name: 'customer_id', type: 'VARCHAR', include: true },
          { name: 'amount', type: 'DECIMAL', include: true },
          { name: 'status', type: 'VARCHAR', include: false }
        ]
      }
    ]
  },
  {
    id: 'audit-db',
    name: 'Audit DB',
    tables: [
      {
        name: 'audit_event',
        attributes: [
          { name: 'event_id', type: 'VARCHAR', include: true },
          { name: 'event_type', type: 'VARCHAR', include: true },
          { name: 'payload', type: 'JSON', include: false },
          { name: 'created_at', type: 'TIMESTAMP', include: true }
        ]
      }
    ]
  }
]

const CONDITION_OPTIONS = ['==', '=', '!=', '>', '>=', '<', '<=', 'LIKE', 'IN']

function findConnection(connectionId: string) {
  return CONNECTIONS.find((connection) => connection.id === connectionId)
}

function findTable(connectionId: string, tableName: string) {
  return findConnection(connectionId)?.tables.find(
    (table) => table.name === tableName
  )
}

function readAttributes(
  connectionId: string,
  tableName: string,
  rawValue = ''
) {
  const savedAttributes = parseParameterList<RepositoryAttribute>(rawValue)
  const savedByName = new Map(
    savedAttributes.map((attribute) => [attribute.name, attribute])
  )

  return (
    findTable(connectionId, tableName)?.attributes.map((attribute) => ({
      ...attribute,
      include: savedByName.get(attribute.name)?.include ?? attribute.include
    })) ?? []
  )
}

function createLogicGroupExpression(group: LogicGroup) {
  return [group.columnName, group.condition, group.conditionValue]
    .filter((value) => value.trim())
    .join(' ')
}

export const RepositoryEventConfigPanel = defineComponent({
  name: 'RepositoryEventConfigPanel',
  props: {
    node: {
      type: Object as PropType<NodeConfigPanelProps['node']>,
      required: true
    },
    availableVariables: {
      type: Array as PropType<NodeConfigPanelProps['availableVariables']>,
      default: () => []
    },
    onClose: {
      type: Function as PropType<NodeConfigPanelProps['onClose']>,
      required: true
    },
    onUpdateConfig: {
      type: Function as PropType<NodeConfigPanelProps['onUpdateConfig']>,
      required: true
    }
  },
  setup(props) {
    const connectionId = ref(
      props.node.config[REPOSITORY_EVENT_CONFIG_KEYS.connection] ||
        CONNECTIONS[0]?.id ||
        ''
    )
    const tableName = ref(
      props.node.config[REPOSITORY_EVENT_CONFIG_KEYS.tableName] || ''
    )
    const attributes = ref(
      readAttributes(
        connectionId.value,
        tableName.value,
        props.node.config[REPOSITORY_EVENT_CONFIG_KEYS.attributes]
      )
    )
    const multiLogicFormat = ref(
      props.node.config[REPOSITORY_EVENT_CONFIG_KEYS.multiLogicFormat] || ''
    )
    const logicGroups = ref(
      parseParameterList<LogicGroup>(
        props.node.config[REPOSITORY_EVENT_CONFIG_KEYS.logicGroups]
      )
    )
    const triggerSql = ref(
      props.node.config[REPOSITORY_EVENT_CONFIG_KEYS.triggerSql] || ''
    )
    const tableDialogOpen = ref(false)
    const tempConnectionId = ref('')
    const tempTableName = ref('')
    const previewOpen = ref(false)

    const tempConnection = computed(() =>
      findConnection(tempConnectionId.value)
    )
    const includedAttributes = computed(() =>
      attributes.value.filter((attribute) => attribute.include)
    )
    const expressionSymbols = computed(() =>
      createExpressionSymbols(props.availableVariables)
    )
    const previewContent = computed(() => {
      if (!logicGroups.value.length) {
        return multiLogicFormat.value.trim() || 'No preview content'
      }

      const groupExpressions = logicGroups.value.map((group) => ({
        groupNumber: group.groupNumber,
        expression: createLogicGroupExpression(group)
      }))
      const format = multiLogicFormat.value.trim()

      if (format) {
        const expressionByGroupNumber = new Map(
          groupExpressions.map(({ groupNumber, expression }) => [
            groupNumber,
            expression
          ])
        )

        return format.replace(
          /\b\d+\b/g,
          (groupNumber) =>
            expressionByGroupNumber.get(groupNumber) ?? groupNumber
        )
      }

      return groupExpressions.map(({ expression }) => expression).join(' && ')
    })

    function openTableDialog() {
      tempConnectionId.value = connectionId.value || CONNECTIONS[0]?.id || ''
      tempTableName.value = tableName.value
      tableDialogOpen.value = true
    }

    function closeTableDialog() {
      tableDialogOpen.value = false
      tempConnectionId.value = ''
      tempTableName.value = ''
    }

    function confirmTableDialog() {
      connectionId.value = tempConnectionId.value
      tableName.value = tempTableName.value
      attributes.value = readAttributes(connectionId.value, tableName.value)
      logicGroups.value = []
      closeTableDialog()
    }

    function updateAttributeInclude(name: string, include: boolean) {
      attributes.value = attributes.value.map((attribute) =>
        attribute.name === name ? { ...attribute, include } : attribute
      )
    }

    function addLogicGroup() {
      const firstAttribute = includedAttributes.value[0]
      const nextGroupNumber =
        Math.max(
          0,
          ...logicGroups.value.map((group) => Number(group.groupNumber) || 0)
        ) + 1

      logicGroups.value = [
        ...logicGroups.value,
        {
          id: createParameterId('logic-group'),
          groupNumber: String(nextGroupNumber),
          columnName: firstAttribute?.name ?? '',
          columnType: firstAttribute?.type ?? '',
          condition: CONDITION_OPTIONS[0],
          conditionValue: '',
          monitor: false
        }
      ]
    }

    function updateLogicGroup(id: string, patch: Partial<LogicGroup>) {
      logicGroups.value = logicGroups.value.map((group) =>
        group.id === id ? { ...group, ...patch } : group
      )
    }

    function updateLogicGroupColumn(id: string, columnName: string) {
      const attribute = attributes.value.find(
        (candidate) => candidate.name === columnName
      )

      updateLogicGroup(id, {
        columnName,
        columnType: attribute?.type ?? ''
      })
    }

    function removeLogicGroup(id: string) {
      logicGroups.value = logicGroups.value.filter((group) => group.id !== id)
    }

    function applyConfig() {
      props.onUpdateConfig(
        REPOSITORY_EVENT_CONFIG_KEYS.connection,
        connectionId.value
      )
      props.onUpdateConfig(
        REPOSITORY_EVENT_CONFIG_KEYS.tableName,
        tableName.value
      )
      props.onUpdateConfig(
        REPOSITORY_EVENT_CONFIG_KEYS.attributes,
        stringifyParameterList(attributes.value)
      )
      props.onUpdateConfig(
        REPOSITORY_EVENT_CONFIG_KEYS.multiLogicFormat,
        multiLogicFormat.value
      )
      props.onUpdateConfig(
        REPOSITORY_EVENT_CONFIG_KEYS.logicGroups,
        stringifyParameterList(logicGroups.value)
      )
      props.onUpdateConfig(
        REPOSITORY_EVENT_CONFIG_KEYS.triggerSql,
        triggerSql.value
      )
      props.onClose()
    }

    return () => (
      <div class="cowin-parameter-section">
        <div class="cowin-parameter-form">
          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <h3>Table</h3>
            <div class="cowin-inline-control">
              <ElInput
                class="cowin-node-dialog-control"
                modelValue={tableName.value}
                readonly
                placeholder="Choose Table Name"
              />
              <ElButton nativeType="button" onClick={openTableDialog}>
                Choose
              </ElButton>
            </div>
          </label>
        </div>

        <div class="cowin-parameter-title-row">
          <h3>Attributes</h3>
        </div>
        <ElTable
          class="cowin-parameter-table"
          data={attributes.value}
          rowKey="name"
          border
          emptyText="No attributes"
        >
          <ElTableColumn prop="name" label="Name" minWidth={180} />
          <ElTableColumn prop="type" label="Type" minWidth={120} />
          <ElTableColumn
            label="Include"
            width={100}
            align="center"
            v-slots={{
              default: ({ row }: { row: RepositoryAttribute }) => (
                <ElCheckbox
                  modelValue={row.include}
                  onChange={(value: unknown) =>
                    updateAttributeInclude(row.name, Boolean(value))
                  }
                />
              )
            }}
          />
        </ElTable>

        <div class="cowin-parameter-form cowin-parameter-sub-form">
          <label class="cowin-node-dialog-field cowin-parameter-form-field cowin-parameter-form-field-wide-label">
            <h3 class="cowin-parameter-title-nowrap">Multi Logic Format</h3>
            <div class="cowin-inline-control">
              <ElInput
                class="cowin-node-dialog-control"
                modelValue={multiLogicFormat.value}
                onInput={(value: string | number) => {
                  multiLogicFormat.value = String(value ?? '')
                }}
              />
              <ElButton
                nativeType="button"
                onClick={() => {
                  previewOpen.value = true
                }}
              >
                Preview
              </ElButton>
            </div>
          </label>
        </div>

        <div class="cowin-parameter-title-row">
          <h3>Logic Group</h3>
          <ElButton size="small" nativeType="button" onClick={addLogicGroup}>
            Add
          </ElButton>
        </div>
        <ElTable
          class="cowin-parameter-table cowin-logic-group-table"
          data={logicGroups.value}
          rowKey="id"
          border
          emptyText="No logic groups"
        >
          <ElTableColumn
            label="Group Number"
            minWidth={120}
            v-slots={{
              default: ({ row }: { row: LogicGroup }) => (
                <span>{row.groupNumber}</span>
              )
            }}
          />
          <ElTableColumn
            label="Column Name"
            minWidth={160}
            v-slots={{
              default: ({ row }: { row: LogicGroup }) => (
                <ElSelect
                  class="cowin-parameter-control"
                  modelValue={row.columnName}
                  onChange={(value: string | number) =>
                    updateLogicGroupColumn(row.id, String(value))
                  }
                >
                  {includedAttributes.value.map((attribute) => (
                    <ElOption
                      key={attribute.name}
                      label={attribute.name}
                      value={attribute.name}
                    />
                  ))}
                </ElSelect>
              )
            }}
          />
          <ElTableColumn prop="columnType" label="Column Type" minWidth={120} />
          <ElTableColumn
            label="Condition"
            minWidth={120}
            v-slots={{
              default: ({ row }: { row: LogicGroup }) => (
                <ElSelect
                  class="cowin-parameter-control"
                  modelValue={row.condition}
                  onChange={(value: string | number) =>
                    updateLogicGroup(row.id, { condition: String(value) })
                  }
                >
                  {CONDITION_OPTIONS.map((condition) => (
                    <ElOption
                      key={condition}
                      label={condition}
                      value={condition}
                    />
                  ))}
                </ElSelect>
              )
            }}
          />
          <ElTableColumn
            label="Condition Value"
            minWidth={160}
            v-slots={{
              default: ({ row }: { row: LogicGroup }) => (
                <ElInput
                  class="cowin-parameter-control"
                  modelValue={row.conditionValue}
                  onInput={(value: string | number) =>
                    updateLogicGroup(row.id, {
                      conditionValue: String(value ?? '')
                    })
                  }
                />
              )
            }}
          />
          <ElTableColumn
            label="Monitor"
            width={90}
            align="center"
            v-slots={{
              default: ({ row }: { row: LogicGroup }) => (
                <ElSelect
                  class="cowin-parameter-control"
                  modelValue={row.monitor ? 'Y' : 'N'}
                  onChange={(value: string | number) =>
                    updateLogicGroup(row.id, { monitor: value === 'Y' })
                  }
                >
                  <ElOption label="Y" value="Y" />
                  <ElOption label="N" value="N" />
                </ElSelect>
              )
            }}
          />
          <ElTableColumn
            label="Operation"
            width={110}
            v-slots={{
              default: ({ row }: { row: LogicGroup }) => (
                <ElButton
                  class="cowin-parameter-remove"
                  size="small"
                  nativeType="button"
                  type="danger"
                  onClick={() => removeLogicGroup(row.id)}
                >
                  Delete
                </ElButton>
              )
            }}
          />
        </ElTable>

        <div class="cowin-parameter-form cowin-parameter-sub-form">
          <label class="cowin-node-dialog-field">
            <h3 class="cowin-parameter-title-nowrap">Trigger SQL Statement</h3>
            <ExpressionEditor
              modelValue={triggerSql.value}
              symbols={expressionSymbols.value}
              onChange={(value) => {
                triggerSql.value = value
              }}
            />
          </label>
        </div>

        <div class="cowin-parameter-actions">
          <ElButton nativeType="button" onClick={props.onClose}>
            Cancel
          </ElButton>
          <ElButton nativeType="button" type="primary" onClick={applyConfig}>
            Apply
          </ElButton>
        </div>

        <ElDialog
          class="cowin-node-dialog cowin-parameter-dialog"
          modelValue={tableDialogOpen.value}
          width="min(620px, calc(100vw - 48px))"
          destroyOnClose
          closeOnClickModal={false}
          onClose={closeTableDialog}
          v-slots={{
            header: () => (
              <div>
                <h2>Choose Table Name</h2>
              </div>
            )
          }}
        >
          <div class="cowin-parameter-form">
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>connection</span>
              <ElSelect
                class="cowin-node-dialog-control"
                modelValue={tempConnectionId.value}
                onChange={(value: string | number) => {
                  tempConnectionId.value = String(value)
                  tempTableName.value = ''
                }}
              >
                {CONNECTIONS.map((connection) => (
                  <ElOption
                    key={connection.id}
                    label={connection.name}
                    value={connection.id}
                  />
                ))}
              </ElSelect>
            </label>

            <div class="cowin-parameter-title-row">
              <h3>Table Name</h3>
            </div>
            <ElTable
              class="cowin-parameter-table cowin-choose-table"
              data={tempConnection.value?.tables ?? []}
              rowKey="name"
              border
              highlightCurrentRow
              emptyText="No tables"
              onRow-click={(row) => {
                tempTableName.value = (row as RepositoryTable).name
              }}
              rowClassName={({ row }: { row: RepositoryTable }) =>
                row.name === tempTableName.value ? 'cowin-table-row-active' : ''
              }
            >
              <ElTableColumn prop="name" label="Table Name" />
            </ElTable>

            <div class="cowin-parameter-actions">
              <ElButton nativeType="button" onClick={closeTableDialog}>
                Cancel
              </ElButton>
              <ElButton
                nativeType="button"
                type="primary"
                disabled={!tempTableName.value}
                onClick={confirmTableDialog}
              >
                OK
              </ElButton>
            </div>
          </div>
        </ElDialog>

        <ElDialog
          class="cowin-node-dialog cowin-parameter-dialog"
          modelValue={previewOpen.value}
          width="min(520px, calc(100vw - 48px))"
          destroyOnClose
          onClose={() => {
            previewOpen.value = false
          }}
          v-slots={{
            header: () => (
              <div>
                <h2>Multi Logic Format Preview</h2>
              </div>
            )
          }}
        >
          <pre class="cowin-config-preview">{previewContent.value}</pre>
        </ElDialog>
      </div>
    )
  }
})
