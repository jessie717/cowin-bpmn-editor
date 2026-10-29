import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDatePicker,
  ElDialog,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTimePicker
} from '../../../../element-plus'
import {
  createParameterId,
  parseParameterList,
  stringifyParameterList
} from '../../../shared/config'
import type { NodeConfigPanelProps } from '../../../../editor/components/node-config/types'

const SCHEDULE_CONFIG_KEY = 'scheduleSettings'
const SCHEDULE_TYPES = ['Cron', 'Daily Time Interval'] as const
const INTERVAL_UNITS = ['seconds', 'minutes', 'hours'] as const
const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const

type ScheduleType = (typeof SCHEDULE_TYPES)[number] | ''
type IntervalUnit = (typeof INTERVAL_UNITS)[number]

interface ScheduleSetting {
  id: string
  name: string
  lifeCycle: string[]
  type: ScheduleType
  cron: string
  timeInterval: number
  intervalUnit: IntervalUnit
  timeRange: string[]
  weekRange: string[]
}

interface TriggerPreview {
  id: string
  scheduleName: string
  triggerTime: string
}

interface CronForm {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

function createScheduleSetting(): ScheduleSetting {
  return {
    id: createParameterId('schedule'),
    name: '',
    lifeCycle: [],
    type: '',
    cron: '',
    timeInterval: 1,
    intervalUnit: 'seconds',
    timeRange: [],
    weekRange: []
  }
}

function normalizeStringRange(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item ?? '')) : []
}

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`
}

function parseDateTime(value?: string) {
  if (!value) return null

  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

function setTime(date: Date, value: string, endOfDay = false) {
  const [hours, minutes, seconds] = value
    ? value.split(':').map((part) => Number(part) || 0)
    : endOfDay
      ? [23, 59, 59]
      : [0, 0, 0]
  const result = new Date(date)
  result.setHours(hours, minutes, seconds, 0)
  return result
}

function cronFieldMatches(
  expression: string,
  value: number,
  min: number,
  max: number,
  normalizeSunday = false
) {
  return expression.split(',').some((segment) => {
    const [base = '*', rawStep] = segment.trim().split('/')
    const step = Math.max(1, Number(rawStep) || 1)
    let start = min
    let end = max

    if (base !== '*') {
      if (base.includes('-')) {
        const [rawStart, rawEnd] = base.split('-')
        start = Number(rawStart)
        end = Number(rawEnd)
      } else {
        start = Number(base)
        end = start
      }
    }

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < min ||
      end > max
    ) {
      return false
    }

    const comparableValue =
      normalizeSunday && value === 0 && start === 7 && end === 7 ? 7 : value
    return (
      comparableValue >= start &&
      comparableValue <= end &&
      (comparableValue - start) % step === 0
    )
  })
}

function getCronTriggerTimes(
  schedule: ScheduleSetting,
  now: Date,
  limit: number
) {
  const fields = schedule.cron.trim().split(/\s+/)
  if (fields.length !== 5) return []

  const lifeCycleStart = parseDateTime(schedule.lifeCycle[0])
  const lifeCycleEnd = parseDateTime(schedule.lifeCycle[1])
  const activeStart =
    lifeCycleStart && lifeCycleStart > now ? lifeCycleStart : now
  const cursor = new Date(activeStart)
  cursor.setSeconds(0, 0)
  if (cursor < activeStart) cursor.setMinutes(cursor.getMinutes() + 1)

  const results: Date[] = []
  const maximumChecks = 366 * 24 * 60

  for (
    let checks = 0;
    checks < maximumChecks && results.length < limit;
    checks += 1
  ) {
    if (lifeCycleEnd && cursor > lifeCycleEnd) break

    if (
      cronFieldMatches(fields[0], cursor.getMinutes(), 0, 59) &&
      cronFieldMatches(fields[1], cursor.getHours(), 0, 23) &&
      cronFieldMatches(fields[2], cursor.getDate(), 1, 31) &&
      cronFieldMatches(fields[3], cursor.getMonth() + 1, 1, 12) &&
      cronFieldMatches(fields[4], cursor.getDay(), 0, 7, true)
    ) {
      results.push(new Date(cursor))
    }
    cursor.setMinutes(cursor.getMinutes() + 1)
  }

  return results
}

function getDailyTriggerTimes(
  schedule: ScheduleSetting,
  now: Date,
  limit: number
) {
  const lifeCycleStart = parseDateTime(schedule.lifeCycle[0])
  const lifeCycleEnd = parseDateTime(schedule.lifeCycle[1])
  const activeStart =
    lifeCycleStart && lifeCycleStart > now ? lifeCycleStart : now
  const intervalMilliseconds =
    Math.max(1, schedule.timeInterval) *
    {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000
    }[schedule.intervalUnit]
  const weekDayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]
  const results: Date[] = []
  const day = new Date(activeStart)
  day.setHours(0, 0, 0, 0)

  for (
    let dayIndex = 0;
    dayIndex < 366 && results.length < limit;
    dayIndex += 1
  ) {
    const weekDay = weekDayNames[day.getDay()]
    const isSelectedDay =
      schedule.weekRange.length === 0 || schedule.weekRange.includes(weekDay)

    if (isSelectedDay) {
      const rangeStart = setTime(day, schedule.timeRange[0] || '')
      const rangeEnd = setTime(day, schedule.timeRange[1] || '', true)
      const windowStart =
        rangeStart > activeStart ? rangeStart : new Date(activeStart)
      const elapsed = Math.max(0, windowStart.getTime() - rangeStart.getTime())
      const intervalCount = Math.ceil(elapsed / intervalMilliseconds)
      const candidate = new Date(
        rangeStart.getTime() + intervalCount * intervalMilliseconds
      )

      while (
        candidate <= rangeEnd &&
        (!lifeCycleEnd || candidate <= lifeCycleEnd) &&
        results.length < limit
      ) {
        if (candidate >= activeStart) results.push(new Date(candidate))
        candidate.setTime(candidate.getTime() + intervalMilliseconds)
      }
    }

    day.setDate(day.getDate() + 1)
    if (lifeCycleEnd && day > lifeCycleEnd) break
  }

  return results
}

function getNextTriggerTimes(schedules: ScheduleSetting[], limit: number) {
  const now = new Date()

  return schedules
    .flatMap((schedule) => {
      const triggerTimes =
        schedule.type === 'Cron'
          ? getCronTriggerTimes(schedule, now, limit)
          : getDailyTriggerTimes(schedule, now, limit)

      return triggerTimes.map((triggerTime) => ({
        schedule,
        triggerTime
      }))
    })
    .sort(
      (left, right) => left.triggerTime.getTime() - right.triggerTime.getTime()
    )
    .slice(0, limit)
}

export const ScheduleConfigPanel = defineComponent({
  name: 'ScheduleConfigPanel',
  props: {
    node: {
      type: Object as PropType<NodeConfigPanelProps['node']>,
      required: true
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
    const schedules = ref(
      parseParameterList<ScheduleSetting>(
        props.node.config[SCHEDULE_CONFIG_KEY]
      )
    )
    const scheduleDialogOpen = ref(false)
    const editingScheduleId = ref<string | null>(null)
    const scheduleForm = ref<ScheduleSetting>(createScheduleSetting())
    const cronDialogOpen = ref(false)
    const cronForm = ref<CronForm>({
      minute: '*',
      hour: '*',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*'
    })
    const triggerPreviews = ref<TriggerPreview[]>([])

    function openScheduleDialog(schedule?: ScheduleSetting) {
      editingScheduleId.value = schedule?.id ?? null
      scheduleForm.value = schedule
        ? {
            ...schedule,
            lifeCycle: [...schedule.lifeCycle],
            timeRange: [...schedule.timeRange],
            weekRange: [...schedule.weekRange]
          }
        : createScheduleSetting()
      scheduleDialogOpen.value = true
    }

    function closeScheduleDialog() {
      scheduleDialogOpen.value = false
      editingScheduleId.value = null
    }

    function updateScheduleForm(patch: Partial<ScheduleSetting>) {
      scheduleForm.value = { ...scheduleForm.value, ...patch }
    }

    function submitScheduleDialog() {
      if (!scheduleForm.value.name.trim() || !scheduleForm.value.type) {
        ElMessage.warning('Schedule Name and Type are required')
        return
      }

      const nextSchedule = { ...scheduleForm.value }
      schedules.value = editingScheduleId.value
        ? schedules.value.map((schedule) =>
            schedule.id === editingScheduleId.value ? nextSchedule : schedule
          )
        : [...schedules.value, nextSchedule]
      closeScheduleDialog()
    }

    function removeSchedule(id: string) {
      schedules.value = schedules.value.filter((schedule) => schedule.id !== id)
      triggerPreviews.value = triggerPreviews.value.filter(
        (preview) => preview.id !== id
      )
    }

    function openCronDialog() {
      const cronParts = scheduleForm.value.cron.trim()
        ? scheduleForm.value.cron.trim().split(/\s+/)
        : []
      const [
        minute = '*',
        hour = '*',
        dayOfMonth = '*',
        month = '*',
        dayOfWeek = '*'
      ] = cronParts
      cronForm.value = { minute, hour, dayOfMonth, month, dayOfWeek }
      cronDialogOpen.value = true
    }

    function confirmCronDialog() {
      updateScheduleForm({
        cron: [
          cronForm.value.minute,
          cronForm.value.hour,
          cronForm.value.dayOfMonth,
          cronForm.value.month,
          cronForm.value.dayOfWeek
        ].join(' ')
      })
      cronDialogOpen.value = false
    }

    function refreshTriggerPreviews() {
      triggerPreviews.value = getNextTriggerTimes(schedules.value, 15).map(
        ({ schedule, triggerTime }, index) => ({
          id: `${schedule.id}-${triggerTime.getTime()}-${index}`,
          scheduleName: schedule.name,
          triggerTime: formatDateTime(triggerTime)
        })
      )
    }

    function applyConfig() {
      props.onUpdateConfig(
        SCHEDULE_CONFIG_KEY,
        stringifyParameterList(schedules.value)
      )
      props.onClose()
    }

    return () => (
      <div class="cowin-parameter-section">
        <div class="cowin-parameter-title-row">
          <h3>Schedule Setting</h3>
          <ElButton
            size="small"
            nativeType="button"
            onClick={() => openScheduleDialog()}
          >
            New
          </ElButton>
        </div>
        <ElTable
          class="cowin-parameter-table"
          data={schedules.value}
          rowKey="id"
          border
          emptyText="No schedules"
        >
          <ElTableColumn prop="name" label="Schedule Name" minWidth={120} />
          <ElTableColumn prop="type" label="Type" minWidth={130} />
          <ElTableColumn
            label="Start Time"
            minWidth={150}
            v-slots={{
              default: ({ row }: { row: ScheduleSetting }) =>
                row.lifeCycle[0] || '-'
            }}
          />
          <ElTableColumn
            label="End Time"
            minWidth={150}
            v-slots={{
              default: ({ row }: { row: ScheduleSetting }) =>
                row.lifeCycle[1] || '-'
            }}
          />
          <ElTableColumn
            label="Action"
            width={160}
            v-slots={{
              default: ({ row }: { row: ScheduleSetting }) => (
                <>
                  <ElButton
                    size="small"
                    nativeType="button"
                    onClick={() => openScheduleDialog(row)}
                  >
                    Edit
                  </ElButton>
                  <ElButton
                    size="small"
                    nativeType="button"
                    type="danger"
                    onClick={() => removeSchedule(row.id)}
                  >
                    Delete
                  </ElButton>
                </>
              )
            }}
          />
        </ElTable>

        <div class="cowin-parameter-title-row">
          <h3>Preview Next Trigger Time</h3>
          <ElButton
            size="small"
            nativeType="button"
            onClick={refreshTriggerPreviews}
          >
            Refresh
          </ElButton>
        </div>
        <ElTable
          class="cowin-parameter-table"
          data={triggerPreviews.value}
          rowKey="id"
          border
          emptyText="Click Refresh to preview"
        >
          <ElTableColumn
            prop="scheduleName"
            label="Schedule Name"
            minWidth={180}
          />
          <ElTableColumn
            prop="triggerTime"
            label="Next Trigger Time"
            minWidth={200}
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

        <ElDialog
          class="cowin-node-dialog cowin-parameter-dialog"
          modelValue={scheduleDialogOpen.value}
          width="min(760px, calc(100vw - 48px))"
          destroyOnClose
          closeOnClickModal={false}
          onClose={closeScheduleDialog}
          v-slots={{
            header: () => (
              <div>
                <h2>
                  {editingScheduleId.value ? 'Edit Schedule' : 'New Schedule'}
                </h2>
              </div>
            )
          }}
        >
          <div class="cowin-parameter-form">
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>
                Schedule Name<strong>*</strong>
              </span>
              <ElInput
                class="cowin-node-dialog-control"
                modelValue={scheduleForm.value.name}
                onInput={(value: string | number) =>
                  updateScheduleForm({ name: String(value ?? '') })
                }
              />
            </label>
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>Life Cycle</span>
              <ElDatePicker
                class="cowin-node-dialog-control"
                modelValue={scheduleForm.value.lifeCycle}
                type="datetimerange"
                valueFormat="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm:ss"
                startPlaceholder="Start Time"
                endPlaceholder="End Time"
                {...{
                  'onUpdate:modelValue': (value: unknown) =>
                    updateScheduleForm({
                      lifeCycle: normalizeStringRange(value)
                    })
                }}
              />
            </label>
            <label class="cowin-node-dialog-field cowin-parameter-form-field">
              <span>
                Type<strong>*</strong>
              </span>
              <ElSelect
                class="cowin-node-dialog-control"
                modelValue={scheduleForm.value.type}
                placeholder="Select Type"
                onChange={(value: string | number) =>
                  updateScheduleForm({ type: String(value) as ScheduleType })
                }
              >
                {SCHEDULE_TYPES.map((type) => (
                  <ElOption key={type} label={type} value={type} />
                ))}
              </ElSelect>
            </label>

            {scheduleForm.value.type === 'Cron' ? (
              <label class="cowin-node-dialog-field cowin-parameter-form-field">
                <span>Cron</span>
                <div class="cowin-inline-control cowin-cron-control">
                  <ElInput
                    class="cowin-node-dialog-control"
                    modelValue={scheduleForm.value.cron}
                    placeholder="* * * * *"
                    onInput={(value: string | number) =>
                      updateScheduleForm({ cron: String(value ?? '') })
                    }
                  />
                  <span title="Configure Cron">
                    <ElButton
                      class="cowin-icon-button"
                      nativeType="button"
                      onClick={openCronDialog}
                    >
                      ⚙
                    </ElButton>
                  </span>
                </div>
              </label>
            ) : null}

            {scheduleForm.value.type === 'Daily Time Interval' ? (
              <>
                <label class="cowin-node-dialog-field cowin-parameter-form-field">
                  <span>Time Interval</span>
                  <div class="cowin-schedule-interval-control">
                    <ElInputNumber
                      class="cowin-node-dialog-control"
                      modelValue={scheduleForm.value.timeInterval}
                      min={1}
                      controlsPosition="right"
                      onChange={(value: number | undefined) =>
                        updateScheduleForm({ timeInterval: value ?? 1 })
                      }
                    />
                    <ElSelect
                      class="cowin-node-dialog-control"
                      modelValue={scheduleForm.value.intervalUnit}
                      onChange={(value: string | number) =>
                        updateScheduleForm({
                          intervalUnit: String(value) as IntervalUnit
                        })
                      }
                    >
                      {INTERVAL_UNITS.map((unit) => (
                        <ElOption key={unit} label={unit} value={unit} />
                      ))}
                    </ElSelect>
                  </div>
                </label>
                <label class="cowin-node-dialog-field cowin-parameter-form-field">
                  <span>Time Range</span>
                  <ElTimePicker
                    class="cowin-node-dialog-control"
                    modelValue={scheduleForm.value.timeRange}
                    isRange
                    valueFormat="HH:mm:ss"
                    format="HH:mm:ss"
                    startPlaceholder="Start Time"
                    endPlaceholder="End Time"
                    {...{
                      'onUpdate:modelValue': (value: unknown) =>
                        updateScheduleForm({
                          timeRange: normalizeStringRange(value)
                        })
                    }}
                  />
                </label>
                <label class="cowin-node-dialog-field cowin-parameter-form-field">
                  <span>Week Range</span>
                  <ElCheckboxGroup
                    class="cowin-schedule-week-range"
                    modelValue={scheduleForm.value.weekRange}
                    onChange={(value: unknown) =>
                      updateScheduleForm({
                        weekRange: normalizeStringRange(value)
                      })
                    }
                  >
                    {WEEK_DAYS.map((day) => (
                      <ElCheckbox key={day} value={day}>
                        {day}
                      </ElCheckbox>
                    ))}
                  </ElCheckboxGroup>
                </label>
              </>
            ) : null}

            <div class="cowin-parameter-actions">
              <ElButton nativeType="button" onClick={closeScheduleDialog}>
                Cancel
              </ElButton>
              <ElButton
                nativeType="button"
                type="primary"
                onClick={submitScheduleDialog}
              >
                OK
              </ElButton>
            </div>
          </div>
        </ElDialog>

        <ElDialog
          class="cowin-node-dialog cowin-parameter-dialog"
          modelValue={cronDialogOpen.value}
          width="min(620px, calc(100vw - 48px))"
          appendToBody
          destroyOnClose
          closeOnClickModal={false}
          onClose={() => {
            cronDialogOpen.value = false
          }}
          v-slots={{
            header: () => (
              <div>
                <h2>Configure Cron</h2>
              </div>
            )
          }}
        >
          <div class="cowin-schedule-cron-grid">
            {(
              [
                ['minute', 'Minute'],
                ['hour', 'Hour'],
                ['dayOfMonth', 'Day of Month'],
                ['month', 'Month'],
                ['dayOfWeek', 'Day of Week']
              ] as Array<[keyof CronForm, string]>
            ).map(([key, label]) => (
              <label key={key} class="cowin-node-dialog-field">
                <span>{label}</span>
                <ElInput
                  class="cowin-node-dialog-control"
                  modelValue={cronForm.value[key]}
                  onInput={(value: string | number) => {
                    cronForm.value = {
                      ...cronForm.value,
                      [key]: String(value ?? '')
                    }
                  }}
                />
              </label>
            ))}
          </div>
          <div class="cowin-parameter-actions">
            <ElButton
              nativeType="button"
              onClick={() => {
                cronDialogOpen.value = false
              }}
            >
              Cancel
            </ElButton>
            <ElButton
              nativeType="button"
              type="primary"
              onClick={confirmCronDialog}
            >
              OK
            </ElButton>
          </div>
        </ElDialog>
      </div>
    )
  }
})
