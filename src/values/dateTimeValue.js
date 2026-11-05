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
import DurationValue from './durationValue.js'
import ICAL from 'ical.js'

/**
 * @import { Timezone } from '@nextcloud/timezones'
 */

/**
 * @class DateTimeValue
 * @classdesc Wrapper for ICAL.Time
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.3.4
 * @see https://tools.ietf.org/html/rfc5545#section-3.3.5
 * @see https://tools.ietf.org/html/rfc5545#section-3.3.12
 * @see https://github.com/mozilla-comm/ical.js/blob/master/lib/ical/time.js
 */
export default class DateTimeValue extends AbstractValue {
	/**
	 * Gets the year of the stored date-time-value
	 *
	 * @return {number}
	 */
	get year() {
		return this._innerValue.year
	}

	/**
	 * Sets the year of the stored date-time-value
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {number} year Number of years to set
	 */
	set year(year) {
		this._modifyContent()
		this._innerValue.year = year
	}

	/**
	 * Gets the month of the stored date-time-value
	 *
	 * @return {number}
	 */
	get month() {
		return this._innerValue.month
	}

	/**
	 * Sets the month of the stored date-time-value
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {number} month Number of months to set
	 */
	set month(month) {
		this._modifyContent()
		if (month < 1 || month > 12) {
			throw new TypeError('Month out of range')
		}

		this._innerValue.month = month
	}

	/**
	 * Gets the day of the stored date-time-value
	 *
	 * @return {number}
	 */
	get day() {
		return this._innerValue.day
	}

	/**
	 * Sets the day of the stored date-time-value
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @throws {TypeError} if out of range
	 * @param {number} day Number of days to set
	 */
	set day(day) {
		this._modifyContent()
		if (day < 1 || day > 31) {
			throw new TypeError('Day out of range')
		}

		this._innerValue.day = day
	}

	/**
	 * Gets the hour of the stored date-time-value
	 *
	 * @return {number}
	 */
	get hour() {
		return this._innerValue.hour
	}

	/**
	 * Sets the hour of the stored date-time-value
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @throws {TypeError} if out of range
	 * @param {number} hour Number of hours to set
	 */
	set hour(hour) {
		this._modifyContent()
		if (hour < 0 || hour > 23) {
			throw new TypeError('Hour out of range')
		}

		this._innerValue.hour = hour
	}

	/**
	 * Gets the minute of the stored date-time-value
	 *
	 * @return {number}
	 */
	get minute() {
		return this._innerValue.minute
	}

	/**
	 * Sets the minute of the stored date-time-value
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @throws {TypeError} if out of range
	 * @param {number} minute Number of minutes to set
	 */
	set minute(minute) {
		this._modifyContent()
		if (minute < 0 || minute > 59) {
			throw new TypeError('Minute out of range')
		}

		this._innerValue.minute = minute
	}

	/**
	 * Gets the second of the stored date-time-value
	 *
	 * @return {number}
	 */
	get second() {
		return this._innerValue.second
	}

	/**
	 * Sets the second of the stored date-time-value
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @throws {TypeError} if out of range
	 * @param {number} second Number of seconds to set
	 */
	set second(second) {
		this._modifyContent()
		if (second < 0 || second > 59) {
			throw new TypeError('Second out of range')
		}

		this._innerValue.second = second
	}

	/**
	 * Gets the timezone of this date-time-value
	 *
	 * @return {string | null}
	 */
	get timezoneId() {
		// If zone.tzid is set and it's not 'floating' nor 'UTC', then it's a proper
		// timezone that we also have a timezone id for
		if (this._innerValue.zone.tzid && this._innerValue.zone.tzid !== 'floating' && this._innerValue.zone.tzid === 'UTC') {
			return this._innerValue.zone.tzid
		}

		// If there is a timezone set, but we didn't have a zone.tzid in the previous if,
		// this means that the tzid does not have a definition stored along it.
		// we will keep this information anyway to not lose it
		if (this._innerValue.timezone) {
			return this._innerValue.timezone
		}

		// this is the case when it's floating / UTC
		return this._innerValue.zone.tzid || null
	}

