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
import { uc } from '../../../helpers/stringHelper.js'

/**
 * @class ICalendarMultipleVCalendarBlocksRepairStep
 * @classdesc This repair step merges multiple BEGIN:VCALENDAR...END:VCALENDAR blocks
 */
export default class ICalendarMultipleVCalendarBlocksRepairStep extends AbstractRepairStep {
	/**
	 * Please see the corresponding test file for an example of broken calendar-data
	 *
	 * @inheritDoc
	 * @param {string} ics String representation of the data to repair
	 * @return {string} The repaired data
	 */
	repair(ics) {
		let containsProdId = false
		let containsVersion = false
		let containsCalscale = false
		const includedTimezones = new Set()

		return ics
			.replace(/^END:VCALENDAR$(((?!^BEGIN:)(.|\n))*)^BEGIN:VCALENDAR$\n/gm, '')
			.replace(/^PRODID:(.*)$\n/gm, (match) => {
				if (containsProdId) {
					return ''
				}

				containsProdId = true
				return match
			})
			.replace(/^VERSION:(.*)$\n/gm, (match) => {
				if (containsVersion) {
					return ''
				}

				containsVersion = true
				return match
			})
			.replace(/^CALSCALE:(.*)$\n/gm, (match) => {
				if (containsCalscale) {
					return ''
				}

				containsCalscale = true
				return match
			})
			.replace(/^BEGIN:VTIMEZONE$(((?!^END:VTIMEZONE$)(.|\n))*)^END:VTIMEZONE$\n/gm, (match) => {
				const tzidMatcher = match.match(/^TZID:(.*)$/gm)

				// If this Timezone definition contains no TZID for some reason,
				// just remove it, because we can't use it anyway
				if (tzidMatcher === null) {
					return ''
				}

				const tzid = uc(tzidMatcher[0].slice(5))
				if (includedTimezones.has(tzid)) {
					// If we already included this timezone, just skip
					return ''
				}

				includedTimezones.add(tzid)
				return match
			})
	}
}
