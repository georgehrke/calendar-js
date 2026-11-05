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
import AbstractRecurringComponent from './abstractRecurringComponent.js'
import { advertiseMultipleOccurrenceProperty } from '../abstractComponent.js'
import TextProperty from '../../properties/textProperty.js'

/**
 * @import { Mixin } from '../../traits/mixin.js'
 */

/**
 * Members installed on the prototype by the advertise helpers at the end of this file
 *
 * @typedef {object} JournalComponentMembers
 * @property {() => Generator<TextProperty, void, undefined>} getDescriptionIterator Returns an iterator over all descriptions
 * @property {() => TextProperty[]} getDescriptionList Returns a list of all descriptions
 * @property {(item: TextProperty) => void} removeDescription Removes one of the descriptions
 * @property {() => void} clearAllDescriptions Removes all descriptions
 */

/**
 * @class JournalComponent
 * @classdesc
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.3
 */
export default class JournalComponent extends /** @type {typeof AbstractRecurringComponent & Mixin<JournalComponentMembers>} */ (AbstractRecurringComponent) {
	/**
	 * Adds a new description property
	 *
	 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.5
	 *
	 * @param {string} description The description text
	 */
	addDescription(description) {
		this.addProperty(new TextProperty('DESCRIPTION', description))
	}
}

/**
 * Gets an iterator over all description properties
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.5
 *
 * @name JournalComponent#getDescriptionIterator
 * @function
 * @return {IterableIterator<TextProperty>}
 */

/**
 * Gets a list of all description properties
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.5
 *
 * @name JournalComponent#getDescriptionList
 * @function
 * @return {TextProperty[]}
 */

/**
 * Removes a description from this event
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.5
 *
 * @name JournalComponent#removeDescription
 * @function
 * @param {TextProperty} description
 */

/**
 * Removes all descriptions from this event
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.5
 *
 * @name JournalComponent#clearAllDescriptions
 * @function
 */
advertiseMultipleOccurrenceProperty(JournalComponent.prototype, 'description')
