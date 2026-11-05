/**
 * @copyright Copyright (c) 2019 Georg Ehrke
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
 */
import AbstractRecurringComponent from './abstractRecurringComponent.js'
import {
	advertiseMultipleOccurrenceProperty,
	advertiseMultiValueStringPropertySeparatedByLang,
	advertiseSingleOccurrenceProperty,
} from '../abstractComponent.js'
import ConferenceProperty from '../../properties/conferenceProperty.js'
import GeoProperty from '../../properties/geoProperty.js'

/**
 * @import { Mixin } from '../../traits/mixin.js'
 * @import DateTimeValue from '../../values/dateTimeValue.js'
 * @import DurationValue from '../../values/durationValue.js'
 * @import { Timezone } from '@nextcloud/timezones'
 */

/**
 * Members installed on the prototype by the advertise helpers at the end of this file
 *
 * @typedef {object} ToDoComponentMembers
 * @property {DateTimeValue | null} completedTime The time when this task was completed
 * @property {DateTimeValue | null} dueTime The time when this task is due
 * @property {DurationValue | null} duration The duration of this task
 * @property {number | null} percent The percentage this task was already fulfilled
 * @property {string | null} description Description of this task
 * @property {string | null} location Location of this task
 * @property {number} priority Priority of this task
 * @property {(lang?: string | null) => Generator<string, void, undefined>} getResourceIterator Returns an iterator over all resources, optionally only those of the given language
 * @property {(lang?: string | null) => string[]} getResourceList Returns a list of all resources, optionally only those of the given language
 * @property {(value: string, lang?: string | null) => void} addResource Adds a value to the resources
 * @property {(value: string, lang?: string | null) => boolean} removeResource Removes a value from the resources, returns whether it was found
 * @property {(lang?: string | null) => void} clearAllResources Removes all resources, optionally only those of the given language
 * @property {() => Generator<ConferenceProperty, void, undefined>} getConferenceIterator Returns an iterator over all conferences
 * @property {() => ConferenceProperty[]} getConferenceList Returns a list of all conferences
 * @property {(item: ConferenceProperty) => void} removeConference Removes one of the conferences
 * @property {() => void} clearAllConferences Removes all conferences
 */

/**
 * @class ToDoComponent
 * @classdesc
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.2
 */
export default class ToDoComponent extends /** @type {typeof AbstractRecurringComponent & Mixin<ToDoComponentMembers>} */ (AbstractRecurringComponent) {
	/**
	 * Returns whether this event is an all-day event
	 *
	 * @return {boolean}
	 */
	isAllDay() {
		const propertiesToCheck = ['DTSTART', 'DUE']
		for (const propertyToCheck of propertiesToCheck) {
			if (this.hasProperty(propertyToCheck)) {
				return this.getFirstPropertyFirstValue(propertyToCheck).isDate
			}
		}

		// If a task is not associated with any date, it is defined to
		// occur on any successive date until it is completed.
		// We are treating it as all-day in that case.
		return true
	}

	/**
	 * Checks whether it's possible to switch from date-time to date or vise-versa
	 *
	 * @return {boolean}
	 */
	canModifyAllDay() {
		if (!this.hasProperty('dtstart') && !this.hasProperty('due')) {
			return false
		}

		return !this.recurrenceManager.masterItem.isRecurring()
	}

	/**
	 * Gets the calculated end-date of the task
	 *
	 * If there is a due-date, we will just return that.
	 * If there is a start-date and a duration, we will
	 * calculate the end-date based on that.
	 *
	 * If there is neither a due-date nor a combination
	 * of start-date and duration, we just return null
	 *
	 * @return {DateTimeValue|null}
	 */
	get endDate() {
		if (this.hasProperty('due')) {
			return this.getFirstPropertyFirstValue('due')
		}

		if (!this.hasProperty('dtstart') || !this.hasProperty('duration')) {
			return null
		}

		const endDate = this.startDate.clone()
		endDate.addDuration(this.getFirstPropertyFirstValue('duration'))
		return endDate
	}

	/**
	 * Shifts the entire task by the given duration
	 *
	 * @param {DurationValue} delta The duration to shift event by
	 * @param {boolean} allDay Whether the updated event should be all-day or not
	 * @param {Timezone} defaultTimezone The default timezone if moving from all-day to timed event
	 * @param {DurationValue} defaultAllDayDuration The default all-day duration if moving from timed to all-day
	 * @param {DurationValue} defaultTimedDuration The default timed duration if moving from all-day to timed
	 */
	shiftByDuration(delta, allDay, defaultTimezone, defaultAllDayDuration, defaultTimedDuration) {
		void defaultAllDayDuration
		void defaultTimedDuration
		const currentAllDay = this.isAllDay()

		if (!this.hasProperty('dtstart') && !this.hasProperty('due')) {
			throw new TypeError('This task does not have a start-date nor due-date')
		}

		if (currentAllDay !== allDay && !this.canModifyAllDay()) {
			throw new TypeError('Can\'t modify all-day of this todo')
		}

		// If this task has a start-date, update it
		// This is especially important, if you shift
		// the task by a negative duration, because
		// dtstart always has to be prior to the due date
		if (this.hasProperty('dtstart')) {
			this.startDate.isDate = allDay
			this.startDate.addDuration(delta)

			if (currentAllDay && !allDay) {
				this.startDate.replaceTimezone(defaultTimezone)
			}
		}

		if (this.hasProperty('due')) {
			this.dueTime.isDate = allDay
			this.dueTime.addDuration(delta)

			if (currentAllDay && !allDay) {
				this.dueTime.replaceTimezone(defaultTimezone)
			}
		}
	}

