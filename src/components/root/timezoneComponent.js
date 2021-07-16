/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @author Georg Ehrke <georg-nextcloud@ehrke.email>
 *
 * @license GNU AGPL version 3 or any later version
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
 *
 */
import AbstractComponent, {
	advertiseSingleOccurrenceProperty,
} from '../abstractComponent.js'

/**
 * @class TimezoneComponent
 * @classdesc
 *
 * There are no advertised properties / components for the TimezoneComponent,
 * since we don't care about it.
 * Editing / accessing the timezone information directly is not a use-case
 * All the timezone-handling is done by the underlying ICAL.JS
 *
 * @url https://tools.ietf.org/html/rfc5545#section-3.6.5
 */
export default class TimezoneComponent extends AbstractComponent {
}

/**
 * The timezoneId of this timezone-component
 *
 * @name TimezoneComponent#timezoneId
 * @type {String}
 */
advertiseSingleOccurrenceProperty(TimezoneComponent.prototype, {
	name: 'timezoneId',
	iCalendarName: 'tzid',
})
