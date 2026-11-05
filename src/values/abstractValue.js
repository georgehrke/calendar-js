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
import lockableTrait from '../traits/lockable.js'
import observerTrait from '../traits/observer.js'

/**
 * @import ICAL from 'ical.js'
 */

/**
 * @class AbstractValue
 * @classdesc BaseClass for all values
 */
export default class AbstractValue extends observerTrait(lockableTrait(class {})) {
	/**
	 * Constructor
	 *
	 * @param {ICAL.Binary|ICAL.Duration|ICAL.Period|ICAL.Recur|ICAL.Time|ICAL.UtcOffset} icalValue The ICAL.JS object to wrap
	 */
	constructor(icalValue) {
		if (new.target === AbstractValue) {
			throw new TypeError('Cannot instantiate abstract class AbstractValue')
		}
		super()

		/**
		 * Wrapped ICAL.js value
		 *
		 * @type {ICAL.Binary|ICAL.Duration|ICAL.Period|ICAL.Recur|ICAL.Time|ICAL.UtcOffset}
		 */
		this._innerValue = icalValue
	}

	/**
	 * Gets wrapped ICAL.JS object
	 *
	 * @return {ICAL.Binary|ICAL.Duration|ICAL.Period|ICAL.Recur|ICAL.Time|ICAL.UtcOffset}
	 */
	toICALJs() {
		return this._innerValue
	}

	/**
	 * @inheritDoc
	 * @protected
	 */
	_modifyContent() {
		super._modifyContent()
		this._notifySubscribers()
	}
}
