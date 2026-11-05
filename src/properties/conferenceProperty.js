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
import ICAL from 'ical.js'

ICAL.design.icalendar.property.conference = {
	defaultType: 'uri',
}

ICAL.design.icalendar.param.feature = {
	valueType: 'cal-address',
	multiValue: ',',
}

/**
 * @class ConferenceProperty
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.11
 */
export default class ConferenceProperty extends Property {
	/**
	 * Iterator that iterates over all supported features
	 * of the conference system
	 *
	 * @yields {string} A supported conference feature
	 * @return {Generator<string, void, undefined>}
	 */
	* getFeatureIterator() {
		if (!this.hasParameter('FEATURE')) {
			return
		}

		const parameter = this.getParameter('FEATURE')
		yield* parameter.getValueIterator()
	}

	/**
	 * Lists all supported features of the conference system
	 *
	 * @return {string[]}
	 */
	listAllFeatures() {
		if (!this.hasParameter('FEATURE')) {
			return []
		}

		return this.getParameter('FEATURE').value.slice()
	}

	/**
	 * Adds a supported feature to the conference system
	 *
	 * @param {string} featureToAdd Feature to add
	 */
	addFeature(featureToAdd) {
		this._modify()
		if (!this.hasParameter('FEATURE')) {
			this.updateParameterIfExist('FEATURE', [featureToAdd])
		} else {
			if (this.hasFeature(featureToAdd)) {
				return
			}

			const parameter = this.getParameter('FEATURE')
			parameter.value.push(featureToAdd)
		}
	}

	/**
	 * Removes a supported feature
	 *
	 * @param {string} feature The feature to remove
	 */
	removeFeature(feature) {
		this._modify()
		if (!this.hasFeature(feature)) {
			return
		}

		const parameter = this.getParameter('FEATURE')
		const index = parameter.value.indexOf(feature)
		parameter.value.splice(index, 1)
	}

	/**
	 * Removes all supported features from this conference system
	 */
	clearAllFeatures() {
		this.deleteParameter('FEATURE')
	}

	/**
	 * Check if this conference system supports a feature
	 *
	 * @param {string} feature The feature to check
	 * @return {boolean}
	 */
	hasFeature(feature) {
		if (!this.hasParameter('FEATURE')) {
			return false
		}

		const parameter = this.getParameter('FEATURE')
		if (!Array.isArray(parameter.value)) {
			return false
		}

		return parameter.value.includes(feature)
	}

	/**
	 * Gets label for the conference system
	 *
	 * @return {string}
	 */
	get label() {
		return this.getParameterFirstValue('LABEL')
	}

	/**
	 * Updates the label for the conference system
	 *
	 * @param {string} label The label to set
	 */
	set label(label) {
		this.updateParameterIfExist('LABEL', label)
	}

	/**
	 * Gets the uri for this conference system
	 */
	get uri() {
		return this.value
	}

	/**
	 * Sets the uri for this conference system
	 *
	 * @param {string} uri The URI to set
	 */
	set uri(uri) {
		this.value = uri
	}

	/**
	 * @inheritDoc
	 */
	toICALJs() {
		const icalProperty = super.toICALJs()
		icalProperty.setParameter('value', 'URI')

		return icalProperty
	}

	/**
	 * Creates a new ConferenceProperty based on URI, label and features
	 *
	 * @param {string} uri URI of the Conference
	 * @param {string=} label Label of the conference
	 * @param {string[]=} features Features of the conference
	 * @return {ConferenceProperty}
	 */
	static fromURILabelAndFeatures(uri, label = null, features = null) {
		const property = new ConferenceProperty('CONFERENCE', uri)

		if (label) {
			property.updateParameterIfExist('label', label)
		}

		if (features) {
			property.updateParameterIfExist('feature', features)
		}

		return property
	}
}
