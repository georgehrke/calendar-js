/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import calendarJs = require('@nextcloud/calendar-js')

const start = calendarJs.DateTimeValue.fromJSDate(new Date(), true)
const calendar: calendarJs.CalendarComponent = calendarJs.createEvent(start, start.clone())
const titles: Array<string | null> = Array.from(calendar.getEventIterator()).map((event) => event.title)

// @ts-expect-error There is no default export.
calendarJs.default

export = titles
