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
	advertiseSingleOccurrenceProperty,
} from './abstractComponent.js'
import { getConstructorForComponentName } from './root/index.js'
import { getConfig } from '../config.js'
import ICAL from 'ical.js'

/**
 * @import AbstractValue from '../values/abstractValue.js'
 * @import Property from '../properties/property.js'
 * @import { Mixin } from '../traits/mixin.js'
 * @import EventComponent from './root/eventComponent.js'
 * @import FreeBusyComponent from './root/freeBusyComponent.js'
 * @import JournalComponent from './root/journalComponent.js'
 * @import TimezoneComponent from './root/timezoneComponent.js'
 * @import ToDoComponent from './root/toDoComponent.js'
 */

/**
 * Members installed on the prototype by the advertise helpers at the end of this file
 *
 * @typedef {object} CalendarComponentMembers
 * @property {string | null} productId ProductId representing the software that created this calendar-document
 * @property {string | null} version iCalendar version of this calendar-document
 * @property {string} calendarScale Calendar-scale used in this calendar-document, defaults to GREGORIAN
 * @property {string | null} method Method of this calendar-document when being used in an iTIP message
 */

/**
 * This class represents one VCALENDAR block
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.4
 */
export default class CalendarComponent extends /** @type {typeof AbstractComponent & Mixin<CalendarComponentMembers>} */ (AbstractComponent) {
	/**
	 * Constructor
	 *
	 * @inheritDoc
	 * @param {string} name - Name of component
	 * @param {Array<Property | [string, string | number | AbstractValue | string[] | number[] | AbstractValue[] | null]>} properties - Array of properties stored inside the component
	 * @param {AbstractComponent[]} components - Array of subcomponents stored inside this component
	 */
	constructor(name = 'VCALENDAR', properties = [], components = []) {
		super(name, properties, components)
		/** @type {CalendarComponent} */
		this.root = this
		/** @type {null} */
		this.parent = null
	}

	/**
	 * Gets an iterator over all VTIMEZONE components
	 *
	 * @yields {TimezoneComponent} A VTIMEZONE component
	 * @return {Generator<TimezoneComponent, void, undefined>}
	 */
	* getTimezoneIterator() {
		yield* this.getComponentIterator('vtimezone')
	}

	/**
	 * Gets an iterator over all VObject components
	 *
	 * @yields {EventComponent|JournalComponent|ToDoComponent} A calendar object component
	 * @return {Generator<EventComponent|JournalComponent|ToDoComponent, void, undefined>}
	 */
	* getVObjectIterator() {
		yield* this.getEventIterator()
		yield* this.getJournalIterator()
		yield* this.getTodoIterator()
	}

	/**
	 * Gets an iterator over all VEVENT components
	 *
	 * @yields {EventComponent} A VEVENT component
	 * @return {Generator<EventComponent, void, undefined>}
	 */
	* getEventIterator() {
		yield* this.getComponentIterator('vevent')
	}

	/**
	 * Gets an iterator over all VFREEBUSY components
	 *
	 * @yields {FreeBusyComponent} A VFREEBUSY component
	 * @return {Generator<FreeBusyComponent, void, undefined>}
	 */
	* getFreebusyIterator() {
		yield* this.getComponentIterator('vfreebusy')
	}

	/**
	 * Gets an iterator over all VJOURNAL components
	 *
	 * @yields {JournalComponent} A VJOURNAL component
	 * @return {Generator<JournalComponent, void, undefined>}
	 */
	* getJournalIterator() {
		yield* this.getComponentIterator('vjournal')
	}

	/**
	 * Gets an iterator over all VTODO components
	 *
	 * @yields {ToDoComponent} A VTODO component
	 * @return {Generator<ToDoComponent, void, undefined>}
	 */
	* getTodoIterator() {
		yield* this.getComponentIterator('vtodo')
	}

	/**
	 * @inheritDoc
	 * @param {string} componentName The name of the component
	 * @return {ReturnType<typeof getConstructorForComponentName>}
	 */
	static _getConstructorForComponentName(componentName) {
		return getConstructorForComponentName(componentName)
	}

	/**
	 * Converts this calendar component into text/calendar
	 *
	 * @param {boolean} cleanUpTimezones Whether or not to clean up timezone data
	 * @return {string}
	 */
	toICS(cleanUpTimezones = true) {
		for (const vObject of this.getVObjectIterator()) {
			vObject.undirtify()
		}

		const icalRoot = this.toICALJs()
		if (cleanUpTimezones) {
			ICAL.helpers.updateTimezones(icalRoot)
		}
		return icalRoot.toString()
	}

	/**
	 * Creates a new empty calendar-component
	 *
	 * @param {Array<[string, string | number | AbstractValue | string[] | number[] | AbstractValue[] | null]>=} additionalProps Additional props to add to empty calendar-document
	 * @return {CalendarComponent}
	 */
	static fromEmpty(additionalProps = []) {
		return new this('VCALENDAR', [
			['prodid', getConfig('PRODID', '-//IDN georgehrke.com//calendar-js//EN')],
			['calscale', 'GREGORIAN'],
			['version', '2.0'],
		].concat(additionalProps))
	}

	/**
	 * Creates a new calendar-component with a method
	 *
	 * @param {string} method The method for the calendar-document
	 * @return {CalendarComponent}
	 */
	static fromMethod(method) {
		return this.fromEmpty([['method', method]])
	}

	/**
	 * @inheritDoc
	 * @param {ICAL.Component} icalValue The ical.js component to initialise from
	 * @return {CalendarComponent}
	 */
	static fromICALJs(icalValue) {
		const comp = super.fromICALJs(icalValue)
		comp.root = comp

		return comp
	}
}

/**
 * ProductId representing the software that created this calendar-document
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.7.3
 *
 * @name CalendarComponent#productId
 * @type {string}
 */
advertiseSingleOccurrenceProperty(CalendarComponent.prototype, {
	name: 'productId',
	iCalendarName: 'PRODID',
})

/**
 * iCalendar version of this calendar-document
 * minver and maxver parameters are not supported, since they
 * are virtually used by no calendaring-software
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.7.4
 *
 * @name CalendarComponent#version
 * @type {string}
 */

advertiseSingleOccurrenceProperty(CalendarComponent.prototype, {
	name: 'version',
})

/**
 * Calendar-scale used in this calendar-document
 * The default and only supported calendar-scale is GREGORIAN.
 * There is an iCalendar-extension about non-gregorian RRULES,
 * but that is not supported by calendar-js at the moment
 *
 * @see https://tools.ietf.org/html/rfc7529
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.7.1
 *
 * @name CalendarComponent#calendarScale
 * @type {string}
 * @default "GREGORIAN"
 */
advertiseSingleOccurrenceProperty(CalendarComponent.prototype, {
	name: 'calendarScale',
	iCalendarName: 'CALSCALE',
	defaultValue: 'GREGORIAN',
})

/**
 * Method of this calendar-document when being used in an iTIP message
 * Please see https://tools.ietf.org/html/rfc5546#section-3.2 for more information
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.7.2
 *
 * @name CalendarComponent#method
 * @type {string}
 */
advertiseSingleOccurrenceProperty(CalendarComponent.prototype, {
	name: 'method',
})
