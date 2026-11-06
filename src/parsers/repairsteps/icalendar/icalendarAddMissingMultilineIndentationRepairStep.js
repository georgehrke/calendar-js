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

/**
 * @class ICalendarAddMissingMultilineIndentationRepairStep
 */
export default class ICalendarAddMissingMultilineIndentationRepairStep extends AbstractRepairStep {
	/**
	 * Please see the corresponding test file for an example of broken calendar-data
	 *
	 * @inheritDoc
	 */
	repair(ics) {
		return ics
			.replace(/^(?![ \t]|[0-9a-zA-Z-]+(?:;[^:]*)?:)(.+)$/gm, (_, unindentedLine) => ` ${unindentedLine}`)
	}
}
