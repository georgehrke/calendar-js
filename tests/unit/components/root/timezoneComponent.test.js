/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @author Georg Ehrke <georg-nextcloud@ehrke.email>
 *
 * @license GNU AGPL version 3 or any later version
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
import TimezoneComponent from '../../../../src/components/root/timezoneComponent.js';
import AbstractComponent from '../../../../src/components/abstractComponent.js';
import ModificationNotAllowedError from '../../../../src/errors/modificationNotAllowedError.js';
import Timezone from '../../../../src/timezones/timezone.js';

it('TimezoneComponent should be defined', () => {
	expect(TimezoneComponent).toBeDefined()
})

it('TimezoneComponent should inherit from AbstractComponent', () => {
	const component = new TimezoneComponent('VTIMEZONE')
	expect(component instanceof AbstractComponent).toEqual(true)
})

it('TimezoneComponent should expose easy getter/setter for timezoneId', () => {
	const component = new TimezoneComponent('VTIMEZONE', [['TZID', 'Europe/Berlin']])

	expect(component.timezoneId).toEqual('Europe/Berlin')

	component.timezoneId = 'America/New_York'
	expect(component.timezoneId).toEqual('America/New_York')

	component.lock()
	expect(component.isLocked()).toEqual(true)

	expect(() => {
		component.timezoneId = 'America/Los_Angeles'
	}).toThrow(ModificationNotAllowedError);
	expect(component.timezoneId).toEqual('America/New_York')

	component.unlock()

	component.timezoneId = 'America/Los_Angeles'
	expect(component.timezoneId).toEqual('America/Los_Angeles')
})

it('TimezoneComponent should ...', () => {
	const ics = getAsset('timezone-europe-berlin')
	const icalValue = new ICAL.Component(ICAL.parse(ics))

	const timezoneComponent = TimezoneComponent.fromICALJs(icalValue)
	expect(timezoneComponent instanceof TimezoneComponent).toEqual(true)
})
