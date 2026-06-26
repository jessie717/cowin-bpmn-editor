import type { NodeModule } from '../types'
import { andNode } from './binary/and'
import { loopNode } from './binary/loop'
import { orNode } from './binary/or'
import { abortNode } from './interaction/abort'
import { corbaNode } from './interaction/corba'
import { emailNode } from './interaction/email'
import { httpCallNode } from './interaction/http-call'
import { logNode } from './interaction/log'
import { publishBusinessEventNode } from './interaction/publish-business-event'
import { rabbitMessageNode } from './interaction/rabbit-message'
import { ravenCastMessageNode } from './interaction/raven-cast-message'
import { rvMessageNode } from './interaction/rv-message'
import { saveNode } from './interaction/save'
import { webServiceNode } from './interaction/web-service'
import { claimNode } from './functional/claim'
import { configReadNode } from './functional/config-read'
import { exportSqlNode } from './functional/export-sql'
import { externalCmdNode } from './functional/external-cmd'
import { externalRuleNode } from './functional/external-rule'
import { fileNode } from './functional/file'
import { functionNode } from './functional/function'
import { ifNode } from './functional/if'
import { importNode } from './functional/import'
import { releaseNode } from './functional/release'
import { resultNode } from './functional/result'
import { runJobNode } from './functional/run-job'
import { runRuleNode } from './functional/run-rule'
import { scriptNode } from './functional/script'
import { sqlNode } from './functional/sql'
import { switchNode } from './functional/switch'
import { transformXmlNode } from './functional/transform-xml'
import { waitForNode } from './functional/wait-for'
import { waitForBusinessEventNode } from './functional/wait-for-business-event'
import { businessEventNode } from './startup/business-event'
import { manualStartNode } from './startup/manual-start'
import { repositoryEventNode } from './startup/repository-event'
import { scheduleNode } from './startup/schedule'

export const nodeModules: NodeModule[] = [
  manualStartNode,
  repositoryEventNode,
  scheduleNode,
  businessEventNode,
  andNode,
  orNode,
  loopNode,
  abortNode,
  httpCallNode,
  webServiceNode,
  corbaNode,
  rvMessageNode,
  rabbitMessageNode,
  ravenCastMessageNode,
  saveNode,
  emailNode,
  logNode,
  publishBusinessEventNode,
  waitForBusinessEventNode,
  waitForNode,
  ifNode,
  switchNode,
  importNode,
  claimNode,
  releaseNode,
  functionNode,
  transformXmlNode,
  resultNode,
  runJobNode,
  runRuleNode,
  externalRuleNode,
  sqlNode,
  exportSqlNode,
  fileNode,
  configReadNode,
  scriptNode,
  externalCmdNode
]
