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
import DurationValue from './durationValue.js'
import ICAL from 'ical.js'

/**
 * @class PeriodValue
 * @classdesc Wrapper for ICAL.Period
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.3.9
 * @see https://github.com/mozilla-comm/ical.js/blob/master/lib/ical/period.js
 */
export default class PeriodValue extends AbstractValue {
	/**
	 * @inheritDoc
	 * @param {ConstructorParameters<typeof AbstractValue>} args Arguments forwarded to the base class constructor
	 */
	constructor(...args) {
		super(...args)

		/**
		 * DateTimeValue object for start
		 *
		 * @type {DateTimeValue}
		 * @private
		 */
		this._start = DateTimeValue.fromICALJs(this._innerValue.start)

		/**
		 * DateTimeValue object for end
		 *
		 * @type {DateTimeValue|null}
		 * @private
		 */
		this._end = null

		/**
		 * DurationValue object for duration
		 *
		 * @type {DurationValue|null}
		 * @private
		 */
		this._duration = null
	}

	/**
	 * Gets the start of the period-value
	 *
	 * @return {DateTimeValue}
	 */
	get start() {
		return this._start
	}

	/**
	 * Sets the start of the period-value
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {DateTimeValue} start The start of the period
	 */
	set start(start) {
		this._modifyContent()
		this._start = start
		this._innerValue.start = start.toICALJs()
	}

	/**
	 * Gets the end of the period-value
	 *
	 * @return {DateTimeValue}
	 */
	get end() {
		if (!this._end) {
			if (this._duration) {
				this._duration.lock()
				this._duration = null
			}

			this._innerValue.end = this._innerValue.getEnd()
			this._end = DateTimeValue.fromICALJs(this._innerValue.end)
			this._innerValue.duration = null

			if (this.isLocked()) {
				this._end.lock()
			}
		}

		return this._end
	}

	/**
	 * Sets the end of the period-value
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {DateTimeValue} end The end of the period
	 */
	set end(end) {
		this._modifyContent()
		this._innerValue.duration = null
		this._innerValue.end = end.toICALJs()
		this._end = end
	}

	/**
	 * Gets the duration of the period-value
	 * The value is automatically locked.
	 * If you want to edit the value, clone it and it as new duration
	 *
	 * @return {DurationValue}
	 */
	get duration() {
		if (!this._duration) {
			if (this._end) {
				this._end.lock()
				this._end = null
			}

			this._innerValue.duration = this._innerValue.getDuration()
			this._duration = DurationValue.fromICALJs(this._innerValue.duration)
			this._innerValue.end = null

			if (this.isLocked()) {
				this._duration.lock()
			}
		}

		return this._duration
	}

	/**
	 * Sets the duration of the period-value
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {DurationValue} duration The duration to set
	 */
	set duration(duration) {
		this._modifyContent()
		this._innerValue.end = null
		this._innerValue.duration = duration.toICALJs()
		this._duration = duration
	}

	/**
	 * @inheritDoc
	 */
	lock() {
		super.lock()
		this.start.lock()

		if (this._end) {
			this._end.lock()
		}
		if (this._duration) {
			this._duration.lock()
		}
	}

	/**
	 * @inheritDoc
	 */
	unlock() {
		super.unlock()
		this.start.unlock()

		if (this._end) {
			this._end.unlock()
		}
		if (this._duration) {
			this._duration.unlock()
		}
	}

	/**
	 * clones this value
	 *
	 * @return {PeriodValue}
	 */
	clone() {
		return PeriodValue.fromICALJs(this._innerValue.clone())
	}

	/**
	 * Create a new PeriodValue object from a ICAL.Period object
	 *
	 * @param {ICAL.Period} icalValue The ical.js period value to initialise from
	 * @return {PeriodValue}
	 */
	static fromICALJs(icalValue) {
		return new PeriodValue(icalValue)
	}

	/**
	 * Create a new PeriodValue object from start and end
	 *
	 * @param {object} data The destructuring object
	 * @param {DateTimeValue} data.start The start of the period
	 * @param {DateTimeValue} data.end The end of the period
	 * @return {PeriodValue}
	 */
	static fromDataWithEnd(data) {
		const icalPeriod = ICAL.Period.fromData({
			start: data.start.toICALJs(),
			end: data.end.toICALJs(),
		})
		return PeriodValue.fromICALJs(icalPeriod)
	}

	/**
	 * Create a new PeriodValue object from start and duration
	 *
	 * @param {object} data The destructuring object
	 * @param {DateTimeValue} data.start The start of the period
	 * @param {DurationValue} data.duration The duration of the period
	 * @return {PeriodValue}
	 */
	static fromDataWithDuration(data) {
		const icalPeriod = ICAL.Period.fromData({
			start: data.start.toICALJs(),
			duration: data.duration.toICALJs(),
		})
		return PeriodValue.fromICALJs(icalPeriod)
	}
}
