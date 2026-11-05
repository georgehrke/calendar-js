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
 * @import EventComponent from '../components/root/eventComponent.js'
 */

/**
 * Gets kind of birthday event
 * returns "BDAY", "DEATHDATE", "ANNIVERSARY"
 * or null if this is not a birthday event
 *
 * @param {EventComponent} eventComponent The eventComponent of the birthday event
 * @return {null|string}
 */
export function getTypeOfBirthdayEvent(eventComponent) {
	return eventComponent.getFirstPropertyFirstValue('X-NEXTCLOUD-BC-FIELD-TYPE')
}

/**
 * Gets icon for the birthday type
 *
 * @param {EventComponent} eventComponent The eventComponent of the birthday event
 * @return {string|null}
 */
export function getIconForBirthday(eventComponent) {
	const birthdayType = getTypeOfBirthdayEvent(eventComponent)
	switch (birthdayType) {
		case 'BDAY':
			return '🎂'

		case 'DEATHDATE':
			return '⚰️'

		case 'ANNIVERSARY':
			return '💍'

		default:
			return null
	}
}

/**
 * Returns the age of the birthday person or null of no birth-year given
 *
 * @param {EventComponent} eventComponent The eventComponent of the birthday event
 * @param {number} yearOfOccurrence The year to calculate the age for
 * @return {null|number}
 */
export function getAgeOfBirthday(eventComponent, yearOfOccurrence) {
	if (!eventComponent.hasProperty('X-NEXTCLOUD-BC-YEAR')) {
		return null
	}

	const yearOfBirth = eventComponent.getFirstPropertyFirstValue('X-NEXTCLOUD-BC-YEAR')
	return parseInt(yearOfOccurrence, 10) - parseInt(yearOfBirth, 10)
}

/**
 * Returns the name of the birthday person or null if not set
 *
 * @param {EventComponent} eventComponent The eventComponent of the birthday event
 * @return {null|string}
 */
export function getNameForBirthday(eventComponent) {
	return eventComponent.getFirstPropertyFirstValue('X-NEXTCLOUD-BC-NAME')
}
