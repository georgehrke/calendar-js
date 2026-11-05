/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @author Georg Ehrke <georg-nextcloud@ehrke.email>
 *
 * @author Richard Steinmetz <richard@steinmetz.cloud>
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
import AttachmentProperty from './attachmentProperty.js'
import AttendeeProperty from './attendeeProperty.js'
import ConferenceProperty from './conferenceProperty.js'
import FreeBusyProperty from './freeBusyProperty.js'
import GeoProperty from './geoProperty.js'
import ImageProperty from './imageProperty.js'
import RelationProperty from './relationProperty.js'
import RequestStatusProperty from './requestStatusProperty.js'
import TextProperty from './textProperty.js'
import TriggerProperty from './triggerProperty.js'
import Property from './property.js'
import { uc } from '../helpers/stringHelper.js'

/**
 *
 * @param {string} propName Name of the prop to get constructor for
 * @return {typeof AttendeeProperty|typeof GeoProperty|typeof ConferenceProperty|typeof Property|typeof AttachmentProperty|typeof ImageProperty|typeof RelationProperty|typeof RequestStatusProperty}
 */
export function getConstructorForPropertyName(propName) {
	switch (uc(propName)) {
		case 'ATTACH':
			return AttachmentProperty

		case 'ATTENDEE':
		case 'ORGANIZER':
			return AttendeeProperty

		case 'CONFERENCE':
			return ConferenceProperty

		case 'FREEBUSY':
			return FreeBusyProperty

		case 'GEO':
			return GeoProperty

		case 'IMAGE':
			return ImageProperty

		case 'RELATED-TO':
			return RelationProperty

		case 'REQUEST-STATUS':
			return RequestStatusProperty

		case 'TRIGGER':
			return TriggerProperty

		case 'COMMENT':
		case 'CONTACT':
		case 'DESCRIPTION':
		case 'LOCATION':
		case 'SUMMARY':
			return TextProperty

		default:
			return Property
	}
}

export {
	AttachmentProperty,
	AttendeeProperty,
	ConferenceProperty,
	FreeBusyProperty,
	GeoProperty,
	ImageProperty,
	Property,
	RelationProperty,
	RequestStatusProperty,
	TextProperty,
	TriggerProperty,
}
