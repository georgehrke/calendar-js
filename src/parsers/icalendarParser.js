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
import AbstractParser from './abstractParser.js'
import CalendarComponent from '../components/calendarComponent.js'
import { getRepairSteps } from './repairsteps/icalendar/index.js'
import { uc } from '../helpers/stringHelper.js'
import { getConstructorForComponentName } from '../components/root/index.js'
import { getTimezoneManager, Timezone } from '@nextcloud/timezones'
import RecurrenceManager from '../recurrence/recurrenceManager.js'
import DateTimeValue from '../values/dateTimeValue.js'
import ICAL from 'ical.js'
import TimezoneComponent from '../components/root/timezoneComponent.js'

/**
 * @import AbstractRecurringComponent from '../components/root/abstractRecurringComponent.js'
 * @import { TimezoneManager } from '@nextcloud/timezones'
 */

/**
 * @class ICalendarParser
 * @classdesc
 */
export default class ICalendarParser extends AbstractParser {
	/**
	 * @inheritDoc
	 * @param {ConstructorParameters<typeof AbstractParser>} args Arguments forwarded to the base class constructor
	 */
	constructor(...args) {
		super(...args)

		/**
		 * The raw text/calendar data
		 *
		 * @type {string}
		 * @protected
		 */
		this._rawData = null

		/**
		 * The CalendarComponent representing the raw data
		 *
		 * @type {CalendarComponent}
		 * @protected
		 */
		this._calendarComponent = null

		/**
		 * A flag whether this calendar-data contains vevents
		 *
		 * @type {boolean}
		 * @private
		 */
		this._containsVEvents = false

		/**
		 * A flag whether this calendar-data contains vjournals
		 *
		 * @type {boolean}
		 * @private
		 */
		this._containsVJournals = false

		/**
		 * A flag whether this calendar-data contains vtodos
		 *
		 * @type {boolean}
		 * @private
		 */
		this._containsVTodos = false

		/**
		 * A flag whether this calendar-data contains vfreebusy
		 *
		 * @type {boolean}
		 * @private
		 */
		this._containsVFreeBusy = false

		/**
		 * A map containing all VObjects.
		 * The key of this map is the UID
		 * The value an array of all VObjects with that particular UID
		 *
		 * @type {Map<string, AbstractRecurringComponent[]>}
		 * @private
		 */
		this._items = new Map()

		/**
		 * Items that are no recurrence-exceptions
		 * The key of this map is the UID
		 *
		 * @type {Map<string, AbstractRecurringComponent>}
		 * @private
		 */
		this._masterItems = new Map()

		/**
		 * Items that are recurrence exceptions
		 *
		 * @type {Map<string, AbstractRecurringComponent[]>}
		 * @private
		 */
		this._recurrenceExceptionItems = new Map()

		/**
		 * Some recurrence-exceptions come without a master item
		 * In that case we need to forge a master item
		 *
		 * @type {Map<string, AbstractRecurringComponent>}
		 * @private
		 */
		this._forgedMasterItems = new Map()

		/**
		 * A list of timezone-components found in the calendar-data
		 *
		 * @type {Map<string, Timezone>}
		 * @private
		 */
		this._timezones = new Map()

		/**
		 * A set of required timezones for each UID
		 *
		 * @type {Map<string, Set<string>>}
		 * @private
		 */
		this._requiredTimezones = new Map()

		/**
		 * Instance of the default timezone-manager
		 *
		 * @type {TimezoneManager}
		 * @private
		 */
		this._defaultTimezoneManager = getTimezoneManager()
	}

	/**
	 * Parses the actual calendar-data
	 *
	 * @param {string} ics The icalendar data to parse
	 */
	parse(ics) {
		this._rawData = ics

		this._applyRepairSteps()

		// If a timezone is not inside our TimezoneManager at the time of parsing
		// the internal zone will be marked as floating inside ICAL.Time
		// so before we start any actual parsing, we need to extract all timezones
		// and add them to the TimezoneManager
		this._extractTimezones()
		this._registerTimezones()

		this._createCalendarComponent()

		if (this._getOption('extractGlobalProperties', false)) {
			this._extractProperties()
		}

		this._processVObjects()

		if (this._getOption('processFreeBusy', false)) {
			this._processVFreeBusy()
		}
	}

