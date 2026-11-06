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
 *
 */
import { getRepairSteps } from '../../../../../src/parsers/repairsteps/icalendar';
import ICalendarAddMissingMultilineIndentationRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarAddMissingMultilineIndentationRepairStep.js';
import ICalendarAddMissingUIDRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarAddMissingUIDRepairStep.js';
import ICalendarAddMissingValueDateDoubleColonRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarAddMissingValueDateDoubleColonRepairStep.js';
import ICalendarAddMissingValueDateRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarAddMissingValueDateRepairStep.js';
import ICalendarEmptyTriggerRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarEmptyTriggerRepairStep.js';
import ICalendarIllegalCreatedRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarIllegalCreatedRepairStep.js';
import ICalendarMultipleVCalendarBlocksRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarMultipleVCalendarBlocksRepairStep.js';
import ICalendarRemoveXNCGroupIdRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarRemoveXNCGroupIdRepairStep.js';
import ICalendarRemoveUnicodeSpecialNoncharactersRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarRemoveUnicodeSpecialNoncharactersRepairStep.js';
import ICalendarConvertInvalidDateTimeValuesRepairStep
	from '../../../../../src/parsers/repairsteps/icalendar/icalendarConvertInvalidDateTimeValuesRepairStep.js';

it('should provide an iterator over all parsers', () => {
	const iterator = getRepairSteps()

	expect(iterator.next().value).toEqual(ICalendarAddMissingMultilineIndentationRepairStep)
	expect(iterator.next().value).toEqual(ICalendarAddMissingUIDRepairStep)
	expect(iterator.next().value).toEqual(ICalendarAddMissingValueDateDoubleColonRepairStep)
	expect(iterator.next().value).toEqual(ICalendarAddMissingValueDateRepairStep)
	expect(iterator.next().value).toEqual(ICalendarEmptyTriggerRepairStep)
	expect(iterator.next().value).toEqual(ICalendarIllegalCreatedRepairStep)
	expect(iterator.next().value).toEqual(ICalendarMultipleVCalendarBlocksRepairStep)
	expect(iterator.next().value).toEqual(ICalendarRemoveXNCGroupIdRepairStep)
	expect(iterator.next().value).toEqual(ICalendarRemoveUnicodeSpecialNoncharactersRepairStep)
	expect(iterator.next().value).toEqual(ICalendarConvertInvalidDateTimeValuesRepairStep)
	expect(iterator.next().value).toEqual(undefined)
})
