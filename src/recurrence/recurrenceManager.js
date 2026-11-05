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
import Property from '../properties/property.js'
import { uc } from '../helpers/stringHelper.js'
import DateTimeValue from '../values/dateTimeValue.js'
import ModificationNotAllowedError from '../errors/modificationNotAllowedError.js'
import RecurringWithoutDtStartError from '../errors/recurringWithoutDtStartError.js'
import PeriodValue from '../values/periodValue.js'
import ICAL from 'ical.js'

/**
 * @import AbstractRecurringComponent from '../components/root/abstractRecurringComponent.js'
 * @import DurationValue from '../values/durationValue.js'
 * @import RecurValue from '../values/recurValue.js'
 */

/**
 * @class RecurrenceHelper
 * @classdesc
 *
 * TODO: This needs caching
 */
export default class RecurrenceManager {
	/**
	 * Constructor
	 *
	 * @param {AbstractRecurringComponent} masterItem The master-item of the recurrence-set
	 */
	constructor(masterItem) {
		/**
		 *
		 * @type {AbstractRecurringComponent}
		 * @private
		 */
		this._masterItem = masterItem

		/**
		 * Set of Recurrence exception items
		 *
		 * Number is the unix time representation of the recurrence ID
		 *
		 * @type {Map<number, AbstractRecurringComponent>}
		 * @private
		 */
		this._recurrenceExceptionItems = new Map()

		/**
		 * A sorted index of recurrence ids with range
		 *
		 * @type {number[]}
		 * @private
		 */
		this._rangeRecurrenceExceptionItemsIndex = []

		/**
		 * Cached difference of dtstart and recurrenceId for recurrence exceptions with range
		 *
		 * @type {Map<number, DurationValue>}
		 * @private
		 */
		this._rangeRecurrenceExceptionItemsDiffCache = new Map()

		/**
		 * Set of Recurrence exception items that have a RANGE of THISANDFUTURE
		 *
		 * Number is the unix time representation of the recurrence ID
		 *
		 * @type {Map<number, AbstractRecurringComponent>}
		 * @private
		 */
		this._rangeRecurrenceExceptionItems = new Map()
	}

	/**
	 *
	 * @return {AbstractRecurringComponent}
	 */
	get masterItem() {
		return this._masterItem
	}

	/**
	 *
	 * @param {AbstractRecurringComponent} masterItem The master-item of the recurrence-set
	 */
	set masterItem(masterItem) {
		this._masterItem = masterItem
	}

	/**
	 * Gets an iterator over all registered recurrence exceptions of this calendar-document
	 *
	 * @yields {AbstractRecurringComponent} A recurrence exception
	 * @return {Generator<AbstractRecurringComponent, void, undefined>}
	 */
	* getRecurrenceExceptionIterator() {
		yield* this._recurrenceExceptionItems.values()
	}

	/**
	 * Gets a list of all registered recurrence-exceptions of this calendar-document
	 *
	 * @return {AbstractRecurringComponent[]}
	 */
	getRecurrenceExceptionList() {
		return Array.from(this.getRecurrenceExceptionIterator())
	}

	/**
	 * Checks if there is a recurrence Exception for a given recurrenceId
	 *
	 * @param {DateTimeValue | number} recurrenceId The recurrenceId to check
	 * @return {boolean}
	 */
	hasRecurrenceExceptionForId(recurrenceId) {
		if (recurrenceId instanceof DateTimeValue) {
			recurrenceId = recurrenceId.unixTime
		} else if (recurrenceId instanceof ICAL.Time) {
			recurrenceId = recurrenceId.toUnixTime()
		}

		return this._recurrenceExceptionItems.has(recurrenceId)
	}

	/**
	 * Gets the recurrence exception for a given recurrence Id
	 *
	 * @param {DateTimeValue | number} recurrenceId The recurrenceId to get
	 * @return {AbstractRecurringComponent|null}
	 */
	getRecurrenceException(recurrenceId) {
		if (recurrenceId instanceof DateTimeValue) {
			recurrenceId = recurrenceId.unixTime
		} else if (recurrenceId instanceof ICAL.Time) {
			recurrenceId = recurrenceId.toUnixTime()
		}

		return this._recurrenceExceptionItems.get(recurrenceId) || null
	}

