/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import AbstractRepairStep from '../abstractRepairStep.js'

export default class ICalendarConvertInvalidDateTimeValuesRepairStep extends AbstractRepairStep {
	/**
	 * Please see the corresponding test files for an example of broken calendar-data
	 *
	 * @inheritDoc
	 * @param {string} ics String representation of the data to repair
	 * @return {string} The repaired data
	 */
	repair(ics) {
		return ics
			.replace(/^(CREATED|LAST-MODIFIED|DTSTAMP):([0-9]+)$/gm, '$1:$2T000000Z')
	}
}
