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
import AbstractComponent, {
	advertiseMultipleOccurrenceProperty,
	advertiseSingleOccurrenceProperty,
} from '../abstractComponent.js'
import AttendeeProperty from '../../properties/attendeeProperty.js'
import TriggerProperty from '../../properties/triggerProperty.js'

/**
 * @import BinaryValue from '../../values/binaryValue.js'
 * @import { Mixin } from '../../traits/mixin.js'
 * @import AttachmentProperty from '../../properties/attachmentProperty.js'
 * @import DateTimeValue from '../../values/dateTimeValue.js'
 * @import DurationValue from '../../values/durationValue.js'
 */

/**
 * Members installed on the prototype by the advertise helpers at the end of this file
 *
 * @typedef {object} AlarmComponentMembers
 * @property {string | null} action Action to be taken when this alarm is due (AUDIO, DISPLAY or EMAIL)
 * @property {string | null} description Description for this alarm
 * @property {string | null} summary Summary for this alarm, used as the subject of an EMAIL
 * @property {DurationValue | null} duration Delay period between repeated alarms
 * @property {number | null} repeat Number of times this alarm should be repeated
 * @property {string | BinaryValue | null} attachment Sound file of an AUDIO alarm
 * @property {() => Generator<AttendeeProperty, void, undefined>} getAttendeeIterator Returns an iterator over all attendees
 * @property {() => AttendeeProperty[]} getAttendeeList Returns a list of all attendees
 * @property {(item: AttendeeProperty) => void} removeAttendee Removes one of the attendees
 * @property {() => void} clearAllAttendees Removes all attendees
 */

/**
 * @class AlarmComponent
 * @classdesc
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.6
 */
export default class AlarmComponent extends /** @type {typeof AbstractComponent & Mixin<AlarmComponentMembers>} */ (AbstractComponent) {
	/**
	 * Adds a new attendee based on their name and email-address
	 *
	 * @param {string} name - Name of the attendee
	 * @param {string} email - E-Mail address of the attendee
	 * @return {boolean}
	 */
	addAttendeeFromNameAndEMail(name, email) {
		const attendeeProperty = AttendeeProperty.fromNameAndEMail(name, email)
		return this.addProperty(attendeeProperty)
	}

	/**
	 * Gets the trigger property
	 *
	 * @see https://tools.ietf.org/html/rfc5545#section-3.8.6.3
	 *
	 * @return {TriggerProperty}
	 */
	get trigger() {
		return this.getFirstProperty('TRIGGER')
	}

	/**
	 * Sets an absolute alarm
	 *
	 * @param {DateTimeValue} alarmTime - Absolute time for the trigger
	 */
	setTriggerFromAbsolute(alarmTime) {
		const triggerProperty = TriggerProperty.fromAbsolute(alarmTime)
		this.deleteAllProperties('TRIGGER')
		this.addProperty(triggerProperty)
	}

	/**
	 * Sets a relative trigger
	 *
	 * @param {DurationValue} alarmOffset - Relative time of the trigger, either related to start or end
	 * @param {boolean=} relatedToStart - Related to Start or end?
	 */
	setTriggerFromRelative(alarmOffset, relatedToStart = true) {
		const triggerProperty = TriggerProperty.fromRelativeAndRelated(alarmOffset, relatedToStart)
		this.deleteAllProperties('TRIGGER')
		this.addProperty(triggerProperty)
	}
}

/**
 * Action to be taken when this Alarm is due
 * Possible values:
 * - AUDIO
 * - DISPLAY
 * - EMAIL
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.6.1
 *
 * @name AlarmComponent#action
 * @type {string}
 */
advertiseSingleOccurrenceProperty(AlarmComponent.prototype, 'action')

/**
 * Description for this alarm
 * Can only be used in combination with action DISPLAY and EMAIL
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.5
 *
 * @name AlarmComponent#description
 * @type {string}
 */
advertiseSingleOccurrenceProperty(AlarmComponent.prototype, 'description')

/**
 * Summary for this alarm
 * Can only be used in combination with action EMAIL
 * Will be used as the EMAIL's subject
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.12
 *
 * @name AlarmComponent#summary
 * @type {string}
 */
advertiseSingleOccurrenceProperty(AlarmComponent.prototype, 'summary')

/**
 * The duration specifies the delay period between repeated alarms.
 * This property must be specified along with the repeat property
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.2.5
 *
 * @name AlarmComponent#duration
 * @type {DurationValue}
 */
advertiseSingleOccurrenceProperty(AlarmComponent.prototype, 'duration')

/**
 * The number of times an alarm should be repeated.
 * This property must be specified along with the duration property
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.6.2
 *
 * @name AlarmComponent#repeat
 * @type {number}
 */
advertiseSingleOccurrenceProperty(AlarmComponent.prototype, 'repeat')

/**
 * This attachment points to a sound file, can only be used in combination
 * with ACTION AUDIO
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.1
 *
 * @name AlarmComponent#attachment
 * @type {string|BinaryValue}
 */
advertiseSingleOccurrenceProperty(AlarmComponent.prototype, {
	name: 'attachment',
	iCalendarName: 'ATTACH',
})

/**
 * Get an iterator over all attendees
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.1
 *
 * @name AlarmComponent#getAttendeeIterator
 * @function
 * @return {IterableIterator<AttendeeProperty>}
 */

/**
 * Get a list of all attendees
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.1
 *
 * @name AlarmComponent#getAttendeeList
 * @function
 * @return {AttendeeProperty[]}
 */

/**
 * Removes an attendee from this alarm-component
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.1
 *
 * @name AlarmComponent#removeAttendee
 * @function
 * @param {AttendeeProperty} attendee - The attendee object to remove
 */

/**
 * Removes all attendees from this alarm-component
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.1
 *
 * @name AlarmComponent#clearAllAttendees
 * @function
 */
advertiseMultipleOccurrenceProperty(AlarmComponent.prototype, 'attendee')
