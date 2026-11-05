/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import {
	AlarmComponent,
	AttendeeProperty,
	CalendarComponent,
	createEvent,
	createFreeBusyRequest,
	DateTimeValue,
	DurationValue,
	EventComponent,
	FreeBusyComponent,
	getParserManager,
	parseICSAndGetAllOccurrencesBetween,
	RecurValue,
	setConfig,
	TextProperty,
	ToDoComponent,
} from '@nextcloud/calendar-js'
import type { AbstractRecurringComponent } from '@nextcloud/calendar-js'

setConfig('PRODID', '-//Nextcloud//Types//EN')

const start: DateTimeValue = DateTimeValue.fromJSDate(new Date(), true)
const end: DateTimeValue = start.clone()
end.addDuration(DurationValue.fromSeconds(3600))

const organizer = AttendeeProperty.fromNameAndEMail('Alice', 'alice@example.com', true)
const freeBusy: CalendarComponent = createFreeBusyRequest(start, end, organizer, [organizer])
const freeBusyComponents: FreeBusyComponent[] = Array.from(freeBusy.getFreebusyIterator())
const freeBusyOrganizer: string | null = freeBusyComponents[0].organizer

const occurrences: Generator<AbstractRecurringComponent, void, undefined> = parseICSAndGetAllOccurrencesBetween('BEGIN:VCALENDAR\r\nEND:VCALENDAR', start, end)
const parser = getParserManager().getParserForFileType('text/calendar')
parser.parse('BEGIN:VCALENDAR\r\nEND:VCALENDAR')
const parsed: CalendarComponent[] = parser.getAllItems()

const empty: CalendarComponent = CalendarComponent.fromEmpty([['method', 'REQUEST']])
const calendar: CalendarComponent = createEvent(start, end)
calendar.productId = '-//Nextcloud//Types//EN'
const calendarScale: string = calendar.calendarScale
const method: string | null = calendar.method
const copy: CalendarComponent = calendar.clone()

const event: EventComponent = Array.from(calendar.getEventIterator())[0]
event.title = 'Meeting'
event.title = null
event.location = 'Berlin'
event.priority = 5
event.accessClass = 'CONFIDENTIAL'
event.timeTransparency = 'TRANSPARENT'
const stamp: DateTimeValue | null = event.stampTime
const sequence: number | null = event.sequence
const clonedEvent: EventComponent = event.clone()
event.isLocked()
event.lock()
event.subscribe(() => {})

event.addCategory('Work')
const categories: string[] = event.getCategoryList('en')
const removed: boolean = event.removeCategory('Work')
event.clearAllCategories()
event.addResource('Projector', 'en')
const resources: Generator<string, void, undefined> = event.getResourceIterator()

event.addAttendeeFromNameAndEMail('Bob', 'bob@example.com')
const attendees: AttendeeProperty[] = event.getAttendeeList()
event.removeAttendee(attendees[0])
event.clearAllAttendees()
const comments: TextProperty[] = event.getCommentList()
const alarms: AlarmComponent[] = event.getAlarmList()
const allAlarms: Generator<AlarmComponent, void, undefined> = event.getAlarmIterator()
const master: RecurValue[] = event.recurrenceManager.getRecurrenceRuleList()

const alarm = alarms[0]
alarm.repeat = 2
alarm.duration = DurationValue.fromSeconds(60)
const alarmAttendees: AttendeeProperty[] = alarm.getAttendeeList()

const toDo: ToDoComponent = Array.from(calendar.getTodoIterator())[0]
toDo.percent = 50
toDo.dueTime = end
const dueTime: DateTimeValue | null = toDo.dueTime
const priority: number = toDo.priority
toDo.addConference('https://example.com/call')

for (const journal of calendar.getJournalIterator()) {
	journal.addDescription('Entry')
	const descriptions: TextProperty[] = journal.getDescriptionList()
	journal.clearAllDescriptions()
	void descriptions
}
for (const timezone of calendar.getTimezoneIterator()) {
	const timezoneId: string | null = timezone.timezoneId
	void timezoneId
}

// @ts-expect-error Unset properties are null.
const title: string = event.title
// @ts-expect-error The title is a string.
event.title = 123
// @ts-expect-error Only the allowed access classes can be set.
event.accessClass = 'SECRET'
// @ts-expect-error The stamp is a DateTimeValue, not a string.
event.stampTime = 'now'
// @ts-expect-error Advertised multi-occurrence properties have no generic add method.
event.addAttendee(organizer)
// @ts-expect-error Removing an attendee requires a property.
event.removeAttendee('bob@example.com')
// @ts-expect-error The mixins must not introduce an any index signature.
event.nonexistentMethod()
// @ts-expect-error Protected trait members are not part of the public API.
event._modify()
// @ts-expect-error Occurrences are recurring components, not calendars.
for (const occurrence of occurrences) occurrence.getEventIterator()
// @ts-expect-error Event members are not available on calendars.
calendar.title

export {
	calendarScale, categories, clonedEvent, comments, copy, dueTime, empty, freeBusyOrganizer,
	master, method, alarmAttendees, allAlarms, parsed, priority, removed, resources, sequence, stamp, title,
}
