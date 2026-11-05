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
 * @class RequestStatusProperty
 * @classdesc
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.8.3
 */
export default class RequestStatusProperty extends Property {
	/**
	 * @inheritDoc
	 * @param {string} name The name of the property
	 * @param {string[]} value The value
	 * @param {Array<Parameter | [string, string | string[] | null]>} parameters Array of parameters
	 * @param {CalendarComponent|null} root The root of the calendar-document
	 * @param {AbstractComponent|null} parent The parent-element of this property
	 */
	constructor(name, value = ['1', 'Pending'], parameters = [], root = null, parent = null) {
		super(name, value, parameters, root, parent)
	}

	/**
	 * Gets the status code of the request status
	 *
	 * @return {number}
	 */
	get statusCode() {
		return parseFloat(this.value[0])
	}

	/**
	 * Sets the status code of the request status
	 *
	 * @param {number} statusCode The statusCode of the request
	 */
	set statusCode(statusCode) {
		this._modifyContent()

		this.value[0] = statusCode.toString()

		// This makes sure 2.0 is actually saved as 2.0, not 2
		if (statusCode === Math.floor(statusCode)) {
			this.value[0] += '.0'
		}
	}

	/**
	 * Gets the status message of the request status
	 *
	 * @return {string}
	 */
	get statusMessage() {
		return this.value[1]
	}

	/**
	 * Sets the status message of the request status
	 *
	 * @param {string} statusMessage The message of the request
	 */
	set statusMessage(statusMessage) {
		this._modifyContent()
		this.value[1] = statusMessage
	}

	/**
	 * Gets the exception data of the request status if available
	 *
	 * @return {null | string}
	 */
	get exceptionData() {
		if (!this.value[2]) {
			return null
		}

		return this.value[2]
	}

	/**
	 * Sets the exception dtat of the request status
	 *
	 * @param {string} exceptionData The additional exception-data
	 */
	set exceptionData(exceptionData) {
		this._modifyContent()
		this.value[2] = exceptionData
	}

	/**
	 * Check if request is pending
	 *
	 * @return {boolean}
	 */
	isPending() {
		return this.statusCode >= 1 && this.statusCode < 2
	}

	/**
	 * Check if request was successful
	 *
	 * @return {boolean}
	 */
	isSuccessful() {
		return this.statusCode >= 2 && this.statusCode < 3
	}

	/**
	 * Check if a client error occurred
	 *
	 * @return {boolean}
	 */
	isClientError() {
		return this.statusCode >= 3 && this.statusCode < 4
	}

	/**
	 * Check if a scheduling error occurred
	 *
	 * @return {boolean}
	 */
	isSchedulingError() {
		return this.statusCode >= 4 && this.statusCode < 5
	}

	/**
	 * @inheritDoc
	 */
	toICALJs() {
		// TODO: this is an ugly hack right now.
		// As soon as the value is an array, we assume it's multivalue,
		// but REQUEST-STATUS is a structured value stored inside an array.
		// Calling icalProperty.setValues will throw an error.
		const icalProperty = createProperty(lc(this.name))
		icalProperty.setValue(this.value)

		this._parameters.forEach((parameter) => {
			icalProperty.setParameter(lc(parameter.name), parameter.value)
		})

		return icalProperty
	}

	/**
	 * Creates a new RequestStatusProperty from a code and a status message
	 *
	 * @param {number} code The status-code of the request
	 * @param {string} message The message of the request
	 * @return {RequestStatusProperty}
	 */
	static fromCodeAndMessage(code, message) {
		return new RequestStatusProperty('REQUEST-STATUS', [code.toString(), message])
	}
}

