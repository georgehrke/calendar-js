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
import ICalendarParser from './icalendarParser.js'

/**
 * @import AbstractParser from './abstractParser.js'
 */

/**
 * A parser class that can be instantiated and reports its supported MIME types.
 *
 * @typedef {{new (options?: object): AbstractParser, getMimeTypes(): string[]}} ParserConstructor
 */

/**
 * @class ParserManager
 * @classdesc
 */
export default class ParserManager {
	/**
	 * Constructor
	 */
	constructor() {
		/**
		 * List of supported parsers
		 *
		 * @type {ParserConstructor[]}
		 */
		this._parsers = []
	}

	/**
	 * Get a list of all supported file-types
	 *
	 * @return {string[]}
	 */
	getAllSupportedFileTypes() {
		return this._parsers.reduce(
			(allFileTypes, parser) => allFileTypes.concat(parser.getMimeTypes()),
			[],
		)
	}

	/**
	 * Get an instance of a parser for one specific file-type
	 *
	 * @param {string} fileType The mime-type to get a parser for
	 * @param {object=} options Options destructuring object
	 * @param {boolean=} options.extractGlobalProperties Whether or not to preserve properties from the VCALENDAR component (defaults to false)
	 * @param {boolean=} options.removeRSVPForAttendees Whether or not to remove RSVP from attendees (defaults to false)
	 * @param {boolean=} options.includeTimezones Whether or not to include timezones (defaults to false)
	 * @param {boolean=} options.preserveMethod Whether or not to preserve the iCalendar method (defaults to false)
	 * @param {boolean=} options.processFreeBusy Whether or not to process VFreeBusy components (defaults to false)
	 *
	 * @return {AbstractParser}
	 */
	getParserForFileType(fileType, options) {
		const Parser = this._parsers.find((parser) => parser.getMimeTypes().includes(fileType))

		if (!Parser) {
			throw new TypeError('Unknown file-type.')
		}

		return new Parser(options)
	}

	/**
	 * Registers a parser
	 *
	 * @param {ParserConstructor} parser The parser to register
	 */
	registerParser(parser) {
		this._parsers.push(parser)
	}
}

/**
 * Gets an instance of the ParserManager with all default parsers
 *
 * @return {ParserManager}
 */
export function getParserManager() {
	const parserManager = new ParserManager()

	// We only support iCalendar for now.
	// JSON calendar and CSV will be supported soon,
	// but require some more work

	parserManager.registerParser(ICalendarParser)
	// parserManager.registerParser(JCalendarParser)
	// parserManager.registerParser(CSVParser)

	return parserManager
}
