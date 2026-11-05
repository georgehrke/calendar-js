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
import AlarmComponent from './alarmComponent.js'
import { uc } from '../../helpers/stringHelper.js'

/**
 * Gets the constructor for a component name
 * This will only return a constructor for components,
 * that can be nested inside other ones
 *
 * @param {string} compName - Component name to get default constructor for
 * @return {typeof AlarmComponent|typeof AbstractComponent}
 */
export function getConstructorForComponentName(compName) {
	switch (uc(compName)) {
		case 'VALARM':
			return AlarmComponent

		default:
			return AbstractComponent
	}
}