// All request statuses registered in RFC 5546
RequestStatusProperty.SUCCESS = [2.0, 'Success']
RequestStatusProperty.SUCCESS_FALLBACK = [2.1, 'Success, but fallback taken on one or more property values.']
RequestStatusProperty.SUCCESS_PROP_IGNORED = [2.2, 'Success; invalid property ignored.']
RequestStatusProperty.SUCCESS_PROPPARAM_IGNORED = [2.3, 'Success; invalid property parameter ignored.']
RequestStatusProperty.SUCCESS_NONSTANDARD_PROP_IGNORED = [2.4, 'Success; unknown, non-standard property ignored.']
RequestStatusProperty.SUCCESS_NONSTANDARD_PROPPARAM_IGNORED = [2.5, 'Success; unknown, non-standard property value ignored.']
RequestStatusProperty.SUCCESS_COMP_IGNORED = [2.6, 'Success; invalid calendar component ignored.']
RequestStatusProperty.SUCCESS_FORWARDED = [2.7, 'Success; request forwarded to Calendar User.']
RequestStatusProperty.SUCCESS_REPEATING_IGNORED = [2.8, 'Success; repeating event ignored. Scheduled as a single component.']
RequestStatusProperty.SUCCESS_TRUNCATED_END = [2.9, 'Success; truncated end date time to date boundary.']
RequestStatusProperty.SUCCESS_REPEATING_VTODO_IGNORED = [2.10, 'Success; repeating VTODO ignored.  Scheduled as a single VTODO.']
RequestStatusProperty.SUCCESS_UNBOUND_RRULE_CLIPPED = [2.11, 'Success; unbounded RRULE clipped at some finite number of instances.']

RequestStatusProperty.CLIENT_INVALID_PROPNAME = [3.0, 'Invalid property name.']
RequestStatusProperty.CLIENT_INVALID_PROPVALUE = [3.1, 'Invalid property value.']
RequestStatusProperty.CLIENT_INVALID_PROPPARAM = [3.2, 'Invalid property parameter.']
RequestStatusProperty.CLIENT_INVALID_PROPPARAMVALUE = [3.3, 'Invalid property parameter value.']
RequestStatusProperty.CLIENT_INVALUD_CALENDAR_COMP_SEQ = [3.4, 'Invalid calendar component sequence.']
RequestStatusProperty.CLIENT_INVALID_DATE_TIME = [3.5, 'Invalid date or time.']
RequestStatusProperty.CLIENT_INVALID_RRULE = [3.6, 'Invalid rule.']
RequestStatusProperty.CLIENT_INVALID_CU = [3.7, 'Invalid Calendar User.']
RequestStatusProperty.CLIENT_NO_AUTHORITY = [3.8, 'No authority.']
RequestStatusProperty.CLIENT_UNSUPPORTED_VERSION = [3.9, 'Unsupported version.']
RequestStatusProperty.CLIENT_TOO_LARGE = [3.10, 'Request entity too large.']
RequestStatusProperty.CLIENT_REQUIRED_COMP_OR_PROP_MISSING = [3.11, 'Required component or property missing.']
RequestStatusProperty.CLIENT_UNKNOWN_COMP_OR_PROP = [3.12, 'Unknown component or property found.']
RequestStatusProperty.CLIENT_UNSUPPORTED_COMP_OR_PROP = [3.13, 'Unsupported component or property found.']
RequestStatusProperty.CLIENT_UNSUPPORTED_CAPABILITY = [3.14, 'Unsupported capability.']

RequestStatusProperty.SCHEDULING_EVENT_CONFLICT = [4.0, 'Event conflict.  Date/time is busy.']

RequestStatusProperty.SERVER_REQUEST_NOT_SUPPORTED = [5.0, 'Request not supported.']
RequestStatusProperty.SERVER_SERVICE_UNAVAILABLE = [5.1, 'Service unavailable.']
RequestStatusProperty.SERVER_INVALID_CALENDAR_SERVICE = [5.2, 'Invalid calendar service.']
RequestStatusProperty.SERVER_NO_SCHEDULING_FOR_USER = [5.3, 'No scheduling support for user.']