	/**
	 * Check if there is a recurrence-exception with a range for a given recurrence-id
	 *
	 * @param {DateTimeValue | number} recurrenceId The recurrenceId to check
	 * @return {boolean}
	 */
	hasRangeRecurrenceExceptionForId(recurrenceId) {
		if (recurrenceId instanceof DateTimeValue) {
			recurrenceId = recurrenceId.unixTime
		} else if (recurrenceId instanceof ICAL.Time) {
			recurrenceId = recurrenceId.toUnixTime()
		}

		if (this._rangeRecurrenceExceptionItemsIndex.length === 0) {
			return false
		}

		return this._rangeRecurrenceExceptionItemsIndex[0] < recurrenceId
	}

	/**
	 * Get recurrence-exception with range that's affecting the given recurrence-id
	 *
	 * @param {DateTimeValue | number} recurrenceId The recurrenceId to get
	 * @return {AbstractRecurringComponent|null}
	 */
	getRangeRecurrenceExceptionForId(recurrenceId) {
		if (recurrenceId instanceof DateTimeValue) {
			recurrenceId = recurrenceId.unixTime
		} else if (recurrenceId instanceof ICAL.Time) {
			recurrenceId = recurrenceId.toUnixTime()
		}

		const index = ICAL.helpers.binsearchInsert(
			this._rangeRecurrenceExceptionItemsIndex,
			recurrenceId,
			(a, b) => a - b,
		)

		if (index === 0) {
			return null
		}

		const key = this._rangeRecurrenceExceptionItemsIndex[index - 1]
		return this._rangeRecurrenceExceptionItems.get(key)
	}

	/**
	 * Gets the difference between recurrence-id and start
	 * Mostly needed to handle recurrence-exceptions with range
	 *
	 * @param {DateTimeValue | number} recurrenceId The recurrenceId to get
	 * @return {DurationValue|null}
	 */
	getRangeRecurrenceExceptionDiff(recurrenceId) {
		if (recurrenceId instanceof DateTimeValue) {
			recurrenceId = recurrenceId.unixTime
		} else if (recurrenceId instanceof ICAL.Time) {
			recurrenceId = recurrenceId.toUnixTime()
		}

		if (this._rangeRecurrenceExceptionItemsDiffCache.has(recurrenceId)) {
			return this._rangeRecurrenceExceptionItemsDiffCache.get(recurrenceId)
		}

		const recurrenceException = this.getRangeRecurrenceExceptionForId(recurrenceId)
		if (!recurrenceException) {
			return null
		}

		const originalRecurrenceId = recurrenceException.recurrenceId
		const originalModifiedStart = recurrenceException.startDate

		const difference = originalModifiedStart.subtractDateWithTimezone(originalRecurrenceId)
		difference.lock()

		this._rangeRecurrenceExceptionItemsDiffCache.set(recurrenceId, difference)
		return difference
	}

	/**
	 * Adds a new recurrence-exception to this calendar-document
	 *
	 * @param {AbstractRecurringComponent} recurrenceExceptionItem The recurrence-exception-item to relate to recurrence-set
	 */
	relateRecurrenceException(recurrenceExceptionItem) {
		this._modify()
		const key = this._getRecurrenceIdKey(recurrenceExceptionItem)

		this._recurrenceExceptionItems.set(key, recurrenceExceptionItem)
		if (recurrenceExceptionItem.modifiesFuture()) {
			this._rangeRecurrenceExceptionItems.set(key, recurrenceExceptionItem)
			const index = ICAL.helpers.binsearchInsert(
				this._rangeRecurrenceExceptionItemsIndex,
				key,
				(a, b) => a - b,
			)

			this._rangeRecurrenceExceptionItemsIndex.splice(index, 0, key)
		}

		recurrenceExceptionItem.recurrenceManager = this
	}

