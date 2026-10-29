import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import {
  ElButton,
  ElDialog,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTreeSelect
} from '../../../../element-plus'
import {
  parseParameterList,
  stringifyParameterList
} from '../../../shared/config'
import { ExpressionHelper } from '../../../../editor/components/ExpressionHelper'
import { InputContext } from '../../../../editor/components/InputContext'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

const BUSINESS_EVENT_CONFIG_KEYS = {
  eventName: 'businessEventName',
  namespace: 'businessEventNamespace',
  arguments: 'businessEventArguments',
  filter: 'businessEventFilter'
}

interface BusinessEventArgument {
  name: string
  type: string
}

interface BusinessEventDefinition {
  value: string
  label: string
  namespace: string
  arguments: BusinessEventArgument[]
}

interface BusinessEventTreeNode {
  value: string
  label: string
  disabled?: boolean
  children?: BusinessEventTreeNode[]
}

const BUSINESS_EVENTS: BusinessEventDefinition[] = [
  {
    value: 'customer.created',
    label: 'Customer Created',
    namespace: 'customer.lifecycle',
    arguments: [
      { name: 'customerId', type: 'String' },
      { name: 'customerName', type: 'String' },
      { name: 'createdAt', type: 'String' }
    ]
  },
  {
    value: 'customer.status.changed',
    label: 'Customer Status Changed',
    namespace: 'customer.lifecycle',
    arguments: [
      { name: 'customerId', type: 'String' },
      { name: 'previousStatus', type: 'String' },
      { name: 'currentStatus', type: 'String' }
    ]
  },
  {
    value: 'order.submitted',
    label: 'Order Submitted',
    namespace: 'order.lifecycle',
    arguments: [
      { name: 'orderId', type: 'String' },
      { name: 'customerId', type: 'String' },
      { name: 'amount', type: 'Number' }
    ]
  },
  {
    value: 'order.cancelled',
    label: 'Order Cancelled',
    namespace: 'order.lifecycle',
    arguments: [
      { name: 'orderId', type: 'String' },
      { name: 'reason', type: 'String' }
    ]
  }
]

const EVENT_TREE: BusinessEventTreeNode[] = [
  {
    value: 'customer-events',
    label: 'Customer Events',
    disabled: true,
    children: BUSINESS_EVENTS.filter((event) =>
      event.value.startsWith('customer.')
    ).map(({ value, label }) => ({ value, label }))
  },
  {
    value: 'order-events',
    label: 'Order Events',
    disabled: true,
    children: BUSINESS_EVENTS.filter((event) =>
      event.value.startsWith('order.')
    ).map(({ value, label }) => ({ value, label }))
  }
]

const TREE_PROPS = {
  value: 'value',
  label: 'label',
  children: 'children',
  disabled: 'disabled'
}

function findBusinessEvent(value: string) {
  return BUSINESS_EVENTS.find((event) => event.value === value)
}

