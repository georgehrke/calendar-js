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
import { Timezone } from '@nextcloud/timezones'
import AttendeeProperty from '../../properties/attendeeProperty.js'

/**
 * @import { Mixin } from '../../traits/mixin.js'
 * @import DateTimeValue from '../../values/dateTimeValue.js'
 * @import FreeBusyProperty from '../../properties/freeBusyProperty.js'
 */

/**
 * Members installed on the prototype by the advertise helpers at the end of this file
 *
 * @typedef {object} FreeBusyComponentMembers
 * @property {string | null} organizer Calendar address of the organizer of this FreeBusy component
 * @property {string | null} uid The UID of this FreeBusy component
 * @property {() => Generator<AttendeeProperty, void, undefined>} getAttendeeIterator Returns an iterator over all attendees
 * @property {() => AttendeeProperty[]} getAttendeeList Returns a list of all attendees
 * @property {(item: AttendeeProperty) => void} removeAttendee Removes one of the attendees
 * @property {() => void} clearAllAttendees Removes all attendees
 */

/**
 * @class FreeBusyComponent
 * @classdesc
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.4
 */
export default class FreeBusyComponent extends /** @type {typeof AbstractComponent & Mixin<FreeBusyComponentMembers>} */ (AbstractComponent) {
	/**
	 * Gets the start-date of the FreeBusy component
	 *
	 * @return {DateTimeValue}
	 */
	get startDate() {
		return this.getFirstPropertyFirstValue('DTSTART')
	}

	/**
	 * Sets the start-date of the FreeBusy component
	 *
	 * @param {DateTimeValue} startDate The start of the queried time-range
	 */
	set startDate(startDate) {
		this._modify()
		this.updatePropertyWithValue('DTSTART', startDate.getInTimezone(Timezone.utc))
	}

	/**
	 * Gets the end-date of the FreeBusy component
	 *
	 * @return {DateTimeValue}
	 */
	get endDate() {
		return this.getFirstPropertyFirstValue('DTEND')
	}

	/**
	 * Sets the start-date of the FreeBusy component
	 *
	 * @param {DateTimeValue} endDate The end of the queried time-range
	 */
	set endDate(endDate) {
		this._modify()
		this.updatePropertyWithValue('DTEND', endDate.getInTimezone(Timezone.utc))
	}

	/**
	 * Gets an iterator over all FreeBusyProperties
	 *
	 * @yields {FreeBusyProperty} A free-busy property
	 * @return {Generator<FreeBusyProperty, void, undefined>}
	 */
	* getFreeBusyIterator() {
		yield* this.getPropertyIterator('FREEBUSY')
	}

	/**
	 * Adds a new attendee based on their name and email-address
	 *
	 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.1
	 *
	 * @param {string} name The name of the attendee to add
	 * @param {string} email The email-address of the attendee to add
	 */
	addAttendeeFromNameAndEMail(name, email) {
		this._modify()
		this.addProperty(AttendeeProperty.fromNameAndEMail(name, email))
	}

	/**
	 * Sets the organiser property from common-name and email address
	 *
	 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.3
	 *
	 * @param {string} name The name of the organizer
	 * @param {string} email The email-address of the organizer
	 */
	setOrganizerFromNameAndEMail(name, email) {
		this._modify()
		this.deleteAllProperties('ORGANIZER')
		this.addProperty(AttendeeProperty.fromNameAndEMail(name, email, true))
	}
}

/**
 * The organizer of this FreeBusy component
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.3
 *
 * @name FreeBusyComponent#organizer
 * @type {string}
 */
advertiseSingleOccurrenceProperty(FreeBusyComponent.prototype, 'organizer')

/**
 * The UID of this FreeBusy component
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.7
 *
 * @name FreeBusyComponent#uid
 * @type {string}
 */
advertiseSingleOccurrenceProperty(FreeBusyComponent.prototype, 'uid')

/**
 * Returns an iterator of all attendees
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.1
 *
 * @name FreeBusyComponent#getAttendeeIterator
 * @function
 * @return {IterableIterator<AttendeeProperty>}
 */

/**
 * Returns a list of all attendees
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.1
 *
 * @name FreeBusyComponent#getAttendeeList
 * @function
 * @return {AttendeeProperty[]}
 */

/**
 * Removes an attendee
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.1
 *
 * @name FreeBusyComponent#removeAttendee
 * @function
 * @param {AttendeeProperty} attendee
 */

/**
 * Removes all attendees
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.1
 *
 * @name FreeBusyComponent#clearAllAttendees
 * @function
 */
advertiseMultipleOccurrenceProperty(FreeBusyComponent.prototype, 'attendee')