	/**
	 * Removes a recurrence exception by the item itself
	 *
	 * @param {AbstractRecurringComponent} recurrenceExceptionItem The recurrence-exception remove
	 */
	removeRecurrenceException(recurrenceExceptionItem) {
		const key = this._getRecurrenceIdKey(recurrenceExceptionItem)
		this.removeRecurrenceExceptionByRecurrenceId(key)
	}

	/**
	 * Removes a recurrence exception by it's unix-time
	 *
	 * @param {number} recurrenceId The recurrence-exception to remove
	 */
	removeRecurrenceExceptionByRecurrenceId(recurrenceId) {
		this._modify()
		this._recurrenceExceptionItems.delete(recurrenceId)
		this._rangeRecurrenceExceptionItems.delete(recurrenceId)
		this._rangeRecurrenceExceptionItemsDiffCache.delete(recurrenceId)

		const index = this._rangeRecurrenceExceptionItemsIndex.indexOf(recurrenceId)
		if (index !== -1) {
			this._rangeRecurrenceExceptionItemsIndex.splice(index, 1)
		}
	}

	/**
	 *
	 * @param {AbstractRecurringComponent} recurrenceExceptionItem Object to get key from
	 * @return {number}
	 * @private
	 */
	_getRecurrenceIdKey(recurrenceExceptionItem) {
		return recurrenceExceptionItem
			.recurrenceId
			.unixTime
	}

	/**
	 * Gets an iterator over all recurrence rules
	 *
	 * @yields {RecurValue} A recurrence rule
	 * @return {Generator<RecurValue, void, undefined>}
	 */
	* getRecurrenceRuleIterator() {
		for (const property of this._masterItem.getPropertyIterator('RRULE')) {
			yield property.getFirstValue()
		}
	}

	/**
	 * Gets a list of all recurrence rules
	 *
	 * @return {RecurValue[]}
	 */
	getRecurrenceRuleList() {
		return Array.from(this.getRecurrenceRuleIterator())
	}

	/**
	 * Adds a new recurrence rule
	 *
	 * @param {RecurValue} recurrenceRule The RRULE to add
	 */
	addRecurrenceRule(recurrenceRule) {
		this._modify()
		this.resetCache()

		const property = new Property('RRULE', recurrenceRule)
		this._masterItem.addProperty(property)
	}

	/**
	 * Removes a recurrence rule
	 *
	 * @param {RecurValue} recurrenceRule The RRULE to remove
	 */
	removeRecurrenceRule(recurrenceRule) {
		this._modify()
		this.resetCache()

		for (const property of this._masterItem.getPropertyIterator('RRULE')) {
			if (property.getFirstValue() === recurrenceRule) {
				this._masterItem.deleteProperty(property)
			}
		}
	}

	/**
	 * Removes all recurrence rules
	 */
	clearAllRecurrenceRules() {
		this._modify()
		this.resetCache()

		this._masterItem.deleteAllProperties('RRULE')
	}

	/**
	 * Gets an iterator over all recurrence
	 *
	 * @param {boolean} isNegative Whether or not to get EXDATES
	 * @param {string} valueType Limit type of EXDATES
	 * @yields {DateTimeValue|PeriodValue} A recurrence date
	 * @return {Generator<DateTimeValue|PeriodValue, void, undefined>}
	 */
	* getRecurrenceDateIterator(isNegative = false, valueType = null) {
		for (const property of this._getPropertiesForRecurrenceDate(isNegative, valueType)) {
			yield* property.getValueIterator()
		}
	}

	/**
	 *
	 * @param {boolean} isNegative Whether or not to get EXDATES
	 * @param {string} valueType Limit type of EXDATES
	 * @return {(DateTimeValue|PeriodValue)[]}
	 */
	listAllRecurrenceDates(isNegative = false, valueType = null) {
		return Array.from(this.getRecurrenceDateIterator(isNegative, valueType))
	}

