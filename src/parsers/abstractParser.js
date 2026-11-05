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

/**
 * @import CalendarComponent from '../components/calendarComponent.js'
 */

/**
 * @class AbstractParser
 * @classdesc
 */
export default class AbstractParser {
	/**
	 * @class
	 *
	 * @param {object=} options Object of options
	 * @param {boolean=} options.extractGlobalProperties Whether or not to preserve properties from the VCALENDAR component (defaults to false)
	 * @param {boolean=} options.removeRSVPForAttendees Whether or not to remove RSVP from attendees (defaults to false)
	 * @param {boolean=} options.includeTimezones Whether or not to include timezones (defaults to false)
	 * @param {boolean=} options.preserveMethod Whether or not to preserve the iCalendar method (defaults to false)
	 * @param {boolean=} options.processFreeBusy Whether or not to process VFreeBusy components (defaults to false)
	 */
	constructor(options = {}) {
		if (new.target === AbstractParser) {
			throw new TypeError('Cannot instantiate abstract class AbstractParser')
		}

		/**
		 * Options for the parser
		 *
		 * @type {{removeRSVPForAttendees: boolean}}
		 * @private
		 */
		this._options = { ...options }

		/**
		 * A name extracted from the calendar-data
		 *
		 * @type {string | null}
		 * @protected
		 */
		this._name = null

		/**
		 * A color extracted from the calendar-data
		 *
		 * @type {string | null}
		 * @protected
		 */
		this._color = null

		/**
		 * Gets the url that this icalendar file can be updated from
		 *
		 * @type {string}
		 * @protected
		 */
		this._sourceURL = null

		/**
		 * Gets the update interval if this icalendar file can be updated from a source
		 *
		 * @type {string}
		 * @protected
		 */
		this._refreshInterval = null

		/**
		 * Gets the default timezone of this calendar
		 *
		 * @type {string}
		 * @protected
		 */
		this._calendarTimezone = null

		/**
		 * Error count during parsing
		 *
		 * @type {Error[]}
		 * @protected
		 */
		this._errors = []
	}

	/**
	 * Gets the name extracted from the calendar-data
	 *
	 * @return {string | null}
	 */
	getName() {
		return this._name
	}

	/**
	 * Gets the color extracted from the calendar-data
	 *
	 * @return {string | null}
	 */
	getColor() {
		return this._color
	}

	/**
	 * Gets whether this import can be converted into a webcal subscription
	 *
	 * @return {boolean}
	 */
	offersWebcalFeed() {
		return this._sourceURL !== null
	}

	/**
	 * Gets the url pointing to the webcal source
	 *
	 * @return {string | null}
	 */
	getSourceURL() {
		return this._sourceURL
	}

	/**
	 * Gets the recommended refresh rate to update this subscription
	 *
	 * @return {string | null}
	 */
	getRefreshInterval() {
		return this._refreshInterval
	}

	/**
	 * Gets the default timezone of this calendar
	 *
	 * @return {string}
	 */
	getCalendarTimezone() {
		return this._calendarTimezone
	}

	/**
	 * {String|Object} data
	 *
	 * @param {string|object} data The data to parse
	 * @throws {TypeError}
	 */
	parse(data) {
		void data
		throw new TypeError('Abstract method not implemented by subclass')
	}

	/**
	 * Returns one CalendarComponent at a time
	 *
	 * @return {Generator<CalendarComponent, void, undefined>}
	 */
	* getItemIterator() { // eslint-disable-line require-yield
		throw new TypeError('Abstract method not implemented by subclass')
	}

	/**
	 * Get an array of all items
	 *
	 * @return {CalendarComponent[]}
	 */
	getAllItems() {
		return Array.from(this.getItemIterator())
	}

	/**
	 * Returns a boolean whether or not the parsed data contains vevents
	 *
	 * @return {boolean}
	 */
	containsVEvents() {
		return false
	}

	/**
	 * Returns a boolean whether or not the parsed data contains vjournals
	 *
	 * @return {boolean}
	 */
	containsVJournals() {
		return false
	}

	/**
	 * Returns a boolean whether or not the parsed data contains vtodos
	 *
	 * @return {boolean}
	 */
	containsVTodos() {
		return false
	}

	/**
	 * Returns a boolean whether or not the parsed data contains vfreebusys
	 *
	 * @return {boolean}
	 */
	containsVFreeBusy() {
		return false
	}

	/**
	 * Returns a boolean whether
	 *
	 * @return {boolean}
	 */
	hasErrors() {
		return this._errors.length !== 0
	}

	/**
	 * Get a list of all errors that occurred
	 *
	 * @return {Error[]}
	 */
	getErrorList() {
		return this._errors.slice()
	}

	/**
	 * Returns the number of calendar-objects in parser
	 *
	 * @return {number}
	 */
	getItemCount() {
		return 0
	}

	/**
	 * Gets an option provided
	 *
	 * @template T
	 * @param {string} name The name of the option to get
	 * @param {T} defaultValue The default value to return if option not provided
	 * @return {T}
	 * @protected
	 */
	_getOption(name, defaultValue) {
		return Object.hasOwn(this._options, name)
			? this._options[name]
			: defaultValue
	}

	/**
	 * Return list of supported mime types
	 *
	 * @static
	 */
	static getMimeTypes() {
		throw new TypeError('Abstract method not implemented by subclass')
	}
}
