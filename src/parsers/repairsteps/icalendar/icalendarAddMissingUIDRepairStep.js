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
import AbstractRepairStep from '../abstractRepairStep.js'
import { randomUUID } from '../../../helpers/cryptoHelper.js'

/**
 * @class ICalendarAddMissingUIDRepairStep
 */
export default class ICalendarAddMissingUIDRepairStep extends AbstractRepairStep {
	/**
	 * Please see the corresponding test file for an example of broken calendar-data
	 *
	 * @inheritDoc
	 * @param {string} ics String representation of the data to repair
	 * @return {string} The repaired data
	 */
	repair(ics) {
		return ics
			.replace(/^BEGIN:(VEVENT|VTODO|VJOURNAL)$(((?!^END:(VEVENT|VTODO|VJOURNAL)$)(?!^UID.*$)(.|\n))*)^END:(VEVENT|VTODO|VJOURNAL)$\n/gm, (match, vobjectName, vObjectBlock) => {
				return 'BEGIN:' + vobjectName + '\r\n'
					+ 'UID:' + randomUUID()
					+ vObjectBlock
					+ 'END:' + vobjectName + '\r\n'
			})
	}
}