	/**
	 * This adds a new recurrence-date value.
	 * It automatically adds it to the first property of the same value-type
	 * or creates a new one if necessary
	 *
	 * @param {boolean} isNegative Whether we are dealing with an EXDATE or RDATE
	 * @param {DateTimeValue|PeriodValue} value EXDATE to add
	 */
	addRecurrenceDate(isNegative = false, value) {
		this._modify()
		this.resetCache()

		// Only add DateTime Value if its of the same timezone
		let timezoneId = null
		if (value instanceof DateTimeValue && !value.isDate) {
			timezoneId = value.timezoneId
		}

		const valueType = this._getValueTypeByValue(value)
		const iterator = this._getPropertiesForRecurrenceDate(isNegative, valueType, timezoneId)

		const first = iterator.next.value
		if (first instanceof Property) {
			const propertyValue = first.value
			propertyValue.push(value)
			this.masterItem.markPropertyAsDirty(isNegative ? 'EXDATE' : 'RDATE')
		} else {
			const propertyName = this._getPropertyNameByIsNegative(isNegative)
			const property = new Property(propertyName, value)
			this._masterItem.addProperty(property)
		}
	}

	/**
	 * Checks if a recurrenceID is an RDATE or EXDATE
	 *
	 * @param {boolean} isNegative Whether we are dealing with an EXDATE or RDATE
	 * @param {DateTimeValue} recurrenceId Recurrence-Id to check
	 * @return {boolean}
	 */
	hasRecurrenceDate(isNegative = false, recurrenceId) {
		for (let value of this.getRecurrenceDateIterator(isNegative)) {
			if (value instanceof PeriodValue) {
				value = value.start
			}

			if (value.compare(recurrenceId) === 0) {
				return true
			}
		}

		return false
	}

	/**
	 *
	 * @param {boolean} isNegative Whether we are dealing with an EXDATE or RDATE
	 * @param {DateTimeValue} recurrenceId Recurrence-Id to get
	 * @return {null|DateTimeValue|PeriodValue}
	 */
	getRecurrenceDate(isNegative = false, recurrenceId) {
		for (const value of this.getRecurrenceDateIterator(isNegative)) {
			let valueToCheck = value
			if (valueToCheck instanceof PeriodValue) {
				valueToCheck = valueToCheck.start
			}

			if (valueToCheck.compare(recurrenceId) === 0) {
				return value
			}
		}

		return null
	}

	/**
	 * This deletes a recurrence-date value from this recurrence-set
	 *
	 * @param {boolean} isNegative Whether we are dealing with an EXDATE or RDATE
	 * @param {DateTimeValue|PeriodValue} value The EXDATE/RDATE to remove
	 */
	removeRecurrenceDate(isNegative = false, value) {
		this._modify()
		this.resetCache()

		const valueType = this._getValueTypeByValue(value)
		for (const property of this._getPropertiesForRecurrenceDate(isNegative, valueType)) {
			for (const valueToCheck of property.getValueIterator()) {
				if (value === valueToCheck) {
					const allValues = property.value

					if (allValues.length === 1) {
						this.masterItem.deleteProperty(property)
						continue
					}

					const index = allValues.indexOf(value)
					allValues.splice(index, 1)
					this.masterItem.markPropertyAsDirty(isNegative ? 'EXDATE' : 'RDATE')
				}
			}
		}
	}

	/**
	 * Clears all recurrence-date information
	 *
	 * @param {boolean} isNegative Whether we are dealing with an EXDATE or RDATE
	 * @param {string} valueType The type of RDATEs/EXDATEs to remove
	 */
	clearAllRecurrenceDates(isNegative = false, valueType = null) {
		this._modify()
		this.resetCache()

		for (const property of this._getPropertiesForRecurrenceDate(isNegative, valueType)) {
			this._masterItem.deleteProperty(property)
		}
	}