	/**
	 * @inheritDoc
	 * @return {Generator<CalendarComponent, void, undefined>}
	 */
	* getItemIterator() {
		for (const itemList of this._items.values()) {
			const calendarComp = CalendarComponent.fromEmpty()

			if (this._getOption('includeTimezones', false)) {
				this._addRequiredTimezonesToCalendarComp(calendarComp, itemList[0].uid)
			}

			// Preserve the original product id, just in case we need special handling for certain clients later on ...
			if (this._calendarComponent.hasProperty('PRODID')) {
				calendarComp.deleteAllProperties('PRODID')
				calendarComp.addProperty(this._calendarComponent.getFirstProperty('PRODID').clone())
			}

			if (this._getOption('preserveMethod', false)) {
				if (this._calendarComponent.hasProperty('METHOD')) {
					calendarComp.deleteAllProperties('METHOD')
					calendarComp.addProperty(this._calendarComponent.getFirstProperty('METHOD').clone())
				}
			}

			for (const item of itemList) {
				calendarComp.addComponent(item)
			}

			yield calendarComp
		}
	}

	/**
	 * @inheritDoc
	 */
	containsVEvents() {
		return this._containsVEvents
	}

	/**
	 * @inheritDoc
	 */
	containsVJournals() {
		return this._containsVJournals
	}

	/**
	 * @inheritDoc
	 */
	containsVTodos() {
		return this._containsVTodos
	}

	/**
	 * @inheritDoc
	 */
	containsVFreeBusy() {
		return this._containsVFreeBusy
	}

	/**
	 * @inheritDoc
	 */
	getItemCount() {
		return Array.from(this._items.keys()).length
	}

	/**
	 * Applies all registered repair steps
	 *
	 * @private
	 */
	_applyRepairSteps() {
		for (const RepairStep of getRepairSteps()) {
			const step = new RepairStep()
			this._rawData = step.repair(this._rawData)
		}
	}

	/**
	 * Creates a calendar component based upon the repaired data
	 *
	 * @private
	 */
	_createCalendarComponent() {
		const jCal = ICAL.parse(this._rawData)
		const icalComp = new ICAL.Component(jCal)
		this._calendarComponent = CalendarComponent.fromICALJs(icalComp)
	}

	/**
	 * extracts properties
	 *
	 * @protected
	 */
	_extractProperties() {
		this._extractPropertyAndPutResultIntoVariable(['name', 'x-wr-calname'], '_name')
		this._extractPropertyAndPutResultIntoVariable(['color', 'x-apple-calendar-color'], '_color')
		this._extractPropertyAndPutResultIntoVariable(['source'], '_sourceURL')
		this._extractPropertyAndPutResultIntoVariable(['refresh-interval', 'x-published-ttl'], '_refreshInterval')
		this._extractPropertyAndPutResultIntoVariable(['x-wr-timezone'], '_calendarTimezone')
	}

	/**
	 * Extract a property and writes it into a class property
	 * names must be an array, it will use the value of the fist
	 * propertyname it can find
	 *
	 * @param {string[]} names The names of the properties to check
	 * @param {string} variableName The variable name to save it under
	 * @private
	 */
	_extractPropertyAndPutResultIntoVariable(names, variableName) {
		for (const name of names) {
			if (this._calendarComponent.hasProperty(name)) {
				this[variableName] = this._calendarComponent.getFirstPropertyFirstValue(name)
				return
			}
		}
	}

	/**
	 * Extracts timezones from the calendar component
	 *
	 * @protected
	 */
	_extractTimezones() {
		const matches = this._rawData.match(/^BEGIN:VTIMEZONE$(((?!^END:VTIMEZONE$)(.|\n))*)^END:VTIMEZONE$\n/gm)

		if (!matches) {
			return
		}

		for (const match of matches) {
			const tzidMatcher = match.match(/^TZID:(.*)$/gm)
			if (!tzidMatcher) {
				continue
			}

			const tzid = tzidMatcher[0].slice(5)
			const timezone = new Timezone(tzid, match)
			this._timezones.set(tzid, timezone)
		}
	}

