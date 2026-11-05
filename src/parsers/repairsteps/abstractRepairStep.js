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
 * @class AbstractRepairStep
 * @classdesc A repair step is used to fix calendar-data before it is parsed
 */
export default class AbstractRepairStep {
	/**
	 * @class
	 */
	constructor() {
		if (new.target === AbstractRepairStep) {
			throw new TypeError('Cannot instantiate abstract class AbstractRepairStep')
		}
	}

	/**
	 * @param {string} input String representation of the data to repair
	 * @return {string} The repaired data
	 * @abstract
	 */
	repair(input) {
		void input
		throw new TypeError('Abstract method not implemented by subclass')
	}

	/**
	 * @return {number}
	 */
	static priority() {
		return 0
	}
}
