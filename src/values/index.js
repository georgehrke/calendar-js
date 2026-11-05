/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @author Georg Ehrke <georg-nextcloud@ehrke.email>
 *
 * @author Richard Steinmetz <richard@steinmetz.cloud>
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
import BinaryValue from './binaryValue.js'
import DurationValue from './durationValue.js'
import PeriodValue from './periodValue.js'
import RecurValue from './recurValue.js'
import DateTimeValue from './dateTimeValue.js'
import UTCOffsetValue from './utcOffsetValue.js'
import UnknownICALTypeError from '../errors/unknownICALTypeError.js'
import { lc } from '../helpers/stringHelper.js'

/**
 *
 * @param {string} icaltype The icaltype to get a Value constructor for
 * @return {typeof RecurValue|typeof PeriodValue|typeof BinaryValue|typeof DurationValue|typeof UTCOffsetValue|typeof DateTimeValue}
 */
export function getConstructorForICALType(icaltype) {
	switch (lc(icaltype)) {
		case 'binary':
			return BinaryValue

		case 'date':
		case 'date-time':
			return DateTimeValue

		case 'duration':
			return DurationValue

		case 'period':
			return PeriodValue

		case 'recur':
			return RecurValue

		case 'utc-offset':
			return UTCOffsetValue

		default:
			throw new UnknownICALTypeError()
	}
}

export {
	AbstractValue,
	BinaryValue,
	DateTimeValue,
	DurationValue,
	PeriodValue,
	RecurValue,
	UTCOffsetValue,
}