	/**
	 * Registers unknown timezones into our timezone-manager
	 *
	 * @protected
	 */
	_registerTimezones() {
		for (const [tzid, timezone] of this._timezones) {
			if (!this._defaultTimezoneManager.hasTimezoneForId(tzid)) {
				this._defaultTimezoneManager.registerTimezone(timezone)
			}
		}
	}

	/**
	 * Processes the parsed vobjects
	 *
	 * @protected
	 */
	_processVObjects() {
		for (const vObject of this._calendarComponent.getVObjectIterator()) {
			this._addItem(vObject)
			this._markCompTypeAsSeen(vObject.name)
			if (vObject.isRecurrenceException()) {
				this._addRecurrenceException(vObject)
			} else {
				vObject.recurrenceManager = new RecurrenceManager(vObject)
				this._masterItems.set(vObject.uid, vObject)
			}

			for (const propertyToCheck of vObject.getPropertyIterator()) {
				for (const value of propertyToCheck.getValueIterator()) {
					if (value instanceof DateTimeValue && value.timezoneId) {
						this._addRequiredTimezone(vObject.uid, value.timezoneId)
					}
				}
			}

			// TRIGGER is supposed to be stored in UTC only,
			// but not all clients stick to this
			for (const alarm of vObject.getAlarmIterator()) {
				for (const propertyToCheck of alarm.getPropertyIterator()) {
					for (const value of propertyToCheck.getValueIterator()) {
						if (value instanceof DateTimeValue && value.timezoneId) {
							this._addRequiredTimezone(vObject.uid, value.timezoneId)
						}
					}
				}
			}

			if (this._getOption('removeRSVPForAttendees', false)) {
				for (const attendee of vObject.getAttendeeIterator()) {
					attendee.deleteParameter('RSVP')
				}
			}
		}

		for (const recurrenceExceptionList of this._recurrenceExceptionItems.values()) {
			for (const recurrenceException of recurrenceExceptionList) {
				// Check if there is a master item for this recurrence exception
				// otherwise we have to forge one
				if (!this._masterItems.has(recurrenceException.uid)) {
					const constructor = getConstructorForComponentName(recurrenceException.name)
					const forgedMaster = new constructor(recurrenceException.name, [
						['UID', recurrenceException.uid],
						['DTSTAMP', recurrenceException.stampTime.clone()],
						['DTSTART', recurrenceException.recurrenceId.clone()],
					])

					forgedMaster.recurrenceManager = new RecurrenceManager(forgedMaster)

					this._forgedMasterItems.set(recurrenceException.uid, forgedMaster)
					this._masterItems.set(recurrenceException.uid, forgedMaster)
					this._addItem(forgedMaster)
				} else {
					const master = this._masterItems.get(recurrenceException.uid)

					// This should usually not be the case,
					// only if the calendar-data is seriously broken.
					// Let's try to handle it anyway by adding it to
					// forgedMasterItems, we will simply add RDATEs
					// in the next step to make it recur
					if (!master.isRecurring()) {
						this._forgedMasterItems.set(master.uid, master)
					}
				}

				if (this._forgedMasterItems.has(recurrenceException.uid)) {
					const forgedMaster = this._forgedMasterItems.get(recurrenceException.uid)
					forgedMaster.recurrenceManager.addRecurrenceDate(false, recurrenceException.recurrenceId.clone())
				}

				const masterItem = this._masterItems.get(recurrenceException.uid)
				masterItem.recurrenceManager.relateRecurrenceException(recurrenceException)
			}
		}
	}

	/**
	 * Process FreeBusy components
	 *
	 * @private
	 */
	_processVFreeBusy() {
		for (const vObject of this._calendarComponent.getFreebusyIterator()) {
			this._addItem(vObject)
			this._markCompTypeAsSeen(vObject.name)

			for (const propertyToCheck of vObject.getPropertyIterator()) {
				for (const value of propertyToCheck.getValueIterator()) {
					if (value instanceof DateTimeValue && value.timezoneId) {
						this._addRequiredTimezone(vObject.uid, value.timezoneId)
					}
				}
			}
		}
	}