	/**
	 * Gets the property name for recurrence dates based on the isNegative boolean
	 *
	 * @param {boolean} isNegative Whether we are dealing with an EXDATE or RDATE
	 * @return {string}
	 * @private
	 */
	_getPropertyNameByIsNegative(isNegative) {
		return isNegative
			? 'EXDATE'
			: 'RDATE'
	}

	/**
	 * Gets the value type based on the provided value
	 *
	 * @param {PeriodValue|DateTimeValue} value The value to get type of property from
	 * @return {string}
	 * @private
	 */
	_getValueTypeByValue(value) {
		if (value instanceof PeriodValue) {
			return 'PERIOD'
		} else if (value.isDate) {
			return 'DATE'
		} else {
			return 'DATETIME'
		}
	}

	/**
	 *
	 * @param {boolean} isNegative Whether we are dealing with an EXDATE or RDATE
	 * @param {string | null} valueType The type of values to get
	 * @param {ICAL.Timezone=} timezoneId Filter by timezone
	 * @yields {Property} A recurrence-date property matching the filters
	 * @return {Generator<Property, void, undefined>}
	 * @private
	 */
	* _getPropertiesForRecurrenceDate(isNegative, valueType, timezoneId = null) {
		const propertyName = this._getPropertyNameByIsNegative(isNegative)

		for (const property of this._masterItem.getPropertyIterator(propertyName)) {
			if (valueType === null) {
				yield property
			} else if (uc(valueType) === 'PERIOD' && property.getFirstValue() instanceof PeriodValue) {
				yield property
			} else if (uc(valueType) === 'DATE' && property.getFirstValue().isDate) {
				yield property
			} else if (uc(valueType) === 'DATETIME' && !property.getFirstValue().isDate) {
				if (timezoneId === null || property.getFirstValue().timezoneId === timezoneId) {
					yield property
				}
			}
		}
	}

	/**
	 * Checks if the entire set of recurrence rules is finite
	 *
	 * @return {boolean}
	 */
	isFinite() {
		return this.getRecurrenceRuleList().every((rule) => rule.isFinite())
	}

	/**
	 * @return {boolean}
	 */
	isEmptyRecurrenceSet() {
		return this._getRecurExpansionObject().next() === undefined
	}

	/**
	 * Gets the occurrence at the exact given recurrenceId
	 *
	 * @param {DateTimeValue} recurrenceId RecurrenceId to get
	 * @return {AbstractRecurringComponent|null}
	 */
	getOccurrenceAtExactly(recurrenceId) {
		if (!this.masterItem.isRecurring()) {
			if (this.masterItem.getReferenceRecurrenceId().compare(recurrenceId) === 0) {
				return this.masterItem
			}

			return null
		}

		const iterator = this._getRecurExpansionObject()
		const icalRecurrenceId = recurrenceId.toICALJs()

		let next
		while ((next = iterator.next())) {
			if (next.compare(icalRecurrenceId) === 0) {
				// It's a match 🔥
				return this._getOccurrenceAtRecurrenceId(DateTimeValue.fromICALJs(next))
			}

			if (next.compare(icalRecurrenceId) === 1) {
				// We hit an occurrence in the future, return null
				return null
			}
		}

		return null
	}

	/**
	 * Gets the closest occurrence to the given recurrenceId.
	 * That's either the closest in the future, or in case the
	 * recurrence-set ends before recurrenceId, the last one
	 *
	 * This function works solely on the basis of recurrence-ids.
	 * It ignores the actual date of recurrence-exceptions.
	 * Ideally we should fix it and provide a similar implementation
	 * like getAllOccurrencesBetweenIterator, but for now it's the
	 * accepted behavior.
	 *
	 * @param {DateTimeValue} recurrenceId RecurrenceId to get
	 * @return {AbstractRecurringComponent}
	 */
	getClosestOccurrence(recurrenceId) {
		if (!this.masterItem.isRecurring()) {
			return this.masterItem
		}

		const iterator = this._getRecurExpansionObject()
		recurrenceId = recurrenceId.toICALJs()

		let previous = null
		let next
		while ((next = iterator.next())) {
			if (next.compare(recurrenceId) === -1) {
				previous = next
			} else {
				// This is the case when it's either equal or in the future
				const dateTimeValue = DateTimeValue.fromICALJs(next)
				return this._getOccurrenceAtRecurrenceId(dateTimeValue)
			}
		}

		const dateTimeValue = DateTimeValue.fromICALJs(previous)
		return this._getOccurrenceAtRecurrenceId(dateTimeValue)
	}

