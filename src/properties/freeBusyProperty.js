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

/**
 * @import PeriodValue from '../values/periodValue.js'
 */

/**
 * @class FreeBusyProperty
 * @classdesc
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.2.6
 */
export default class FreeBusyProperty extends Property {
	/**
	 * Gets the type of this FreeBusyProperty
	 *
	 * @return {string}
	 */
	get type() {
		const allowed = ['FREE', 'BUSY', 'BUSY-UNAVAILABLE', 'BUSY-TENTATIVE']
		const defaultValue = 'BUSY'

		if (this.hasParameter('FBTYPE')) {
			const value = this.getParameterFirstValue('FBTYPE')
			if (allowed.includes(value)) {
				return value
			}
		}

		return defaultValue
	}

	/**
	 * Sets the type of this FreeBusyProperty
	 *
	 * @param {string} type The type of information (e.g. FREE, BUSY, etc.)
	 */
	set type(type) {
		this.updateParameterIfExist('FBTYPE', type)
	}

	/**
	 * Creates a new FreeBusyProperty based on period and type
	 *
	 * @param {PeriodValue} period The period for FreeBusy Information
	 * @param {string} type The type of the period
	 * @return {FreeBusyProperty}
	 */
	static fromPeriodAndType(period, type) {
		return new FreeBusyProperty('FREEBUSY', period, [['fbtype', type]])
	}
}
