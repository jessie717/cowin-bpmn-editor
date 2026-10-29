import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import {
  ElButton,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn
} from '../../../../element-plus'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

const RUN_RULE_CONFIG_KEYS = {
  ruleName: 'runRuleName'
}

interface RuleArgument {
  id: string
  name: string
  type: string
  value?: string
}

interface RuleOption {
  id: string
  name: string
  resultType: string
  timeout: string
  inputArguments: RuleArgument[]
  outputArguments: RuleArgument[]
}

const RULES: RuleOption[] = [
  {
    id: 'customer-risk-check',
    name: 'Customer Risk Check',
    resultType: 'Object',
    timeout: '5000',
    inputArguments: [
      {
        id: 'customerId',
        name: 'customerId',
        type: 'String',
        value: '${customerId}'
      },
      {
        id: 'orderAmount',
        name: 'orderAmount',
        type: 'Number',
        value: '${orderAmount}'
      }
    ],
    outputArguments: [
      { id: 'riskLevel', name: 'riskLevel', type: 'String' },
      { id: 'riskScore', name: 'riskScore', type: 'Number' }
    ]
  },
  {
    id: 'discount-policy',
    name: 'Discount Policy',
    resultType: 'Object',
    timeout: '3000',
    inputArguments: [
      {
        id: 'customerLevel',
        name: 'customerLevel',
        type: 'String',
        value: '${customerLevel}'
      },
      {
        id: 'cartTotal',
        name: 'cartTotal',
        type: 'Number',
        value: '${cartTotal}'
      }
    ],
    outputArguments: [
      { id: 'discountRate', name: 'discountRate', type: 'Number' },
      { id: 'approvalRequired', name: 'approvalRequired', type: 'Boolean' }
    ]
  },
  {
    id: 'fulfillment-routing',
    name: 'Fulfillment Routing',
    resultType: 'Object',
    timeout: '8000',
    inputArguments: [
      {
        id: 'region',
        name: 'region',
        type: 'String',
        value: '${region}'
      },
      {
        id: 'inventoryStatus',
        name: 'inventoryStatus',
        type: 'String',
        value: '${inventoryStatus}'
      }
    ],
    outputArguments: [
      { id: 'warehouseCode', name: 'warehouseCode', type: 'String' },
      { id: 'shippingPriority', name: 'shippingPriority', type: 'String' }
    ]
  }
]

function searchRuleOptions(query = '') {
  const keyword = query.trim().toLowerCase()

  return keyword
    ? RULES.filter((rule) => rule.name.toLowerCase().includes(keyword))
    : RULES
}

export const RunRuleConfigPanel = defineComponent({
  name: 'RunRuleConfigPanel',
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
    const ruleOptions = ref(searchRuleOptions())
    const ruleLoading = ref(false)
    const selectedRuleName = ref(
      props.node.config[RUN_RULE_CONFIG_KEYS.ruleName] || ''
    )

    const selectedRule = computed(() =>
      RULES.find((rule) => rule.name === selectedRuleName.value)
    )

    function remoteSearchRules(query: string) {
      ruleLoading.value = true

      window.setTimeout(() => {
        ruleOptions.value = searchRuleOptions(query)
        ruleLoading.value = false
      }, 120)
    }

    function refreshRules() {
      ruleOptions.value = searchRuleOptions()
    }

    async function copyRuleName() {
      if (!selectedRuleName.value) {
        return
      }

      try {
        await navigator.clipboard.writeText(selectedRuleName.value)
        ElMessage.success('Rule Name copied')
      } catch {
        ElMessage.warning('Copy failed')
      }
    }

    function applyConfig() {
      props.onUpdateConfig(
        RUN_RULE_CONFIG_KEYS.ruleName,
        selectedRuleName.value
      )
      props.onClose()
    }

    return () => (
      <div class="cowin-parameter-section">
        <div class="cowin-parameter-title-row">
          <h3>Rule Selection</h3>
        </div>
        <div class="cowin-parameter-form">
          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>
              Rule Name<strong>*</strong>
            </span>
            <div class="cowin-inline-control cowin-rule-name-control">
              <ElSelect
                class="cowin-node-dialog-control"
                modelValue={selectedRuleName.value}
                filterable
                remote
                reserveKeyword
                loading={ruleLoading.value}
                remoteMethod={remoteSearchRules}
                onChange={(value: string | number) => {
                  selectedRuleName.value = String(value)
                }}
              >
                {ruleOptions.value.map((rule) => (
                  <ElOption key={rule.id} label={rule.name} value={rule.name} />
                ))}
              </ElSelect>
              <ElButton
                class="cowin-icon-button"
                nativeType="button"
                disabled={!selectedRuleName.value}
                {...({ title: 'Copy Rule Name' } as Record<string, string>)}
                onClick={copyRuleName}
              >
                ⧉
              </ElButton>
              <ElButton nativeType="button" onClick={refreshRules}>
                Refresh
              </ElButton>
            </div>
          </label>
        </div>

        <div class="cowin-parameter-title-row">
          <h3>Input Arguments</h3>
        </div>
        <ElTable
          class="cowin-parameter-table"
          data={selectedRule.value?.inputArguments ?? []}
          rowKey="id"
          border
          emptyText="No input arguments"
        >
          <ElTableColumn prop="name" label="Name" minWidth={160} />
          <ElTableColumn prop="type" label="Type" minWidth={120} />
          <ElTableColumn prop="value" label="Value" minWidth={220} />
        </ElTable>
        <div class="cowin-parameter-form cowin-parameter-sub-form">
          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Result Type</span>
            <div class="cowin-readonly-value">
              {selectedRule.value?.resultType || '-'}
            </div>
          </label>
        </div>

        <div class="cowin-parameter-title-row">
          <h3>Output Arguments</h3>
        </div>
        <ElTable
          class="cowin-parameter-table"
          data={selectedRule.value?.outputArguments ?? []}
          rowKey="id"
          border
          emptyText="No output arguments"
        >
          <ElTableColumn prop="name" label="Name" minWidth={180} />
          <ElTableColumn prop="type" label="Type" minWidth={120} />
        </ElTable>
        <div class="cowin-parameter-form cowin-parameter-sub-form">
          <label class="cowin-node-dialog-field cowin-parameter-form-field">
            <span>Timeout</span>
            <div class="cowin-readonly-value">
              {selectedRule.value?.timeout || '-'}
            </div>
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
      </div>
    )
  }
})