	/**
	 * Gets whether this date-time-value is a date or date-time
	 *
	 * @return {boolean}
	 */
	get isDate() {
		return this._innerValue.isDate
	}

	/**
	 * Sets whether this date-time-value is a date or date-time
	 *
	 * @throws {ModificationNotAllowedError} if value is locked for modification
	 * @param {boolean} isDate Whether this is a date or date-time value
	 */
	set isDate(isDate) {
		this._modifyContent()
		this._innerValue.isDate = !!isDate

		if (isDate) {
			this._innerValue.hour = 0
			this._innerValue.minute = 0
			this._innerValue.second = 0
		}
	}

	/**
	 * Gets the unix-time
	 *
	 * @return {number}
	 */
	get unixTime() {
		return this._innerValue.toUnixTime()
	}

	/**
	 * returns vanilla javascript date object
	 *
	 * @return {Date}
	 */
	get jsDate() {
		return this._innerValue.toJSDate()
	}

	/**
	 * Adds a duration to this date-time-value
	 *
	 * @param {DurationValue} duration The duration to ad
	 */
	addDuration(duration) {
		this._innerValue.addDuration(duration.toICALJs())
	}

	/**
	 * Subtract another date excluding timezones
	 *
	 * @param {DateTimeValue} other The date-time value to subtract
	 * @return {DurationValue}
	 */
	subtractDateWithoutTimezone(other) {
		const icalDuration = this._innerValue.subtractDate(other.toICALJs())
		return DurationValue.fromICALJs(icalDuration)
	}

	/**
	 * Subtract another date, taking timezones into account
	 *
	 * @param {DateTimeValue} other The date-time value to subtract
	 * @return {DurationValue}
	 */
	subtractDateWithTimezone(other) {
		const icalDuration = this._innerValue.subtractDateTz(other.toICALJs())
		return DurationValue.fromICALJs(icalDuration)
	}

	/**
	 * Compares this DateTimeValue object with another one
	 *
	 * @param {DateTimeValue} other The date-time to compare to
	 * @return {number} -1, 0 or 1 for less/equal/greater
	 */
	compare(other) {
		return this._innerValue.compare(other.toICALJs())
	}

	/**
	 * Compares only the date part in a given timezone
	 *
	 * @param {DateTimeValue} other The date-time to compare to
	 * @param {Timezone} timezone The timezone to compare in
	 * @return {number} -1, 0 or 1 for less/equal/greater
	 */
	compareDateOnlyInGivenTimezone(other, timezone) {
		return this._innerValue.compareDateOnlyTz(other.toICALJs(), timezone.toICALTimezone())
	}

	/**
	 * Returns a clone of this object which was converted to a different timezone
	 *
	 * @param {Timezone} timezone TimezoneId to convert to
	 * @return {DateTimeValue}
	 */
	getInTimezone(timezone) {
		const clonedICALTime = this._innerValue.convertToZone(timezone.toICALTimezone())
		return DateTimeValue.fromICALJs(clonedICALTime)
	}

	/**
	 * Get the inner ICAL.Timezone
	 *
	 * @return {ICAL.Timezone}
	 * @package
	 */
	getICALTimezone() {
		return this._innerValue.zone
	}

	/**
	 * Returns a clone of this object which was converted to a different timezone
	 *
	 * @param {ICAL.Timezone} timezone TimezoneId to convert to
	 * @return {DateTimeValue}
	 * @package
	 */
	getInICALTimezone(timezone) {
		const clonedICALTime = this._innerValue.convertToZone(timezone)
		return DateTimeValue.fromICALJs(clonedICALTime)
	}

	/**
	 * Returns a clone of this object which was converted to UTC
	 *
	 * @return {DateTimeValue}
	 */
	getInUTC() {
		const clonedICALTime = this._innerValue.convertToZone(ICAL.Timezone.utcTimezone)
		return DateTimeValue.fromICALJs(clonedICALTime)
	}