export const BusinessEventConfigPanel = defineComponent({
  name: 'BusinessEventConfigPanel',
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
    const eventName = ref(
      props.node.config[BUSINESS_EVENT_CONFIG_KEYS.eventName] || ''
    )
    const selectedEvent = findBusinessEvent(eventName.value)
    const namespace = ref(
      props.node.config[BUSINESS_EVENT_CONFIG_KEYS.namespace] ||
        selectedEvent?.namespace ||
        ''
    )
    const eventArguments = ref(
      parseParameterList<BusinessEventArgument>(
        props.node.config[BUSINESS_EVENT_CONFIG_KEYS.arguments]
      ).length
        ? parseParameterList<BusinessEventArgument>(
            props.node.config[BUSINESS_EVENT_CONFIG_KEYS.arguments]
          )
        : selectedEvent?.arguments.map((argument) => ({ ...argument })) || []
    )
    const filter = ref(
      props.node.config[BUSINESS_EVENT_CONFIG_KEYS.filter] || ''
    )
    const filterDialogOpen = ref(false)
    const filterDraft = ref('')
    const selectedContext = ref('')
    const selectedExpression = ref('')

    function updateEvent(value: string) {
      const event = findBusinessEvent(value)
      eventName.value = value
      namespace.value = event?.namespace || ''
      eventArguments.value =
        event?.arguments.map((argument) => ({ ...argument })) || []
    }

    function openFilterDialog() {
      filterDraft.value = filter.value
      selectedContext.value = ''
      selectedExpression.value = ''
      filterDialogOpen.value = true
    }

    function closeFilterDialog() {
      filterDialogOpen.value = false
      filterDraft.value = ''
      selectedContext.value = ''
      selectedExpression.value = ''
    }

    function confirmFilterDialog() {
      filter.value = filterDraft.value
      closeFilterDialog()
    }

    function applyConfig() {
      if (!eventName.value) {
        ElMessage.warning('Event Name is required')
        return
      }

      props.onUpdateConfig(
        BUSINESS_EVENT_CONFIG_KEYS.eventName,
        eventName.value
      )
      props.onUpdateConfig(
        BUSINESS_EVENT_CONFIG_KEYS.namespace,
        namespace.value
      )
      props.onUpdateConfig(
        BUSINESS_EVENT_CONFIG_KEYS.arguments,
        stringifyParameterList(eventArguments.value)
      )
      props.onUpdateConfig(BUSINESS_EVENT_CONFIG_KEYS.filter, filter.value)
      props.onClose()
    }

    return () => (
      <div class="cowin-parameter-section">
        <div class="cowin-parameter-title-row">
          <h3>Event Info</h3>
        </div>
        <div class="cowin-parameter-form cowin-event-info-form">
          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>
              Event Name<strong>*</strong>
            </span>
            <ElTreeSelect
              class="cowin-node-dialog-control"
              modelValue={eventName.value}
              data={EVENT_TREE}
              props={TREE_PROPS}
              nodeKey="value"
              filterable
              checkStrictly
              defaultExpandAll
              placeholder="Select Event Name"
              {...{
                'onUpdate:modelValue': (value: string | number) =>
                  updateEvent(String(value))
              }}
            />
          </label>
          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Namespace</span>
            <ElInput
              class="cowin-node-dialog-control"
              modelValue={namespace.value}
              readonly
            />
          </label>
        </div>

        <div class="cowin-parameter-title-row">
          <h3>Arguments</h3>
        </div>
        <ElTable
          class="cowin-parameter-table"
          data={eventArguments.value}
          border
          emptyText="Select an event to load arguments"
        >
          <ElTableColumn prop="name" label="Name" minWidth={180} />
          <ElTableColumn prop="type" label="Type" minWidth={140} />
        </ElTable>

        <div class="cowin-parameter-title-row">
          <h3>Filter</h3>
        </div>
        <div class="cowin-clickable-filter" onClick={openFilterDialog}>
          <ElInput
            class="cowin-node-dialog-control"
            type="textarea"
            autosize={{ minRows: 3 }}
            modelValue={filter.value}
            readonly
            placeholder="Click to edit filter"
          />
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
          modelValue={filterDialogOpen.value}
          width="min(760px, calc(100vw - 48px))"
          destroyOnClose
          closeOnClickModal={false}
          onClose={closeFilterDialog}
          v-slots={{
            header: () => (
              <div>
                <h2>Edit Filter</h2>
              </div>
            )
          }}
        >
          <div class="cowin-function-helper-row">
            <InputContext
              modelValue={selectedContext.value}
              upstreamVariables={props.availableVariables}
              onChange={(value) => {
                selectedContext.value = value
                filterDraft.value = value
              }}
            />
            <ExpressionHelper
              modelValue={selectedExpression.value}
              onChange={(value) => {
                selectedExpression.value = value
                filterDraft.value = value
              }}
            />
          </div>
          <label class="cowin-node-dialog-field">
            <span>Filter</span>
            <ElInput
              class="cowin-node-dialog-control"
              type="textarea"
              autosize={{ minRows: 4 }}
              modelValue={filterDraft.value}
              onInput={(value: string | number) => {
                filterDraft.value = String(value ?? '')
              }}
            />
          </label>
          <div class="cowin-parameter-actions">
            <ElButton nativeType="button" onClick={closeFilterDialog}>
              Cancel
            </ElButton>
            <ElButton
              nativeType="button"
              type="primary"
              onClick={confirmFilterDialog}
            >
              OK
            </ElButton>
          </div>
        </ElDialog>
      </div>
    )
  }
})
