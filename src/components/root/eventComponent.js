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
import {
	getAgeOfBirthday,
	getIconForBirthday,
	getTypeOfBirthdayEvent,
} from '../../helpers/birthdayHelper.js'
import DurationValue from '../../values/durationValue.js'
import GeoProperty from '../../properties/geoProperty.js'
import ConferenceProperty from '../../properties/conferenceProperty.js'

/**
 * @import { Mixin } from '../../traits/mixin.js'
 * @import DateTimeValue from '../../values/dateTimeValue.js'
 * @import { Timezone } from '@nextcloud/timezones'
 */

/**
 * Members installed on the prototype by the advertise helpers at the end of this file
 *
 * @typedef {object} EventComponentMembers
 * @property {'OPAQUE' | 'TRANSPARENT' | null} timeTransparency Time-transparency of this event, TRANSPARENT events are ignored for FREE/BUSY calculations
 * @property {string | null} description Description of this event
 * @property {number | null} geographicalPosition Latitude of the geographical position of this event
 * @property {string | null} location Location that this event takes place in
 * @property {number} priority Priority of this event
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
 * @class EventComponent
 * @classdesc
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.1
 */
export default class EventComponent extends /** @type {typeof AbstractRecurringComponent & Mixin<EventComponentMembers>} */ (AbstractRecurringComponent) {
	/**
	 * Returns whether this event is an all-day event
	 *
	 * @return {boolean}
	 */
	isAllDay() {
		return this.startDate.isDate && this.endDate.isDate
	}

	/**
	 * Checks whether it's possible to switch from date-time to date or vise-versa
	 *
	 * @return {boolean}
	 */
	canModifyAllDay() {
		return !this.recurrenceManager.masterItem.isRecurring()
	}

	/**
	 * Gets the calculated end-date of the event
	 *
	 * Quote from RFC 5545 3.6.1:
	 * The "DTSTART" property for a "VEVENT" specifies the inclusive
	 * start of the event.  For recurring events, it also specifies the
	 * very first instance in the recurrence set.  The "DTEND" property
	 * for a "VEVENT" calendar component specifies the non-inclusive end
	 * of the event.  For cases where a "VEVENT" calendar component
	 * specifies a "DTSTART" property with a DATE value type but no
	 * "DTEND" nor "DURATION" property, the event's duration is taken to
	 * be one day.  For cases where a "VEVENT" calendar component
	 * specifies a "DTSTART" property with a DATE-TIME value type but no
	 * "DTEND" property, the event ends on the same calendar date and
	 * time of day specified by the "DTSTART" property.
	 *
	 * @return {DateTimeValue}
	 */
	get endDate() {
		if (this.hasProperty('dtend')) {
			return this.getFirstPropertyFirstValue('dtend')
		}

		const dtend = this.startDate.clone()

		if (this.hasProperty('duration')) {
			dtend.addDuration(this.getFirstPropertyFirstValue('duration'))
		} else if (this.startDate.isDate) {
			dtend.addDuration(DurationValue.fromSeconds(60 * 60 * 24))
		} // There is nothing to do when this event is not allday

		return dtend
	}

	/**
	 * Sets the end time of the event
	 *
	 * @param {DateTimeValue} end The end of the event
	 */
	set endDate(end) {
		this.deleteAllProperties('duration')
		this.updatePropertyWithValue('dtend', end)
	}

	/**
	 * Gets the calculated duration of the event
	 *
	 * @return {DurationValue}
	 */
	get duration() {
		if (this.hasProperty('duration')) {
			return this.getFirstPropertyFirstValue('duration')
		}

		return this.startDate.subtractDateWithTimezone(this.endDate)
	}