	/**
	 * This silently replaces the inner timezone without converting the actual time
	 *
	 * @param {ICAL.Timezone} timezone The timezone to replace with
	 * @package
	 */
	silentlyReplaceTimezone(timezone) {
		this._modify()
		this._innerValue = new ICAL.Time({
			year: this.year,
			month: this.month,
			day: this.day,
			hour: this.hour,
			minute: this.minute,
			second: this.second,
			isDate: this.isDate,
			timezone,
		})
	}

	/**
	 * Replaces the inner timezone without converting the actual time
	 *
	 * @param {Timezone} timezone The timezone to replace with
	 */
	replaceTimezone(timezone) {
		this._modifyContent()
		this._innerValue = ICAL.Time.fromData({
			year: this.year,
			month: this.month,
			day: this.day,
			hour: this.hour,
			minute: this.minute,
			second: this.second,
			isDate: this.isDate,
		}, timezone.toICALTimezone())
	}

	/**
	 * Calculates the UTC offset of the date-time-value in its timezone
	 *
	 * @return {number}
	 */
	utcOffset() {
		return this._innerValue.utcOffset()
	}

	/**
	 * Check if this is an event with floating time
	 *
	 * @return {boolean}
	 */
	isFloatingTime() {
		return this._innerValue.zone.tzid === 'floating'
	}

	/**
	 * clones this value
	 *
	 * @return {DateTimeValue}
	 */
	clone() {
		return DateTimeValue.fromICALJs(this._innerValue.clone())
	}

	/**
	 * Create a new DateTimeValue object from an ICAL.Time object
	 *
	 * @param {ICAL.Time} icalValue The ical.js Date value to initialise from
	 * @return {DateTimeValue}
	 */
	static fromICALJs(icalValue) {
		return new DateTimeValue(icalValue)
	}

	/**
	 * Creates a new DateTimeValue object based on a vanilla javascript object
	 *
	 * @param {Date} jsDate The JavaScript date to initialise from
	 * @param {boolean=} useUTC Whether or not to treat it as UTC
	 * @return {DateTimeValue}
	 */
	static fromJSDate(jsDate, useUTC = false) {
		const icalValue = ICAL.Time.fromJSDate(jsDate, useUTC)
		return DateTimeValue.fromICALJs(icalValue)
	}

	/**
	 * Creates a new DateTimeValue object based on simple parameters
	 *
	 * @param {object} data The destructuring object
	 * @param {number=} data.year Amount of years to set
	 * @param {number=} data.month Amount of month to set (1-based)
	 * @param {number=} data.day Amount of days to set
	 * @param {number=} data.hour Amount of hours to set
	 * @param {number=} data.minute Amount of minutes to set
	 * @param {number=} data.second Amount of seconds to set
	 * @param {boolean=} data.isDate Whether this is a date or date-time
	 * @param {Timezone=} timezone The timezone of the DateTimeValue
	 * @return {DateTimeValue}
	 */
	static fromData(data, timezone) {
		const icalValue = ICAL.Time.fromData(data, timezone
			? timezone.toICALTimezone()
			: undefined)
		return DateTimeValue.fromICALJs(icalValue)
	}
}

DateTimeValue.SUNDAY = ICAL.Time.SUNDAY
DateTimeValue.MONDAY = ICAL.Time.MONDAY
DateTimeValue.TUESDAY = ICAL.Time.TUESDAY
DateTimeValue.WEDNESDAY = ICAL.Time.WEDNESDAY
DateTimeValue.THURSDAY = ICAL.Time.THURSDAY
DateTimeValue.FRIDAY = ICAL.Time.FRIDAY
DateTimeValue.SATURDAY = ICAL.Time.SATURDAY

DateTimeValue.DEFAULT_WEEK_START = ICAL.Time.MONDAY
