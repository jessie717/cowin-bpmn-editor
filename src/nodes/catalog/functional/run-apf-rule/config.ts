export const RUN_APF_RULE_CONFIG_KEYS = {
  connector: 'runApfRuleConnector',
  serviceName: 'runApfRuleServiceName',
  inputArguments: 'runApfRuleInputArguments',
  outputArguments: 'runApfRuleOutputArguments',
  timeout: 'runApfRuleTimeout'
}

export const RUN_APF_RULE_CONNECTORS = [
  'DispatchServiceAddress',
  'dsrvCorba',
  'corbaTest'
]

/** Service Name 为固定硬编码值，不提供修改入口 */
export const RUN_APF_RULE_SERVICE_HARD_CODED = 'CMD_Qdlis|Station'

/** Input Arguments 第一行为固定参数，不提供删除入口 */
export const RUN_APF_RULE_FIXED_INPUT_NAME = 'DispatchStationID'

/** Output Arguments Type 下拉可选的 Java 数据类型 */
export const RUN_APF_RULE_OUTPUT_TYPES = [
  'String',
  'Integer',
  'Double',
  'Float',
  'Boolean',
  'BigDecimal',
  'Date',
  'Table'
]

export interface RunApfRuleInputArgument {
  id: string
  name: string
  type: string
  value?: string
}

export interface RunApfRuleOutputArgument {
  id: string
  name: string
  type: string
}

export interface RunApfRuleService {
  name: string
  resultType: string
  outputArguments: RunApfRuleOutputArgument[]
}

export const RUN_APF_RULE_SERVICES: RunApfRuleService[] = [
  {
    name: RUN_APF_RULE_SERVICE_HARD_CODED,
    resultType: 'Table',
    outputArguments: [{ id: 'table', name: 'table', type: 'Table' }]
  }
]

export const DEFAULT_RUN_APF_RULE_SERVICE = RUN_APF_RULE_SERVICES[0]

export function getRunApfRuleService(serviceName?: string) {
  return (
    RUN_APF_RULE_SERVICES.find((service) => service.name === serviceName) ??
    DEFAULT_RUN_APF_RULE_SERVICE
  )
}