	/**
	 * Sets the calculated duration of the event
	 *
	 * @param {DurationValue} duration The duration of the event
	 */
	set duration(duration) {
		this.deleteAllProperties('dtend')
		this.updatePropertyWithValue('duration', duration)
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
	 * @param {string} uri The URI of the conference system
	 * @param {string=} label The label for the conference system
	 * @param {string[]=} features The features of the conference system
	 */
	addConference(uri, label = null, features = null) {
		this._modify()
		this.addProperty(ConferenceProperty.fromURILabelAndFeatures(uri, label, features))
	}

	/**
	 * Adds a duration to the start of the event
	 *
	 * @param {DurationValue} duration The duration to add
	 */
	addDurationToStart(duration) {
		this.startDate.addDuration(duration)
	}

	/**
	 * Adds a duration to the end of the event
	 *
	 * @param {DurationValue} duration The duration to add
	 */
	addDurationToEnd(duration) {
		const endDate = this.endDate
		endDate.addDuration(duration)

		this.endDate = endDate
	}

	/**
	 * Shifts the entire event by the given duration
	 *
	 * @param {DurationValue} delta The duration to shift event by
	 * @param {boolean} allDay Whether the updated event should be all-day or not
	 * @param {Timezone} defaultTimezone The default timezone if moving from all-day to timed event
	 * @param {DurationValue} defaultAllDayDuration The default all-day duration if moving from timed to all-day
	 * @param {DurationValue} defaultTimedDuration The default timed duration if moving from all-day to timed
	 */
	shiftByDuration(delta, allDay, defaultTimezone, defaultAllDayDuration, defaultTimedDuration) {
		const currentAllDay = this.isAllDay()

		if (currentAllDay !== allDay && !this.canModifyAllDay()) {
			throw new TypeError('Can\'t modify all-day of this event')
		}

		this.startDate.isDate = allDay
		this.startDate.addDuration(delta)

		// If this event was moved from the all-day area into the time-grid,
		// then we have to add a timezone and the default duration
		if (currentAllDay && !allDay) {
			this.startDate.replaceTimezone(defaultTimezone)

			this.endDate = this.startDate.clone()
			this.endDate.addDuration(defaultTimedDuration)
		}

		// If this event was moved from the time-grid into the all-day area,
		// then we have to change the default duration
		if (!currentAllDay && allDay) {
			this.endDate = this.startDate.clone()
			this.endDate.addDuration(defaultAllDayDuration)
		}

		// If this event was only moved inside the time-grid or only inside
		// the all-day area, then we only have to adjust the end-date
		if (currentAllDay === allDay) {
			const endDate = this.endDate
			endDate.addDuration(delta)
			this.endDate = endDate
		}
	}

	/**
	 * Checks if this is a birthday event
	 *
	 * @return {boolean}
	 */
	isBirthdayEvent() {
		return getTypeOfBirthdayEvent(this) === 'BDAY'
	}

	/**
	 * Gets the icon to the birthday event
	 *
	 * @return {string}
	 */
	getIconForBirthdayEvent() {
		return getIconForBirthday(this)
	}

	/**
	 * Calculates the age of the birthday
	 *
	 * @return {number}
	 */
	getAgeForBirthdayEvent() {
		return getAgeOfBirthday(this, this.startDate.year)
	}

	/**
	 * Serializes the entire series to ICS
	 *
	 * @return {string}
	 */
	toICSEntireSeries() {
		return this.root.toICS()
	}

	/**
	 * Serializes exactly this recurrence to ICS
	 * It removes all recurrence information
	 *
	 * @return {string}
	 */
	toICSThisOccurrence() {
		const clone = this.clone()

		clone.deleteAllProperties('RRULE')
		clone.deleteAllProperties('EXRULE')
		clone.deleteAllProperties('RDATE')
		clone.deleteAllProperties('EXDATE')
		clone.deleteAllProperties('RECURRENCE-ID')

		clone.root = clone.root.constructor.fromEmpty()
		clone.parent = clone.root
		clone.root.addComponent(clone)

		return clone.root.toICS()
	}

	/**
	 * Checks if this event is in a given time-frame
	 *
	 * @param {DateTimeValue} start Start of time-range to check
	 * @param {DateTimeValue} end End of time-range to check
	 * @return {boolean}
	 */
	isInTimeFrame(start, end) {
		return start.compare(this.endDate) <= 0 && end.compare(this.startDate) >= 0
	}
}

/**
 * Time-transparency of this event.
 * If set to TRANSPARENT, this event will be ignored for FREE/BUSY calculations.
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.2.7
 *
 * @name EventComponent#timeTransparency
 * @type {string}
 */
advertiseSingleOccurrenceProperty(EventComponent.prototype, {
	name: 'timeTransparency',
	iCalendarName: 'TRANSP',
	allowedValues: ['OPAQUE', 'TRANSPARENT'],
	defaultValue: 'OPAQUE',
})

/**
 * Description of this event.
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.5
 *
 * @name EventComponent#description
 * @type {string}
 */
advertiseSingleOccurrenceProperty(EventComponent.prototype, 'description')

/**
 * Geographical position of this event
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.6
 *
 * @name EventComponent#geographicalPosition
 * @type {number}
 */
advertiseSingleOccurrenceProperty(EventComponent.prototype, {
	name: 'geographicalPosition',
	iCalendarName: 'GEO',
})

/**
 * Location that this event takes place in
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.7
 *
 * @name EventComponent#location
 * @type {string}
 */
advertiseSingleOccurrenceProperty(EventComponent.prototype, 'location')

/**
 * Priority of this event
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.9
 *
 * @name EventComponent#priority
 * @type {number}
 */
advertiseSingleOccurrenceProperty(EventComponent.prototype, {
	name: 'priority',
	allowedValues: Array(9).keys(),
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
 * @name EventComponent#getResourceIterator
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
 * @name EventComponent#getResourceList
 * @function
 * @param {string=} lang
 * @return {string[]}
 */

/**
 * Adds a resource
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.10
 *
 * @name EventComponent#addResource
 * @function
 * @param {string} resource
 * @param {string=} lang
 */

/**
 * Removes a resource
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.10
 *
 * @name EventComponent#removeResource
 * @function
 * @param {string} resource
 * @param {string=} lang
 */

/**
 * Removes all resources from this event
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.10
 *
 * @name EventComponent#clearAllResources
 * @function
 * @param {string=} lang
 */
advertiseMultiValueStringPropertySeparatedByLang(EventComponent.prototype, {
	name: 'resource',
	iCalendarName: 'RESOURCES',
})

/**
 * Gets an iterator over all conference properties
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.11
 *
 * @name EventComponent#getConferenceIterator
 * @function
 * @return {IterableIterator<ConferenceProperty>}
 */

/**
 * Gets a list of all conference properties
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.11
 *
 * @name EventComponent#getConferenceList
 * @function
 * @return {ConferenceProperty[]}
 */

/**
 * Removes a conference from this event
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.11
 *
 * @name EventComponent#removeConference
 * @function
 * @param {ConferenceProperty} conference
 */

/**
 * Removes all conferences from this event
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.11
 *
 * @name EventComponent#clearAllConferences
 * @function
 */
advertiseMultipleOccurrenceProperty(EventComponent.prototype, 'conference')