	/**
	 * Counts all occurrences in the given time-range.
	 * This function works solely on the basis of recurrence-ids.
	 * Start and end are inclusive.
	 *
	 * @param {DateTimeValue} queriedTimeRangeStart Start of time-range
	 * @param {DateTimeValue} queriedTimeRangeEnd End of time-range
	 * @return {number} Count of occurrences in the given time-range
	 */
	countAllOccurrencesBetween(queriedTimeRangeStart, queriedTimeRangeEnd) {
		if (!this.masterItem.isRecurring()) {
			if (typeof this.masterItem.isInTimeFrame === 'function'
				&& !this.masterItem.isInTimeFrame(queriedTimeRangeStart, queriedTimeRangeEnd)) {
				return 0
			}

			return 1
		}

		const iterator = this._getRecurExpansionObject()
		const queriedICALJsTimeRangeStart = queriedTimeRangeStart.toICALJs()
		const queriedICALJsTimeRangeEnd = queriedTimeRangeEnd.toICALJs()

		let count = 0
		let next
		while ((next = iterator.next())) {
			if (next.compare(queriedICALJsTimeRangeStart) === -1) {
				continue
			}

			if (next.compare(queriedICALJsTimeRangeEnd) === 1) {
				break
			}

			count += 1
		}
		return count
	}

	/**
	 * Get all occurrences between start and end
	 * Start and End are inclusive
	 *
	 * @param {DateTimeValue} queriedTimeRangeStart Start of time-range
	 * @param {DateTimeValue} queriedTimeRangeEnd End of time-range
	 * @yields {AbstractRecurringComponent} An occurrence in the requested time range
	 * @return {Generator<AbstractRecurringComponent, void, undefined>}
	 */
	* getAllOccurrencesBetweenIterator(queriedTimeRangeStart, queriedTimeRangeEnd) {
		if (!this.masterItem.isRecurring()) {
			if (typeof this.masterItem.isInTimeFrame !== 'function') {
				yield this.masterItem
			}
			if (this.masterItem.isInTimeFrame(queriedTimeRangeStart, queriedTimeRangeEnd)) {
				yield this.masterItem
			}

			return
		}

		const iterator = this._getRecurExpansionObject()
		const queriedICALJsTimeRangeStart = queriedTimeRangeStart.toICALJs()
		const queriedICALJsTimeRangeEnd = queriedTimeRangeEnd.toICALJs()

		const recurrenceIdKeys = Array.from(this._recurrenceExceptionItems.keys())
		const maximumRecurrenceId = Math.max.apply(Math, recurrenceIdKeys)

		let next
		while ((next = iterator.next())) {
			// We have to get the real occurrence to resolve RECURRENCE-IDs
			const dateTimeValue = DateTimeValue.fromICALJs(next)
			const occurrence = this._getOccurrenceAtRecurrenceId(dateTimeValue)

			// Check what type of recurrence object we are dealing with
			// Depending on that, the time to compare to changes
			// If we are dealing events, we have to compare to the end-date
			// If we are dealing with tasks, we will have to compare to the due-date
			// etc.
			// For now we are only implementing events, other components will come later
			let compareDate
			switch (uc(occurrence.name)) {
				case 'VEVENT':
				case 'VTODO':
					compareDate = occurrence.endDate.toICALJs()
					break

				case 'VJOURNAL':
				default:
					compareDate = next
					break
			}

			// If the date we are comparing to is before our time-range,
			// we don't want to yield this event
			if (compareDate.compare(queriedICALJsTimeRangeStart) === -1) {
				continue
			}

			// If we have an object that is:
			// 1. either
			// 1.1 - no recurrence exception
			//     or
			// 1.2 - a recurrence-exception that modifies the future
			// and
			// 2. starts after the queried time-range ends, then we stop expanding
			const startDate = occurrence.startDate.toICALJs()
			if ((!occurrence.isRecurrenceException() || occurrence.modifiesFuture()) && startDate.compare(queriedICALJsTimeRangeEnd) === 1) {
				// Just break if there are no recurrence-exceptions
				if (this._recurrenceExceptionItems.size === 0) {
					break
				}

				// Keep iterating until our currently checked recurrenceId
				// is bigger than the maximum recurrence-id that we have.
				if (next.toUnixTime() > maximumRecurrenceId) {
					break
				} else {
					continue
				}
			}

			if (typeof occurrence.isInTimeFrame !== 'function') {
				yield occurrence
			}
			if (occurrence.isInTimeFrame(queriedTimeRangeStart, queriedTimeRangeEnd)) {
				yield occurrence
			}
		}
	}

