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
import AbstractComponent from '../abstractComponent.js'
import EventComponent from './eventComponent.js'
import FreeBusyComponent from './freeBusyComponent.js'
import JournalComponent from './journalComponent.js'
import TimezoneComponent from './timezoneComponent.js'
import ToDoComponent from './toDoComponent.js'
import { uc } from '../../helpers/stringHelper.js'

/**
 * Gets the constructor for a component name
 * This will only return a constructor for components,
 * that can be used in the root of a calendar-document
 *
 * @param {string} compName Name of the component to get constructor for
 * @return {typeof AbstractComponent|typeof ToDoComponent|typeof JournalComponent|typeof FreeBusyComponent|typeof TimezoneComponent|typeof EventComponent}
 */
export function getConstructorForComponentName(compName) {
	switch (uc(compName)) {
		case 'VEVENT':
			return EventComponent

		case 'VFREEBUSY':
			return FreeBusyComponent

		case 'VJOURNAL':
			return JournalComponent

		case 'VTIMEZONE':
			return TimezoneComponent

		case 'VTODO':
			return ToDoComponent

		default:
			return AbstractComponent
	}
}