	/**
	 * Checks if this event is in a given time-frame
	 *
	 * @param {DateTimeValue} start Start of time-range to check
	 * @param {DateTimeValue} end End of time-range to check
	 * @return {boolean}
	 */
	isInTimeFrame(start, end) {
		const startDate = this.startDate
		const endDate = this.endDate

		if (!startDate && !endDate) {
			return true
		}

		if (startDate && !endDate) {
			return end.compare(startDate) >= 0
		}

		if (!startDate && endDate) {
			return start.compare(endDate) <= 0
		}

		return start.compare(endDate) <= 0 && end.compare(startDate) >= 0
	}

	/**
	 * Gets the geographical position property
	 *
	 * @return {GeoProperty}
	 */
	get geographicalPosition() {
		return this.getFirstProperty('GEO')
	}

	/**
	 * Sets the geographical position based on latitude and longitude
	 *
	 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.6
	 *
	 * @param {number} lat - latitude
	 * @param {number} long - longitude
	 */
	setGeographicalPositionFromLatitudeAndLongitude(lat, long) {
		this.deleteAllProperties('GEO')
		this.addProperty(GeoProperty.fromPosition(lat, long))
	}

	/**
	 * Adds a new conference property based on URI, label and features
	 *
	 * @see https://tools.ietf.org/html/rfc7986#section-5.11
	 *
	 * @param {string} uri The URI of the conference
	 * @param {string=} label The label of the conference
	 * @param {string[]=} features Supported features of conference-system
	 */
	addConference(uri, label = null, features = null) {
		this.addProperty(ConferenceProperty.fromURILabelAndFeatures(uri, label, features))
	}

	/**
	 * Gets a recurrence-id that has to be used to refer to this task.
	 * This is used for recurrence-management.
	 *
	 * Gracefully handles the case where a task has no start-date, but a due-date.
	 *
	 * @return {DateTimeValue|null}
	 */
	getReferenceRecurrenceId() {
		return super.getReferenceRecurrenceId() ?? this.endDate
	}
}

/**
 * The time when a task was completed
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.2.1
 *
 * @name ToDoComponent#completedTime
 * @type {DateTimeValue}
 */
advertiseSingleOccurrenceProperty(ToDoComponent.prototype, {
	name: 'completedTime',
	iCalendarName: 'COMPLETED',
})

/**
 * The time when a task is due
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.2.3
 *
 * @name ToDoComponent#dueTime
 * @type {DateTimeValue}
 */
advertiseSingleOccurrenceProperty(ToDoComponent.prototype, {
	name: 'dueTime',
	iCalendarName: 'DUE',
})

/**
 * The time when a task was completed
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.2.5
 *
 * @name ToDoComponent#duration
 * @type {DurationValue}
 */
advertiseSingleOccurrenceProperty(ToDoComponent.prototype, {
	name: 'duration',
})

/**
 * The percentage a task was already fulfilled
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.8
 *
 * @name ToDoComponent#percent
 * @type {number}
 */
advertiseSingleOccurrenceProperty(ToDoComponent.prototype, {
	name: 'percent',
	iCalendarName: 'PERCENT-COMPLETE',
})

/**
 * Description of this task.
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.5
 *
 * @name ToDoComponent#description
 * @type {string}
 */
advertiseSingleOccurrenceProperty(ToDoComponent.prototype, 'description')

/**
 * Location of this task.
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.7
 *
 * @name ToDoComponent#location
 * @type {string}
 */
advertiseSingleOccurrenceProperty(ToDoComponent.prototype, 'location')

/**
 * Priority of this task.
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.9
 *
 * @name ToDoComponent#priority
 * @type {number}
 */
advertiseSingleOccurrenceProperty(ToDoComponent.prototype, {
	name: 'priority',
	allowedValues: Array.from(Array(10).keys()),
	defaultValue: 0,
	unknownValue: 0,
})

/**
 * Returns an iterator over all resources
 * If the parameter lang is given, it will only
 * return an iterator for Resources matching that language
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.10
 *
 * @name ToDoComponent#getResourceIterator
 * @function
 * @param {string=} lang
 * @return {IterableIterator<string>}
 */

/**
 * Returns a list of all resources
 * If the parameter lang is given, it will only
 * return an iterator for resources matching that language
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.10
 *
 * @name ToDoComponent#getResourceList
 * @function
 * @param {string=} lang
 * @return {string[]}
 */

/**
 * Adds a resource
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.10
 *
 * @name ToDoComponent#addResource
 * @function
 * @param {string} resource
 * @param {string=} lang
 */

/**
 * Removes a resource
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.10
 *
 * @name ToDoComponent#removeResource
 * @function
 * @param {string} resource
 * @param {string=} lang
 */

/**
 * Removes all resources from this task
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.10
 *
 * @name ToDoComponent#clearAllResources
 * @function
 * @param {string=} lang
 */
advertiseMultiValueStringPropertySeparatedByLang(ToDoComponent.prototype, {
	name: 'resource',
	iCalendarName: 'RESOURCES',
})

/**
 * Gets an iterator over all conference properties
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.11
 *
 * @name ToDoComponent#getConferenceIterator
 * @function
 * @return {IterableIterator<ConferenceProperty>}
 */

/**
 * Gets a list of all conference properties
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.11
 *
 * @name ToDoComponent#getConferenceList
 * @function
 * @return {ConferenceProperty[]}
 */

/**
 * Removes a conference from this event
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.11
 *
 * @name ToDoComponent#removeConference
 * @function
 * @param {ConferenceProperty} conference
 */

/**
 * Removes all conferences from this event
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.11
 *
 * @name ToDoComponent#clearAllConferences
 * @function
 */
advertiseMultipleOccurrenceProperty(ToDoComponent.prototype, 'conference')