	/**
	 * Get all occurrences between start and end
	 *
	 * @param {DateTimeValue} start Start of time-range
	 * @param {DateTimeValue} end End of time-range
	 * @return {AbstractRecurringComponent[]}
	 */
	getAllOccurrencesBetween(start, end) {
		return Array.from(this.getAllOccurrencesBetweenIterator(start, end))
	}

	/**
	 * Update the UID of all components in the recurrence set
	 *
	 * @param {string} newUID The new UID of the calendar-document
	 */
	updateUID(newUID) {
		this._masterItem.updatePropertyWithValue('UID', newUID)

		for (const recurrenceExceptionItem of this.getRecurrenceExceptionIterator()) {
			recurrenceExceptionItem.updatePropertyWithValue('UID', newUID)
		}
	}

	/**
	 * Updates the recurrence-information accordingly,
	 * whenever the start-date of the master-item changes
	 *
	 * @param {DateTimeValue} newStartDate The new start-date
	 * @param {DateTimeValue} oldStartDate The old start-date
	 */
	updateStartDateOfMasterItem(newStartDate, oldStartDate) {
		const difference = newStartDate.subtractDateWithTimezone(oldStartDate)

		// update EXDATE
		for (const exdate of this.getRecurrenceDateIterator(true)) {
			// If this EXDATE matches an RDATE, don't update, because we don't update RDATEs
			if (this.hasRecurrenceDate(false, exdate)) {
				continue
			}

			// EXDATE are always either DATE or DATETIME,
			// no need to check for PERIOD
			exdate.addDuration(difference)
		}

		// Snapshot the exceptions first because mutating the live Map while iterating it makes
		// the iterator revisit reinserted items, causing an infinite loop.
		const recurrenceExceptions = this.getRecurrenceExceptionList()
		// Remove all rule-based exceptions before reinserting any shifted keys. This
		// prevents adjacent exceptions from overwriting entries at still-occupied keys.
		for (const recurrenceException of recurrenceExceptions.filter((recurrenceException) => !this.hasRecurrenceDate(false, recurrenceException.recurrenceId))) {
			this.removeRecurrenceException(recurrenceException)
		}
		// Shift and relate the exceptions again under their new recurrence IDs, rebuilding
		// the regular and range-exception indexes in the process.
		for (const recurrenceException of recurrenceExceptions.filter((recurrenceException) => !this.hasRecurrenceDate(false, recurrenceException.recurrenceId))) {
			recurrenceException.recurrenceId.addDuration(difference)
			this.relateRecurrenceException(recurrenceException)
		}

		// update UNTIL of recurrence-rules
		for (const rrule of this.getRecurrenceRuleIterator()) {
			if (rrule.until) {
				rrule.until.addDuration(difference)
			}
		}
	}

