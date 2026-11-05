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
import ModificationNotAllowedError from '../errors/modificationNotAllowedError.js'

/**
 * @import { Mixin } from './mixin.js'
 */

/**
 * Public members of the lockable trait
 *
 * @typedef {object} Lockable
 * @property {() => boolean} isLocked Returns whether or not this object is locked
 * @property {() => void} lock Marks this object as immutable, locking it against further modification
 * @property {() => void} unlock Marks this object as mutable, allowing further modification
 */

/**
 *
 * @template {Mixin<object>} T
 * @param {T} baseClass Base class to extend
 * @return {T & Mixin<Lockable>} The base class extended by the public members of this trait
 */
export default function lockableTrait(baseClass) {
	/**
	 * @class LockableTrait
	 */
	return class extends baseClass {
		/**
		 * Constructor
		 *
		 * @param {...unknown} args Arguments forwarded to the base class constructor
		 */
		constructor(...args) {
			super(...args)

			/**
			 * Indicator whether this value was locked for changes
			 *
			 * @type {boolean}
			 * @private
			 */
			this._mutable = true
		}

		/**
		 * Returns whether or not this object is locked
		 *
		 * @return {boolean}
		 */
		isLocked() {
			return !this._mutable
		}

		/**
		 * Marks this object is immutable
		 * locks it against further modification
		 */
		lock() {
			this._mutable = false
		}

		/**
		 * Marks this object as mutable
		 * allowing further modification
		 */
		unlock() {
			this._mutable = true
		}

		/**
		 * Check if modifications are allowed
		 *
		 * @throws {ModificationNotAllowedError} if this object is locked for modification
		 * @protected
		 */
		_modify() {
			if (!this._mutable) {
				throw new ModificationNotAllowedError()
			}
		}

		/**
		 * Check if modification of content is allowed
		 *
		 * @throws {ModificationNotAllowedError} if this object is locked for modification
		 * @protected
		 */
		_modifyContent() {
			this._modify()
		}
	}
}
