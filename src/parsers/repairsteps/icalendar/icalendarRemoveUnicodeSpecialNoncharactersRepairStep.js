/**
 * @copyright Copyright (c) 2024 Sanskar Soni
 *
 * @author Sanskar Soni <sanskarsoni300@gmail.com>
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
 * @class ICalendarRemoveUnicodeSpecialNoncharactersRepairStep
 * @classdesc This repair step removes Unicode specials non-characters i.e. U+FFFE & U+FFFF
 */
export default class ICalendarRemoveUnicodeSpecialNoncharactersRepairStep extends AbstractRepairStep {
	/**
	 * Please see the corresponding test file for an example of broken calendar-data
	 *
	 * @inheritDoc
	 * @param {string} ics String representation of the data to repair
	 * @return {string} The repaired data
	 */
	repair(ics) {
		return ics
			.replace(/(\uFFFF|\uFFFE)/g, '')
	}
}