	/**
	 *
	 * @param {AbstractRecurringComponent} item The recurrence-item to register
	 * @private
	 */
	_addRecurrenceException(item) {
		if (this._recurrenceExceptionItems.has(item.uid)) {
			const arr = this._recurrenceExceptionItems.get(item.uid)
			arr.push(item)
		} else {
			this._recurrenceExceptionItems.set(item.uid, [item])
		}
	}

	/**
	 *
	 * @param {AbstractRecurringComponent} item The item to register
	 * @private
	 */
	_addItem(item) {
		if (this._items.has(item.uid)) {
			const arr = this._items.get(item.uid)
			arr.push(item)
		} else {
			this._items.set(item.uid, [item])
		}
	}

	/**
	 *
	 * @param {string} uid The uid of the calendar-object
	 * @param {string} timezoneId The timezoneId required by the object
	 * @private
	 */
	_addRequiredTimezone(uid, timezoneId) {
		if (timezoneId === 'UTC' || timezoneId === 'floating' || timezoneId === 'GMT' || timezoneId === 'Z') {
			return
		}

		if (this._requiredTimezones.has(uid)) {
			this._requiredTimezones.get(uid).add(timezoneId)
		} else {
			const set = new Set([timezoneId])
			this._requiredTimezones.set(uid, set)
		}
	}

	/**
	 *
	 * @param {CalendarComponent} calendarComp The calendar-component to add timezones to
	 * @param {string} uid The UID of the calendar-object
	 * @private
	 */
	_addRequiredTimezonesToCalendarComp(calendarComp, uid) {
		if (!this._requiredTimezones.has(uid)) {
			return
		}

		for (const requiredTimezone of this._requiredTimezones.get(uid)) {
			if (!this._defaultTimezoneManager.hasTimezoneForId(requiredTimezone)) {
				return
			}

			const timezone = this._defaultTimezoneManager.getTimezoneForId(requiredTimezone)
			// Is this an alias?
			if (timezone.timezoneId !== requiredTimezone) {
				this._replaceTimezoneWithAnotherOne(calendarComp, requiredTimezone, timezone.timezoneId)
			}

			const timezoneComponent = TimezoneComponent.fromICALJs(timezone.toICALJs())
			calendarComp.addComponent(timezoneComponent)
		}
	}

	/**
	 * Replaces all occurrences of searchTimezone with replaceTimezone
	 *
	 * @param {CalendarComponent} calendarComponent The calendar-component to replace a timezone in
	 * @param {string} searchTimezone The timezone to replace
	 * @param {string} replaceTimezone The replacement timezone
	 * @private
	 */
	_replaceTimezoneWithAnotherOne(calendarComponent, searchTimezone, replaceTimezone) {
		for (const vObject of this._calendarComponent.getVObjectIterator()) {
			for (const propertyToCheck of vObject.getPropertyIterator()) {
				for (const value of propertyToCheck.getValueIterator()) {
					if (!(value instanceof DateTimeValue)) {
						continue
					}

					if (value.timezoneId === searchTimezone) {
						value.silentlyReplaceTimezone(replaceTimezone)
					}
				}
			}

			// TRIGGER is supposed to be stored in UTC only,
			// but not all clients stick to this
			for (const alarm of vObject.getAlarmIterator()) {
				for (const propertyToCheck of alarm.getPropertyIterator()) {
					for (const value of propertyToCheck.getValueIterator()) {
						if (!(value instanceof DateTimeValue)) {
							continue
						}

						if (value.timezoneId === searchTimezone) {
							value.silentlyReplaceTimezone(replaceTimezone)
						}
					}
				}
			}
		}
	}

	/**
	 * Marks a certain component type as seen.
	 * This is used for
	 * containsVEvents()
	 * containsVJournals()
	 * containsVTodos()
	 *
	 * @param {string} compName The name of the visited component
	 * @private
	 */
	_markCompTypeAsSeen(compName) {
		switch (uc(compName)) {
			case 'VEVENT':
				this._containsVEvents = true
				break

			case 'VJOURNAL':
				this._containsVJournals = true
				break

			case 'VTODO':
				this._containsVTodos = true
				break

			case 'VFREEBUSY':
				this._containsVFreeBusy = true
				break
		}
	}

	/**
	 * @inheritDoc
	 */
	static getMimeTypes() {
		return ['text/calendar']
	}
}