	/**
	 * Gets an object for the given recurrenceId
	 * It does not verify that the given recurrenceId
	 * is actually a valid recurrence of this calendar-document
	 *
	 * @param {DateTimeValue} recurrenceId Recurrence-Id to get
	 * @return {AbstractRecurringComponent}
	 * @private
	 */
	_getOccurrenceAtRecurrenceId(recurrenceId) {
		if (this.hasRecurrenceExceptionForId(recurrenceId)) {
			const recurrenceException = this.getRecurrenceException(recurrenceId)

			if (!recurrenceException.canCreateRecurrenceExceptions()) {
				return recurrenceException
			}

			return recurrenceException
				.forkItem(recurrenceId)
		} else if (this.hasRangeRecurrenceExceptionForId(recurrenceId)) {
			const rangeRecurrenceException = this.getRangeRecurrenceExceptionForId(recurrenceId)
			const difference = this.getRangeRecurrenceExceptionDiff(recurrenceId)

			return rangeRecurrenceException
				.forkItem(recurrenceId, difference)
		} else if (recurrenceId.compare(this._masterItem.startDate) === 0) {
			if (!this._masterItem.canCreateRecurrenceExceptions()) {
				return this._masterItem
			}

			return this._masterItem
				.forkItem(recurrenceId)
		} else {
			return this._masterItem
				.forkItem(recurrenceId)
		}
	}

	/**
	 * Resets the internal recur-expansion object.
	 * This is necessary after each modification of the
	 * recurrence-information
	 */
	resetCache() {
		// TODO - implement me
	}

	/**
	 * Gets a new ICAL.RecurExpansion object
	 *
	 * Inspired by how ICAL.JS RecurExpansion
	 * serialises and unserialises its state
	 *
	 * @return {ICAL.RecurExpansion}
	 * @private
	 */
	_getRecurExpansionObject() {
		if (this._masterItem.startDate === null) {
			throw new RecurringWithoutDtStartError()
		}

		const dtstart = this._masterItem.startDate.toICALJs()
		let last = dtstart.clone()
		const ruleIterators = []
		let ruleDateInc
		const ruleDates = []
		let ruleDate = null
		const exDates = []
		const complete = false

		for (const ruleValue of this.getRecurrenceRuleIterator()) {
			ruleIterators.push(ruleValue.toICALJs().iterator(dtstart))
			ruleIterators[ruleIterators.length - 1].next()
		}

		for (let rDateValue of this.getRecurrenceDateIterator()) {
			if (rDateValue instanceof PeriodValue) {
				rDateValue = rDateValue.start
			}

			rDateValue = rDateValue.toICALJs()
			const index = ICAL.helpers.binsearchInsert(
				ruleDates,
				rDateValue,
				(a, b) => a.compare(b),
			)

			ruleDates.splice(index, 0, rDateValue)
		}

		// Is the first RDATE prior to our current DTSTART?
		if (ruleDates.length > 0 && ruleDates[0].compare(dtstart) === -1) {
			ruleDateInc = 0
			last = ruleDates[0].clone()
		} else {
			ruleDateInc = ICAL.helpers.binsearchInsert(
				ruleDates,
				dtstart,
				(a, b) => a.compare(b),
			)
			ruleDate = exDates[ruleDateInc]
		}

		for (let exDateValue of this.getRecurrenceDateIterator(true)) {
			exDateValue = exDateValue.toICALJs()
			const index = ICAL.helpers.binsearchInsert(
				exDates,
				exDateValue,
				(a, b) => a.compare(b),
			)
			exDates.splice(index, 0, exDateValue)
		}

		const exDateInc = ICAL.helpers.binsearchInsert(
			exDates,
			dtstart,
			(a, b) => a.compare(b),
		)
		const exDate = exDates[exDateInc]

		return new ICAL.RecurExpansion({
			dtstart,
			last,
			ruleIterators,
			ruleDateInc,
			exDateInc,
			ruleDates,
			ruleDate,
			exDates,
			exDate,
			complete,
		})
	}

	/**
	 * @private
	 */
	_modify() {
		if (this._masterItem.isLocked()) {
			throw new ModificationNotAllowedError()
		}
	}
}
