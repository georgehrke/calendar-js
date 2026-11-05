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
import { createProperty } from '../factories/icalFactory.js'
import { lc } from '../helpers/stringHelper.js'

/**
 * @import Parameter from '../parameters/parameter.js'
 * @import AbstractComponent from '../components/abstractComponent.js'
 * @import CalendarComponent from '../components/calendarComponent.js'
 */

/**
 * @class GeoProperty
 * @classdesc
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.6
 */
export default class GeoProperty extends Property {
	/**
	 * @inheritDoc
	 * @param {string} name The name of the property
	 * @param {number[]} value The value
	 * @param {Array<Parameter | [string, string | string[] | null]>} parameters Array of parameters
	 * @param {CalendarComponent|null} root The root of the calendar-document
	 * @param {AbstractComponent|null} parent The parent-element of this property
	 */
	constructor(name, value = [0, 0], parameters = [], root = null, parent = null) {
		super(name, value, parameters, root, parent)
	}

	/**
	 * Gets the latitude stored in this property
	 *
	 * @return {number}
	 */
	get latitude() {
		return this._value[0]
	}

	/**
	 * Sets the latitude stored in this property
	 *
	 * @param {string | number} lat Latitude
	 */
	set latitude(lat) {
		this._modifyContent()
		if (typeof lat !== 'number') {
			lat = parseFloat(lat)
		}

		this._value[0] = lat
	}

	/**
	 * Gets the longitude stored in this property
	 */
	get longitude() {
		return this._value[1]
	}

	/**
	 * Sets the longitude stored in this property
	 *
	 * @param {string | number} long Longitude
	 */
	set longitude(long) {
		this._modifyContent()
		if (typeof long !== 'number') {
			long = parseFloat(long)
		}

		this._value[1] = long
	}

	/**
	 * @inheritDoc
	 */
	toICALJs() {
		// TODO: this is an ugly hack right now.
		// As soon as the value is an array, we assume it's multivalue,
		// but GEO is a structured value stored inside an array.
		// Calling icalProperty.setValues will throw an error.
		const icalProperty = createProperty(lc(this.name))
		icalProperty.setValue(this.value)

		this._parameters.forEach((parameter) => {
			icalProperty.setParameter(lc(parameter.name), parameter.value)
		})

		return icalProperty
	}

	/**
	 * Creates a new GeoProperty based on a latitude and a longitude value
	 *
	 * @param {number} lat Latitude
	 * @param {number} long Longitude
	 * @return {GeoProperty}
	 */
	static fromPosition(lat, long) {
		return new GeoProperty('GEO', [lat, long])
	}
}
