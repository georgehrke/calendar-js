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
 * @import { Mixin } from './mixin.js'
 */

/**
 * Public members of the observer trait
 *
 * @typedef {object} Observable
 * @property {(handler: (...args: unknown[]) => void) => void} subscribe Adds a new subscriber
 * @property {(handler: (...args: unknown[]) => void) => void} unsubscribe Removes a subscriber
 */

/**
 *
 * @template {Mixin<object>} T
 * @param {T} baseClass Base class to extend
 * @return {T & Mixin<Observable>} The base class extended by the public members of this trait
 */
export default function observerTrait(baseClass) {
	/**
	 * @class ObserverTrait
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
			 * List of subscribers
			 *
			 * @type {Array<(...args: unknown[]) => void>}
			 * @private
			 */
			this._subscribers = []
		}

		/**
		 * Adds a new subscriber
		 *
		 * @param {(...args: unknown[]) => void} handler - Handler to be called when modification happens
		 */
		subscribe(handler) {
			this._subscribers.push(handler)
		}

		/**
		 * Removes a subscriber
		 *
		 * @param {(...args: unknown[]) => void} handler - Handler to be no longer called when modification happens
		 */
		unsubscribe(handler) {
			const index = this._subscribers.indexOf(handler)
			if (index === -1) {
				return
			}

			this._subscribers.splice(index, 1)
		}

		/**
		 * Notify all subscribed handlers
		 *
		 * @param {...unknown} args Arguments forwarded to subscribed handlers
		 * @protected
		 */
		_notifySubscribers(...args) {
			for (const handler of this._subscribers) {
				handler(...args)
			}
		}
	}
}
