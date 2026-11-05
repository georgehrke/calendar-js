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
import AbstractValue from './abstractValue.js'
import DateTimeValue from './dateTimeValue.js'
import { uc } from '../helpers/stringHelper.js'
import ICAL from 'ical.js'

const ALLOWED_FREQ = ['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']

/**
 * @class RecurValue
 * @classdesc Wrapper for ICAL.Recur
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.3.10
 * @see https://github.com/mozilla-comm/ical.js/blob/master/lib/ical/recur.js
 */
export default class RecurValue extends AbstractValue {
	/**
	 * Constructor
	 *
	 * @param {ICAL.Recur} icalValue The ical.js rrule value
	 * @param {DateTimeValue?} until The Until date
	 */
	constructor(icalValue, until) {
		super(icalValue)

		/**
		 * DateTimeValue object for Until
		 *
		 * @type {DateTimeValue}
		 * @private
		 */
		this._until = until
	}

	/**
	 * Gets the stored interval of this recurrence rule
	 *
	 * @return {number}
	 */
	get interval() {
		return this._innerValue.interval
	}

	/**
	 * Sets the stored interval of this recurrence rule
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {number} interval New Interval to set
	 */
	set interval(interval) {
		this._modifyContent()
		this._innerValue.interval = parseInt(interval, 10)
	}

	/**
	 * Gets the weekstart used to calculate the recurrence expansion
	 *
	 * @return {number}
	 */
	get weekStart() {
		return this._innerValue.wkst
	}

	/**
	 * Sets the weekstart used to calculate the recurrence expansion
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @throws {TypeError} if weekstart out of range
	 * @param {number} weekStart New start of week to set
	 */
	set weekStart(weekStart) {
		this._modifyContent()
		if (weekStart < DateTimeValue.SUNDAY || weekStart > DateTimeValue.SATURDAY) {
			throw new TypeError('Weekstart out of range')
		}

		this._innerValue.wkst = weekStart
	}

	/**
	 * Gets the until value if set
	 * The value is automatically locked.
	 * If you want to edit the value, clone it and it as new until
	 *
	 * @return {null|DateTimeValue}
	 */
	get until() {
		if (!this._until && this._innerValue.until) {
			this._until = DateTimeValue.fromICALJs(this._innerValue.until)
		}

		return this._until
	}

	/**
	 * Sets the until value, automatically removes count
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {DateTimeValue} until New until date to set
	 */
	set until(until) {
		this._modifyContent()

		if (this._until) {
			this._until.lock()
		}

		this._until = until
		this._innerValue.count = null
		this._innerValue.until = until.toICALJs()
	}

	/**
	 * Gets the count value if set
	 *
	 * @return {null | number}
	 */
	get count() {
		return this._innerValue.count
	}

	/**
	 * Sets the count value, automatically removes until
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {number} count New occurrence limit to set
	 */
	set count(count) {
		this._modifyContent()

		if (this._until) {
			this._until.lock()
			this._until = null
		}

		this._innerValue.until = null
		this._innerValue.count = parseInt(count, 10)
	}

	/**
	 * Gets the frequency of the recurrence rule
	 *
	 * @return {string} see
	 */
	get frequency() {
		return this._innerValue.freq
	}

	/**
	 * Sets the frequency of the recurrence rule
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @throws {TypeError} if frequency is unknown
	 * @param {string} freq New frequency to set
	 */
	set frequency(freq) {
		this._modifyContent()
		if (!ALLOWED_FREQ.includes(freq)) {
			throw new TypeError('Unknown frequency')
		}

		this._innerValue.freq = freq
	}

	/**
	 * Modifies this recurrence-value to unset count and until
	 */
	setToInfinite() {
		this._modifyContent()

		if (this._until) {
			this._until.lock()
			this._until = null
		}

		this._innerValue.until = null
		this._innerValue.count = null
	}

	/**
	 * Checks whether the stored rule is finite
	 *
	 * @return {boolean}
	 */
	isFinite() {
		return this._innerValue.isFinite()
	}

	/**
	 * Checks whether the recurrence rule is limited by count
	 *
	 * @return {boolean}
	 */
	isByCount() {
		return this._innerValue.isByCount()
	}

	/**
	 * Adds a part to a component to the recurrence-rule
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {string} componentName The name of the recurrence-component to add
	 * @param {string | number} value The value to add
	 */
	addComponent(componentName, value) {
		this._modifyContent()
		this._innerValue.addComponent(componentName, value)
	}

	/**
	 * Sets / overwrites a component to the recurrence-rule
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {string} componentName The name of the component to set
	 * @param {number[] | string[]} value The value to set
	 */
	setComponent(componentName, value) {
		this._modifyContent()

		if (value.length === 0) {
			delete this._innerValue.parts[componentName.toUpperCase()]
		} else {
			this._innerValue.setComponent(componentName, value)
		}
	}

	/**
	 * Removes all parts of a component
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {string} componentName The name of the component to remove
	 */
	removeComponent(componentName) {
		delete this._innerValue.parts[uc(componentName)]
	}

	/**
	 * Gets all parts of a component
	 *
	 * @param {string} componentName The name of the component to get
	 * @return {Array<number|string>}
	 */
	getComponent(componentName) {
		return this._innerValue.getComponent(componentName)
	}

	/**
	 * Checks if this recurrence rule is valid according to RFC 5545
	 *
	 * @return {boolean}
	 */
	isRuleValid() {
		return true
	}

	/**
	 * @inheritDoc
	 */
	lock() {
		super.lock()

		if (this._until) {
			this._until.lock()
		}
	}

	/**
	 * @inheritDoc
	 */
	unlock() {
		super.unlock()

		if (this._until) {
			this._until.unlock()
		}
	}

	/**
	 * clones this value
	 *
	 * @return {RecurValue}
	 */
	clone() {
		return RecurValue.fromICALJs(this._innerValue.clone())
	}

	/**
	 * Create a new RecurValue object from a ICAL.Recur object
	 *
	 * @param {ICAL.Recur} icalValue The ICAL.JS Recur value
	 * @param {DateTimeValue?} until The Until date
	 * @return {RecurValue}
	 */
	static fromICALJs(icalValue, until = null) {
		return new RecurValue(icalValue, until)
	}

	/**
	 * Create a new RecurValue object from a data object
	 *
	 * @param {object} data The destructuring object
	 * @param {string=} data.freq FREQ part of RRULE
	 * @param {number=} data.interval INTERVAL part of RRULE
	 * @param {number=} data.wkst WEEKSTART part of RRULE
	 * @param {DateTimeValue=} data.until UNTIL part of RRULE
	 * @param {number=} data.count COUNT part of RRULE
	 * @param {number[]=} data.bysecond BYSECOND part of RRULE
	 * @param {number[]=} data.byminute BYMINUTE part of RRULE
	 * @param {number[]=} data.byhour BYHOUR part of RRULE
	 * @param {string[]=} data.byday BYDAY part of RRULE
	 * @param {number[]=} data.bymonthday BYMONTHDAY part of RRULE
	 * @param {number[]=} data.byyearday BYYEARDAY part of RRULE
	 * @param {number[]=} data.byweekno BYWEEKNO part of RRULE
	 * @param {number[]=} data.bymonth BYMONTH part of RRULE
	 * @param {number[]=} data.bysetpos BYSETPOS part of RRULE
	 * @return {RecurValue}
	 */
	static fromData(data) {
		let until = null

		if (data.until) {
			until = data.until
			data.until = data.until.toICALJs()
		}

		const icalRecur = ICAL.Recur.fromData(data)
		return RecurValue.fromICALJs(icalRecur, until)
	}
}
