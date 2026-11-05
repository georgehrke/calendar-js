/**
 * @copyright Copyright (c) 2020 Georg Ehrke
 *
 * @author Georg Ehrke <georg-nextcloud@ehrke.email>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import { parseICSAndGetAllOccurrencesBetween } from '../../../src/index.js';
import DateTimeValue from '../../../src/values/dateTimeValue.js'
import RecurringWithoutDtStartError from '../../../src/errors/recurringWithoutDtStartError.js';

jest.mock('../../../src/factories/dateFactory.js')

describe('VTODO Integration tests', () => {

	it('should properly process a task with DTSTART and DURATION', () => {
		const ics = getAsset('vtodo-dtstart-duration')
		const start = DateTimeValue.fromJSDate(new Date(Date.UTC(1970, 0, 1, 0, 0, 0)))
		const end = DateTimeValue.fromJSDate(new Date(Date.UTC(2038, 0, 19, 3, 14, 7)))

		const iterator = parseICSAndGetAllOccurrencesBetween(ics, start, end)

		const todo = iterator.next().value
		expect(todo.title).toEqual('Test 2')
		expect(todo.id).toEqual('BC56AD2C-2F85-4B06-A88D-93F4C3E0F9AB###1584432000')
		expect(todo.startDate.jsDate.toISOString()).toEqual('2020-03-17T08:00:00.000Z')
		expect(todo.endDate.jsDate.toISOString()).toEqual('2020-03-17T08:15:00.000Z')
		expect(todo.percent).toEqual(100)
		expect(todo.completedTime.jsDate.toISOString()).toEqual('2020-03-23T09:27:58.000Z')
		expect(todo.dueTime).toEqual(null)

		// Verify there are no more todos
		expect(iterator.next().value).toEqual(undefined)
	})

	it('should properly process a task with DTSTART and DUE', () => {
		const ics = getAsset('vtodo-due-dtstart')
		const start = DateTimeValue.fromJSDate(new Date(Date.UTC(1970, 0, 1, 0, 0, 0)))
		const end = DateTimeValue.fromJSDate(new Date(Date.UTC(2038, 0, 19, 3, 14, 7)))

		const iterator = parseICSAndGetAllOccurrencesBetween(ics, start, end)

		const todo = iterator.next().value
		expect(todo.title).toEqual('Test 2')
		expect(todo.id).toEqual('BC56AD2C-2F85-4B06-A88D-93F4C3E0F9AB###1584432000')
		expect(todo.startDate.jsDate.toISOString()).toEqual('2020-03-17T08:00:00.000Z')
		expect(todo.endDate.jsDate.toISOString()).toEqual('2020-03-17T08:00:00.000Z')
		expect(todo.dueTime.jsDate.toISOString()).toEqual('2020-03-17T08:00:00.000Z')
		expect(todo.percent).toEqual(100)
		expect(todo.completedTime.jsDate.toISOString()).toEqual('2020-03-23T09:27:58.000Z')

		// Verify there are no more todos
		expect(iterator.next().value).toEqual(undefined)
	})

	it('should properly process a task with DUE only', () => {
		const ics = getAsset('vtodo-due-only')
		const start = DateTimeValue.fromJSDate(new Date(Date.UTC(1970, 0, 1, 0, 0, 0)))
		const end = DateTimeValue.fromJSDate(new Date(Date.UTC(2038, 0, 19, 3, 14, 7)))

		const iterator = parseICSAndGetAllOccurrencesBetween(ics, start, end)

		const todo = iterator.next().value
		expect(todo.title).toEqual('Calendar 1 - Task 1')
		expect(todo.id).toEqual('pwen4kz18g')
		expect(todo.startDate).toEqual(null)
		expect(todo.endDate.jsDate.toISOString()).toEqual('2019-01-01T12:34:00.000Z')
		expect(todo.dueTime.jsDate.toISOString()).toEqual('2019-01-01T12:34:00.000Z')

		// Verify there are no more todos
		expect(iterator.next().value).toEqual(undefined)
	})

	it('should properly process a task with neither DTSTART nor DUE', () => {
		const ics = getAsset('vtodo-no-due-no-dtstart')
		const start = DateTimeValue.fromJSDate(new Date(Date.UTC(1970, 0, 1, 0, 0, 0)))
		const end = DateTimeValue.fromJSDate(new Date(Date.UTC(2038, 0, 19, 3, 14, 7)))

		const iterator = parseICSAndGetAllOccurrencesBetween(ics, start, end)

		const todo = iterator.next().value
		expect(todo.title).toEqual('Test 1')
		expect(todo.id).toEqual('pwen4kz18g')
		expect(todo.startDate).toEqual(null)
		expect(todo.endDate).toEqual(null)
		expect(todo.dueTime).toEqual(null)

		// Verify there are no more todos
		expect(iterator.next().value).toEqual(undefined)
	})

	it('should properly expand a recurring task with DTSTART and DURATION', () => {
		const ics = getAsset('vtodo-recurring-dtstart-duration')
		const start = DateTimeValue.fromJSDate(new Date(Date.UTC(2020, 3, 1, 0, 0, 0)))
		const end = DateTimeValue.fromJSDate(new Date(Date.UTC(2020, 4, 1, 0, 0, 0)))

		const iterator = parseICSAndGetAllOccurrencesBetween(ics, start, end)

		const todo1 = iterator.next().value
		expect(todo1.title).toEqual('Test 2')
		expect(todo1.id).toEqual('BC56AD2C-2F85-4B06-A88D-93F4C3E0F9AB###1586847600')
		expect(todo1.startDate.jsDate.toISOString()).toEqual('2020-04-14T07:00:00.000Z')
		expect(todo1.endDate.jsDate.toISOString()).toEqual('2020-04-14T07:15:00.000Z')
		expect(todo1.dueTime).toEqual(null)

		const todo2 = iterator.next().value
		expect(todo2.title).toEqual('Test 2')
		expect(todo2.id).toEqual('BC56AD2C-2F85-4B06-A88D-93F4C3E0F9AB###1588057200')
		expect(todo2.startDate.jsDate.toISOString()).toEqual('2020-04-28T07:00:00.000Z')
		expect(todo2.endDate.jsDate.toISOString()).toEqual('2020-04-28T07:15:00.000Z')
		expect(todo2.dueTime).toEqual(null)

		// Verify there are no more todos
		expect(iterator.next().value).toEqual(undefined)
	})

	it('should properly expand a recurring task with DTSTART and DUE', () => {
		const ics = getAsset('vtodo-recurring-due-dtstart')
		const start = DateTimeValue.fromJSDate(new Date(Date.UTC(2020, 3, 1, 0, 0, 0)))
		const end = DateTimeValue.fromJSDate(new Date(Date.UTC(2020, 4, 1, 0, 0, 0)))

		const iterator = parseICSAndGetAllOccurrencesBetween(ics, start, end)

		const todo1 = iterator.next().value
		expect(todo1.title).toEqual('Test 2')
		expect(todo1.id).toEqual('BC56AD2C-2F85-4B06-A88D-93F4C3E0F9AB###1586847600')
		expect(todo1.startDate.jsDate.toISOString()).toEqual('2020-04-14T07:00:00.000Z')
		expect(todo1.endDate.jsDate.toISOString()).toEqual('2020-04-14T07:00:00.000Z')
		expect(todo1.dueTime.jsDate.toISOString()).toEqual('2020-04-14T07:00:00.000Z')

		const todo2 = iterator.next().value
		expect(todo2.title).toEqual('Test 2')
		expect(todo2.id).toEqual('BC56AD2C-2F85-4B06-A88D-93F4C3E0F9AB###1588057200')
		expect(todo2.startDate.jsDate.toISOString()).toEqual('2020-04-28T07:00:00.000Z')
		expect(todo2.endDate.jsDate.toISOString()).toEqual('2020-04-28T07:00:00.000Z')
		expect(todo2.dueTime.jsDate.toISOString()).toEqual('2020-04-28T07:00:00.000Z')

		// Verify there are no more todos
		expect(iterator.next().value).toEqual(undefined)
	})

	it('should properly expand a recurring task with only DTSTART', () => {
		const ics = getAsset('vtodo-recurring-dtstart-only')
		const start = DateTimeValue.fromJSDate(new Date(Date.UTC(2026, 10, 1, 0, 0, 0)))
		const end = DateTimeValue.fromJSDate(new Date(Date.UTC(2026, 10, 15, 0, 0, 0)))

		const iterator = parseICSAndGetAllOccurrencesBetween(ics, start, end)

		const todo1 = iterator.next().value
		expect(todo1.title).toEqual('Testing Repeating 1')
		expect(todo1.id).toEqual('748d8a30-aa3d-463a-829a-d0ad39bf7f4d###1793995200')
		expect(todo1.startDate.jsDate.toISOString()).toEqual('2026-11-06T20:00:00.000Z')
		expect(todo1.endDate).toEqual(null)

		const todo2 = iterator.next().value
		expect(todo2.title).toEqual('Testing Repeating 1')
		expect(todo2.id).toEqual('748d8a30-aa3d-463a-829a-d0ad39bf7f4d###1794600000')
		expect(todo2.startDate.jsDate.toISOString()).toEqual('2026-11-13T20:00:00.000Z')
		expect(todo2.endDate).toEqual(null)

		// Verify there are no more todos
		expect(iterator.next().value).toEqual(undefined)
	})

	it('should not expand a recurring tasks without a DTSTART', () => {
		const ics = getAsset('vtodo-recurring-no-due-no-dtstart-invalid')
		const start = DateTimeValue.fromJSDate(new Date(Date.UTC(1970, 0, 1, 0, 0, 0)))
		const end = DateTimeValue.fromJSDate(new Date(Date.UTC(2038, 0, 19, 3, 14, 7)))

		const iterator = parseICSAndGetAllOccurrencesBetween(ics, start, end)

		expect(() => iterator.next()).toThrow(RecurringWithoutDtStartError)
	})

	it('should properly expand a recurring task with recurrence-exceptions', () => {
		const ics = getAsset('vtodo-recurring-with-recurrence-exceptions')
		const start = DateTimeValue.fromJSDate(new Date(Date.UTC(2019, 6, 0, 0, 0, 0)))
		const end = DateTimeValue.fromJSDate(new Date(Date.UTC(2019, 6, 31, 23, 59, 59)))

		const iterator = parseICSAndGetAllOccurrencesBetween(ics, start, end)

		const todo1 = iterator.next().value
		expect(todo1.title).toEqual('Recurring task')
		expect(todo1.id).toEqual('24C45485-7943-4A1A-9551-12AD83DF1F6D###1562400000')
		expect(todo1.startDate.jsDate.toISOString()).toEqual('2019-07-06T08:00:00.000Z')
		expect(todo1.endDate.jsDate.toISOString()).toEqual('2019-07-06T08:00:00.000Z')
		expect(todo1.dueTime.jsDate.toISOString()).toEqual('2019-07-06T08:00:00.000Z')

		const todo2 = iterator.next().value
		expect(todo2.title).toEqual('Recurring task')
		expect(todo2.id).toEqual('24C45485-7943-4A1A-9551-12AD83DF1F6D###1563004800')
		expect(todo2.startDate.jsDate.toISOString()).toEqual('2019-07-13T08:00:00.000Z')
		expect(todo2.endDate.jsDate.toISOString()).toEqual('2019-07-13T08:00:00.000Z')
		expect(todo2.dueTime.jsDate.toISOString()).toEqual('2019-07-13T08:00:00.000Z')

		const todo3 = iterator.next().value
		expect(todo3.title).toEqual('Recurring task 123 this is modified')
		expect(todo3.id).toEqual('24C45485-7943-4A1A-9551-12AD83DF1F6D###1563609600')
		expect(todo3.startDate.jsDate.toISOString()).toEqual('2019-07-25T08:00:00.000Z')
		expect(todo3.endDate.jsDate.toISOString()).toEqual('2019-07-25T08:00:00.000Z')
		expect(todo3.dueTime.jsDate.toISOString()).toEqual('2019-07-25T08:00:00.000Z')

		const todo4 = iterator.next().value
		expect(todo4.title).toEqual('Recurring task')
		expect(todo4.id).toEqual('24C45485-7943-4A1A-9551-12AD83DF1F6D###1564214400')
		expect(todo4.startDate.jsDate.toISOString()).toEqual('2019-07-27T08:00:00.000Z')
		expect(todo4.endDate.jsDate.toISOString()).toEqual('2019-07-27T08:00:00.000Z')
		expect(todo4.dueTime.jsDate.toISOString()).toEqual('2019-07-27T08:00:00.000Z')

		// Verify there are no more todos
		expect(iterator.next().value).toEqual(undefined)

	})
})
