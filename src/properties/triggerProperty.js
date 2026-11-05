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
import Property from './property.js'
import DurationValue from '../values/durationValue.js'
import DateTimeValue from '../values/dateTimeValue.js'

/**
 * @import AbstractValue from '../values/abstractValue.js'
 */

/**
 * @class TriggerProperty
 * @classdesc
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.6.3
 */
export default class TriggerProperty extends Property {
	/**
	 * Gets the related parameter
	 *
	 * @return {string}
	 */
	get related() {
		if (!this.hasParameter('RELATED')) {
			return 'START'
		}

		return this.getParameterFirstValue('RELATED')
	}

	/**
	 * Sets the related parameter
	 *
	 * @param {string} related Either START or END
	 */
	set related(related) {
		this.updateParameterIfExist('RELATED', related)
	}

	/**
	 * Gets the value of this trigger
	 * (If you override the setter, you also have to override the getter or
	 *  it will simply be undefined)
	 *
	 * @return {string | number | AbstractValue | string[] | number[] | AbstractValue[]}
	 */
	get value() {
		return super.value
	}

	/**
	 * Set the value of this trigger
	 *
	 * @param {DurationValue|DateTimeValue} value The time of trigger
	 */
	set value(value) {
		super.value = value

		// If it's not a duration, remove related parameter
		if (value instanceof DateTimeValue) {
			this.deleteParameter('RELATED')
			super.value = value.getInUTC()
		}
	}

	/**
	 * Gets whether this alarm trigger is relative
	 *
	 * @return {boolean}
	 */
	isRelative() {
		return this.getFirstValue() instanceof DurationValue
	}

	/**
	 * Creates a new absolute trigger
	 *
	 * @param {DateTimeValue} alarmTime Time to create Trigger from
	 * @return {TriggerProperty}
	 */
	static fromAbsolute(alarmTime) {
		return new TriggerProperty('TRIGGER', alarmTime)
	}

	/**
	 * Creates a new relative trigger
	 *
	 * @param {DurationValue} alarmOffset Duration to create Trigger from
	 * @param {boolean=} relatedToStart Related to Start or end?
	 * @return {TriggerProperty}
	 */
	static fromRelativeAndRelated(alarmOffset, relatedToStart = true) {
		return new TriggerProperty('TRIGGER', alarmOffset, [['RELATED', relatedToStart ? 'START' : 'END']])
	}
}
