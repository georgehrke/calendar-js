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
import AbstractComponent, {
	advertiseComponent,
	advertiseMultipleOccurrenceProperty,
	advertiseMultiValueStringPropertySeparatedByLang,
	advertiseSingleOccurrenceProperty,
} from '../abstractComponent.js'
import DateTimeValue from '../../values/dateTimeValue.js'
import DurationValue from '../../values/durationValue.js'
import PeriodValue from '../../values/periodValue.js'
import { dateFactory } from '../../factories/dateFactory.js'
import { uc } from '../../helpers/stringHelper.js'
import RecurrenceManager from '../../recurrence/recurrenceManager.js'
import { randomUUID } from '../../helpers/cryptoHelper.js'
import RelationProperty from '../../properties/relationProperty.js'
import AttendeeProperty from '../../properties/attendeeProperty.js'
import { Timezone } from '@nextcloud/timezones'
import RequestStatusProperty from '../../properties/requestStatusProperty.js'
import AttachmentProperty from '../../properties/attachmentProperty.js'
import ImageProperty from '../../properties/imageProperty.js'
import TextProperty from '../../properties/textProperty.js'
import AlarmComponent from '../nested/alarmComponent.js'
import TriggerProperty from '../../properties/triggerProperty.js'
import { getConfig } from '../../config.js'
import { getConstructorForComponentName } from '../nested/index.js'

/**
 * @import AbstractValue from '../../values/abstractValue.js'
 * @import Property from '../../properties/property.js'
 * @import { Mixin } from '../../traits/mixin.js'
 */

/**
 * Members installed on the prototype by the advertise helpers at the end of this file
 *
 * @typedef {object} AbstractRecurringComponentMembers
 * @property {DateTimeValue | null} stampTime Date-Time stamp of this object
 * @property {DateTimeValue | null} recurrenceId Recurrence-ID of this object, used for recurrence-exceptions
 * @property {string | null} color Special color for this event / journal / task
 * @property {DateTimeValue | null} creationTime Creation time of this event / journal / task
 * @property {DateTimeValue | null} modificationTime Last modification time of this event / journal / task
 * @property {string | null} organizer Calendar address of the organizer of this event / journal / task
 * @property {number | null} sequence Revision of this event / journal / task
 * @property {string | null} status Status of this event / journal / task
 * @property {string | null} url URL of a more dynamic rendition of this event / journal / task
 * @property {string | null} title Title of this event / journal / task
 * @property {'PUBLIC' | 'PRIVATE' | 'CONFIDENTIAL'} accessClass Access class of this event / journal / task, determines what other users can see when sharing
 * @property {(lang?: string | null) => Generator<string, void, undefined>} getCategoryIterator Returns an iterator over all categories, optionally only those of the given language
 * @property {(lang?: string | null) => string[]} getCategoryList Returns a list of all categories, optionally only those of the given language
 * @property {(value: string, lang?: string | null) => void} addCategory Adds a value to the categories
 * @property {(value: string, lang?: string | null) => boolean} removeCategory Removes a value from the categories, returns whether it was found
 * @property {(lang?: string | null) => void} clearAllCategories Removes all categories, optionally only those of the given language
 * @property {() => Generator<AttendeeProperty, void, undefined>} getAttendeeIterator Returns an iterator over all attendees
 * @property {() => AttendeeProperty[]} getAttendeeList Returns a list of all attendees
 * @property {(item: AttendeeProperty) => void} removeAttendee Removes one of the attendees
 * @property {() => void} clearAllAttendees Removes all attendees
 * @property {() => Generator<AttachmentProperty, void, undefined>} getAttachmentIterator Returns an iterator over all attachments
 * @property {() => AttachmentProperty[]} getAttachmentList Returns a list of all attachments
 * @property {(item: AttachmentProperty) => void} removeAttachment Removes one of the attachments
 * @property {() => void} clearAllAttachments Removes all attachments
 * @property {() => Generator<RelationProperty, void, undefined>} getRelationIterator Returns an iterator over all relations
 * @property {() => RelationProperty[]} getRelationList Returns a list of all relations
 * @property {(item: RelationProperty) => void} removeRelation Removes one of the relations
 * @property {() => void} clearAllRelations Removes all relations
 * @property {() => Generator<TextProperty, void, undefined>} getCommentIterator Returns an iterator over all comments
 * @property {() => TextProperty[]} getCommentList Returns a list of all comments
 * @property {(item: TextProperty) => void} removeComment Removes one of the comments
 * @property {() => void} clearAllComments Removes all comments
 * @property {() => Generator<TextProperty, void, undefined>} getContactIterator Returns an iterator over all contacts
 * @property {() => TextProperty[]} getContactList Returns a list of all contacts
 * @property {(item: TextProperty) => void} removeContact Removes one of the contacts
 * @property {() => void} clearAllContacts Removes all contacts
 * @property {() => Generator<ImageProperty, void, undefined>} getImageIterator Returns an iterator over all images
 * @property {() => ImageProperty[]} getImageList Returns a list of all images
 * @property {(item: ImageProperty) => void} removeImage Removes one of the images
 * @property {() => void} clearAllImages Removes all images
 * @property {() => Generator<RequestStatusProperty, void, undefined>} getRequestStatusIterator Returns an iterator over all request-statuses
 * @property {() => RequestStatusProperty[]} getRequestStatusList Returns a list of all request-statuses
 * @property {(item: RequestStatusProperty) => void} removeRequestStatus Removes one of the request-statuses
 * @property {() => void} clearAllRequestStatus Removes all request-statuses
 * @property {() => Generator<AlarmComponent, void, undefined>} getAlarmIterator Returns an iterator over all alarms
 * @property {() => AlarmComponent[]} getAlarmList Returns a list of all alarms
 * @property {(item: AlarmComponent) => void} removeAlarm Removes one of the alarms
 * @property {() => void} clearAllAlarms Removes all alarms
 */

/**
 * @class AbstractRecurringComponent
 * @classdesc AbstractRecurringComponent is the basis for
 * EventComponent, JournalComponent and TodoComponent.
 *
 * It contains all the logic for recurrence-expansion and
 * recurrence-management plus all management for all
 * properties and all subcomponents that the three
 * components mentioned before have in common
 */
export default class AbstractRecurringComponent extends /** @type {typeof AbstractComponent & Mixin<AbstractRecurringComponentMembers>} */ (AbstractComponent) {
	/**
	 * @inheritDoc
	 * @param {ConstructorParameters<typeof AbstractComponent>} args Arguments forwarded to the base class constructor
	 */
	constructor(...args) {
		super(...args)

		/**
		 * In case this object is virtual, primary item refers to the master object
		 * that this object was forked from.
		 *
		 * Otherwise primary item is null
		 *
		 * @type {AbstractRecurringComponent}
		 * @private
		 */
		this._primaryItem = null

		/**
		 * Indicator whether this is a direct fork of a primary item, representing
		 * the very same recurrence id
		 *
		 * @type {boolean}
		 * @private
		 */
		this._isExactForkOfPrimary = false

		/**
		 * The original recurrence-id of this occurrence.
		 * Mostly needed for range exceptions with a range
		 *
		 * @type {DateTimeValue|null}
		 * @private
		 */
		this._originalRecurrenceId = null

		/**
		 * Instance of the recurrence manager.
		 * This object is shared among all instances
		 * of a recurrence-set
		 *
		 * @type {RecurrenceManager}
		 * @private
		 */
		this._recurrenceManager = null

		/**
		 * Indicator whether this component was modified
		 * In case it was, the last-modified property
		 * needs to be updated before saving the event
		 *
		 * @type {boolean}
		 * @private
		 */
		this._dirty = false

		/**
		 * Indicator whether there have been significant changes
		 * In case the changes are considered significant,
		 * the sequence needs to be incremented
		 *
		 * @type {boolean}
		 * @private
		 */
		this._significantChange = false

		/**
		 * Id of this AbstractRecurringComponent
		 *
		 * @type {string | null}
		 * @private
		 */
		this._cachedId = null
	}

	/**
	 * Gets the primary-item of this recurring item
	 *
	 * @return {AbstractRecurringComponent}
	 */
	get primaryItem() {
		return this._primaryItem
	}

	/**
	 * Sets the primary-item of this recurring item
	 *
	 * @param {AbstractRecurringComponent} primaryItem The new primary-item
	 */
	set primaryItem(primaryItem) {
		this._modify()
		this._primaryItem = primaryItem
	}

	/**
	 * Gets whether or not this is a fork of the primary item
	 * for the same recurrence-id
	 *
	 * @return {boolean}
	 */
	get isExactForkOfPrimary() {
		return this._isExactForkOfPrimary
	}

	/**
	 * Sets the isExactForkOfPrimary indicator, see getter for description
	 *
	 * @param {boolean} isExactForkOfPrimary Whether or not this is an exact fork
	 */
	set isExactForkOfPrimary(isExactForkOfPrimary) {
		this._isExactForkOfPrimary = isExactForkOfPrimary
	}

	/**
	 * Gets the original recurrence-id
	 *
	 * @return {DateTimeValue}
	 */
	get originalRecurrenceId() {
		return this._originalRecurrenceId
	}

	/**
	 * Sets the original recurrence-id
	 *
	 * @param {DateTimeValue} originalRecurrenceId The new original recurrence-id
	 */
	set originalRecurrenceId(originalRecurrenceId) {
		this._originalRecurrenceId = originalRecurrenceId
	}

	/**
	 * Gets the recurrence-manager of this recurrence-set
	 *
	 * @return {RecurrenceManager}
	 */
	get recurrenceManager() {
		return this._recurrenceManager
	}

	/**
	 * Sets the recurrence-manager of this recurrence-set
	 *
	 * @param {RecurrenceManager} recurrenceManager The new recurrence-manager
	 */
	set recurrenceManager(recurrenceManager) {
		this._recurrenceManager = recurrenceManager
	}

	/**
	 * Gets the master-item of this recurring item
	 *
	 * @return {AbstractRecurringComponent}
	 */
	get masterItem() {
		return this.recurrenceManager.masterItem
	}

	/**
	 * Returns whether this item is the master item
	 *
	 * @return {boolean}
	 */
	isMasterItem() {
		return this.masterItem === this
	}

	/**
	 * Gets a unique ID for this occurrence of the event
	 *
	 * Please note that if the same event occurs in multiple calendars,
	 * this id will not be unique. Software using this library will have to
	 * manually mix in the calendar id into this id
	 *
	 * @return {string}
	 */
	get id() {
		if (this._cachedId) {
			return this._cachedId
		}

		if (this.startDate === null) {
			this._cachedId = encodeURIComponent(this.uid)
			return this._cachedId
		}

		this._cachedId = [
			encodeURIComponent(this.uid),
			encodeURIComponent(this.getReferenceRecurrenceId().unixTime.toString()),
		].join('###')

		return this._cachedId
	}

	/**
	 * Gets the UID property
	 *
	 * @return {string | null}
	 */
	get uid() {
		return this.getFirstPropertyFirstValue('UID')
	}

	/**
	 * Sets the UID property and the UID property of all related exceptions
	 *
	 * @param {string} uid The new UID
	 */
	set uid(uid) {
		this._recurrenceManager.updateUID(uid)
	}

	/**
	 * Gets the start date of the event
	 *
	 * @return {DateTimeValue}
	 */
	get startDate() {
		return this.getFirstPropertyFirstValue('dtstart')
	}

	/**
	 * Sets the start date of the event
	 *
	 * @param {DateTimeValue} start The new start-date to set
	 */
	set startDate(start) {
		const oldStartDate = this.startDate
		this.updatePropertyWithValue('dtstart', start)

		if (this.isMasterItem()) {
			this._recurrenceManager.updateStartDateOfMasterItem(start, oldStartDate)
		}
	}

	/**
	 * Checks whether this item is part of a recurring set
	 *
	 * @return {boolean}
	 */
	isPartOfRecurrenceSet() {
		return this.masterItem.isRecurring()
	}

	/**
	 * Checks whether this component is recurring
	 *
	 * @return {boolean}
	 */
	isRecurring() {
		return this.hasProperty('RRULE') || this.hasProperty('RDATE')
	}

	/**
	 * Checks whether this component is a recurrence-exception
	 *
	 * @return {boolean}
	 */
	isRecurrenceException() {
		return this.hasProperty('RECURRENCE-ID')
	}

	/**
	 * Checks wether this component is a recurrence-exception
	 * and whether it's modifying the future
	 *
	 * @return {boolean}
	 */
	modifiesFuture() {
		if (!this.isRecurrenceException()) {
			return false
		}

		const property = this.getFirstProperty('RECURRENCE-ID')
		return property.getParameterFirstValue('RANGE') === 'THISANDFUTURE'
	}

	/**
	 * Creates an occurrence at the given time
	 *
	 * This is an internal function for calendar-js, used by the recurrence-manager
	 * Do not call from outside
	 *
	 * @param {DateTimeValue} recurrenceId The recurrence-Id of the forked item
	 * @param {DurationValue=} startDiff to be used when The start-diff (used for RECURRENCE-ID;RANGE=THISANDFUTURE)
	 * @return {AbstractRecurringComponent}
	 */
	forkItem(recurrenceId, startDiff = null) {
		const occurrence = this.clone()

		occurrence.recurrenceManager = this.recurrenceManager
		occurrence.primaryItem = this

		// Exact match for master item or recurrence-exception
		if (occurrence.getReferenceRecurrenceId().compare(recurrenceId) === 0) {
			occurrence.isExactForkOfPrimary = true
		}

		if (!occurrence.hasProperty('DTSTART')) {
			throw new TypeError('Can\'t fork item without a DTSTART')
		}

		// Adjust RRULE COUNT if present
		const rrule = occurrence.getFirstPropertyFirstValue('RRULE')
		if (rrule?.count) {
			let index = occurrence.recurrenceManager.countAllOccurrencesBetween(
				occurrence.getReferenceRecurrenceId(),
				recurrenceId,
			)

			index -= 1 // Don't count the forked occurrence
			rrule.count -= index
			if (rrule.count < 1) {
				rrule.count = 1
			}
		}

		if (occurrence.getFirstPropertyFirstValue('DTSTART').timezoneId !== recurrenceId.timezoneId) {
			const originalTimezone = occurrence.getFirstPropertyFirstValue('DTSTART').getICALTimezone()
			recurrenceId = recurrenceId.getInICALTimezone(originalTimezone)
		}

		occurrence.originalRecurrenceId = recurrenceId.clone()

		const dtStartValue = occurrence.getFirstPropertyFirstValue('DTSTART')

		let period = null
		if (this._recurrenceManager.hasRecurrenceDate(false, recurrenceId)) {
			const recurrenceDate = this._recurrenceManager.getRecurrenceDate(false, recurrenceId)
			if (recurrenceDate instanceof PeriodValue) {
				period = recurrenceDate
			}
		}

		let duration
		if (occurrence.hasProperty('DTEND')) {
			const dtEndValue = occurrence.getFirstPropertyFirstValue('DTEND')
			duration = dtEndValue.subtractDateWithTimezone(dtStartValue)
		} else if (occurrence.hasProperty('DUE')) {
			const dueValue = occurrence.getFirstPropertyFirstValue('DUE')
			duration = dueValue.subtractDateWithTimezone(dtStartValue)
		}

		if (!(occurrence.isRecurrenceException() && occurrence.isExactForkOfPrimary)) {
			occurrence.updatePropertyWithValue('DTSTART', recurrenceId.clone())

			if (startDiff) {
				occurrence.startDate.addDuration(startDiff)
			}

			if (occurrence.hasProperty('DTEND')) {
				const dtEnd = occurrence.startDate.clone()
				dtEnd.addDuration(duration)
				occurrence.updatePropertyWithValue('DTEND', dtEnd)
			} else if (occurrence.hasProperty('DUE')) {
				const due = occurrence.startDate.clone()
				due.addDuration(duration)
				occurrence.updatePropertyWithValue('DUE', due)
			}

			if (period) {
				occurrence.deleteAllProperties('DTEND')
				occurrence.deleteAllProperties('DURATION')

				occurrence.updatePropertyWithValue('DTEND', period.end.clone())
			}
		}

		occurrence.resetDirty()

		return occurrence
	}

	/**
	 * Checks whether it's possible to create a recurrence exception for this event
	 * It is possible
	 *
	 * @return {boolean}
	 */
	canCreateRecurrenceExceptions() {
		let primaryIsRecurring = false
		if (this.primaryItem && this.primaryItem.isRecurring()) {
			primaryIsRecurring = true
		}
		return this.isRecurring() || this.modifiesFuture() || (!this.isRecurring() && primaryIsRecurring)
	}

	/**
	 * creates a recurrence exception based on this event
	 * If the parameter thisAndAllFuture is set to true,
	 * it will apply changes to this and all future occurrences
	 *
	 * @param {boolean} thisAndAllFuture Whether to create an exception for this and all future
	 * @return {AbstractRecurringComponent[]} the AbstractRecurringComponent of the future events.
	 * In case you set `thisAndAllFuture` to true, this will be an
	 * AbstractRecurringComponent inside a entirely new calendar component
	 */
	createRecurrenceException(thisAndAllFuture = false) {
		if (!this.canCreateRecurrenceExceptions()) {
			throw new Error('Can\'t create recurrence-exceptions for non-recurring items')
		}

		const previousPrimaryItem = this.primaryItem

		/**
		 * The overall support for RANGE=THISANDFUTURE is really bad.
		 * Instead, we have to create a new event/journal/task and
		 * set an until date on the old one.
		 *
		 * Also see:
		 * - https://github.com/nextcloud/calendar/issues/7#issuecomment-292574813
		 * - https://github.com/nextcloud/calendar/issues/7#issuecomment-299169143
		 *
		 * Right now, this replaces all future occurrence modifications,
		 * including recurrence-exceptions, RDATES and EXDATES.
		 * This is also how other CUAs handle it, but i would be happy
		 * to put that up for discussion.
		 *
		 * Keeping future RDates + their recurrence-exceptions would be rather easy.
		 * Updating recurrence-exceptions, that are based off normal recurrence rules,
		 * could be very expensive.
		 */
		if (thisAndAllFuture) {
			if (this.isExactForkOfPrimary) {
				// master item
				if (this.primaryItem.isMasterItem()) {
					this._overridePrimaryItem()
					return [this, this]
				}
			}

			this.removeThisOccurrence(true)
			this.recurrenceManager = new RecurrenceManager(this)
			this._originalRecurrenceId = null

			this.primaryItem = this
			this.updatePropertyWithValue('UID', randomUUID())
			this._cachedId = null

			this.addRelation('SIBLING', previousPrimaryItem.uid)
			previousPrimaryItem.addRelation('SIBLING', this.uid)

			// delete to make sure all parameters are gone
			this.deleteAllProperties('RECURRENCE-ID')
			this.deleteAllProperties('RDATE')
			this.deleteAllProperties('EXDATE')
			this.updatePropertyWithValue('CREATED', DateTimeValue.fromJSDate(dateFactory(), true))
			this.updatePropertyWithValue('DTSTAMP', DateTimeValue.fromJSDate(dateFactory(), true))
			this.updatePropertyWithValue('LAST-MODIFIED', DateTimeValue.fromJSDate(dateFactory(), true))
			this.updatePropertyWithValue('SEQUENCE', 0)
			this._significantChange = false
			this._dirty = false

			this.root = this.root.constructor.fromEmpty()
			this.root.addComponent(this)
			this.parent = this.root

			// this is a completely new event, we should set the RSVP of all attendees to true,
			// so that they receive an invitation to the new event, not only the cancellation of the old one
			for (const attendee of this.getAttendeeIterator()) {
				attendee.rsvp = true
			}
		} else {
			// delete to make sure all parameters are gone
			this.deleteAllProperties('RECURRENCE-ID')
			this.recurrenceId = this.getReferenceRecurrenceId().clone()
			this.root.addComponent(this)
			this.recurrenceManager.relateRecurrenceException(this)
			this.primaryItem = this

			this.deleteAllProperties('RDATE')
			this.deleteAllProperties('RRULE')
			this.deleteAllProperties('EXDATE')
			this.updatePropertyWithValue('CREATED', DateTimeValue.fromJSDate(dateFactory(), true))
			this.updatePropertyWithValue('DTSTAMP', DateTimeValue.fromJSDate(dateFactory(), true))
			this.updatePropertyWithValue('LAST-MODIFIED', DateTimeValue.fromJSDate(dateFactory(), true))
			this.updatePropertyWithValue('SEQUENCE', 0)

			if (this.recurrenceManager.hasRecurrenceDate(false, this.getReferenceRecurrenceId())) {
				const recurDate = this.recurrenceManager.getRecurrenceDate(false, this.getReferenceRecurrenceId())
				if (recurDate instanceof PeriodValue) {
					const valueDateTimeRecurDate = recurDate.start
					this.recurrenceManager.removeRecurrenceDate(false, recurDate)
					this.recurrenceManager.addRecurrenceDate(false, valueDateTimeRecurDate)
				}
			}

			this.originalRecurrenceId = null
		}

		return [previousPrimaryItem, this]
	}

	/**
	 * Deletes this occurrence from the series of recurring events
	 * If the parameter thisAndAllFuture is set to true,
	 * it will remove this and all future occurrences
	 *
	 * @param {boolean} thisAndAllFuture Whether to create an exception for this and all future
	 * @return {boolean} true if this deleted the last occurrence in set, false if there are occurrences left
	 */
	removeThisOccurrence(thisAndAllFuture = false) {
		if (!this.isPartOfRecurrenceSet()) {
			// When deleting an object, that's not part of a recurring set,
			// the calendar-document would be empty.
			return true
		}

		if (thisAndAllFuture) {
			// To get the UNTIL date, just deduct one second.
			// That's also how macOS does it, so this should be fairly
			// well supported among all clients
			const recurrenceId = this.getReferenceRecurrenceId().clone()

			const until = recurrenceId.getInTimezone(Timezone.utc)
			until.addDuration(DurationValue.fromSeconds(-1))

			for (const recurValue of this.recurrenceManager.getRecurrenceRuleIterator()) {
				recurValue.until = until.clone()
			}

			for (const recurDate of this.recurrenceManager.getRecurrenceDateIterator()) {
				let valueToCheck = recurDate
				if (recurDate instanceof PeriodValue) {
					valueToCheck = valueToCheck.start
				}

				if (recurrenceId.compare(valueToCheck) <= 0) {
					this.recurrenceManager.removeRecurrenceDate(false, recurDate)
				}
			}

			for (const exceptionDate of this.recurrenceManager.getRecurrenceDateIterator(true)) {
				if (recurrenceId.compare(exceptionDate) <= 0) {
					this.recurrenceManager.removeRecurrenceDate(true, exceptionDate)
				}
			}

			for (const exception of this.recurrenceManager.getRecurrenceExceptionList()) {
				if (recurrenceId.compare(exception.recurrenceId) <= 0) {
					this.root.deleteComponent(exception)
					this.recurrenceManager.removeRecurrenceException(exception)
				}
			}
		} else {
			// Make sure we don't leave orphaned recurrence-exceptions
			if (this.isRecurrenceException() && !this.modifiesFuture()) {
				this.root.deleteComponent(this)
				this.recurrenceManager.removeRecurrenceException(this)
			}

			// If this is based on a recurrence-date, simply delete it
			// otherwise add an exception-date
			if (this.recurrenceManager.hasRecurrenceDate(false, this.getReferenceRecurrenceId())) {
				const recurDate = this.recurrenceManager.getRecurrenceDate(false, this.getReferenceRecurrenceId())
				this.recurrenceManager.removeRecurrenceDate(false, recurDate)
			} else {
				this.recurrenceManager.addRecurrenceDate(true, this.getReferenceRecurrenceId().clone())
			}
		}

		return this.recurrenceManager.isEmptyRecurrenceSet()
	}

	/**
	 * @inheritDoc
	 * @return {this}
	 */
	clone() {
		const comp = super.clone()
		comp.resetDirty()

		return comp
	}

	/**
	 * Adds a new attendee
	 *
	 * @param {AttendeeProperty} attendee The attendee property to add
	 * @private
	 * @return {boolean}
	 */
	_addAttendee(attendee) {
		// Check for different Attendee objects with the same uri
		for (const a of this.getAttendeeIterator()) {
			if (a.email === attendee.email) {
				return false
			}
		}

		this.addProperty(attendee)
		return true
	}

	/**
	 * Adds a new attendee based on their name and email-address
	 *
	 * @param {string} name The name of the attendee to add
	 * @param {string} email The email-address of the attendee to add
	 * @return {boolean}
	 */
	addAttendeeFromNameAndEMail(name, email) {
		const attendeeProperty = AttendeeProperty.fromNameAndEMail(name, email)
		return this._addAttendee(attendeeProperty)
	}

	/**
	 * Adds a new attendee based on their properties
	 *
	 * @param {string} name The name of the attendee to add
	 * @param {string} email The email-address of the attendee to add
	 * @param {string} role The role of the attendee to add
	 * @param {string} userType The type of attendee to add
	 * @param {boolean} rsvp Whether or not to request a response from the attendee
	 * @return {boolean}
	 */
	addAttendeeFromNameEMailRoleUserTypeAndRSVP(name, email, role, userType, rsvp) {
		const attendeeProperty = AttendeeProperty.fromNameEMailRoleUserTypeAndRSVP(name, email, role, userType, rsvp, false)
		return this._addAttendee(attendeeProperty)
	}

	/**
	 * Sets the organiser property from common-name and email address
	 *
	 * @param {string} name The name of the organizer
	 * @param {string} email The email-address of the organizer
	 */
	setOrganizerFromNameAndEMail(name, email) {
		this.deleteAllProperties('ORGANIZER')
		this.addProperty(AttendeeProperty.fromNameAndEMail(name, email, true))
	}

	/**
	 * Adds a new attachment from raw data
	 *
	 * @param {string} data The data of the attachment
	 * @param {string} formatType The mime-type of the attachment
	 */
	addAttachmentFromData(data, formatType = null) {
		this.addProperty(AttachmentProperty.fromData(data, formatType))
	}

	/**
	 * Adds a new attachment from a link
	 *
	 * @param {string} uri The URI of the attachment
	 * @param {string} formatType The mime-type of the attachment
	 */
	addAttachmentFromLink(uri, formatType = null) {
		this.addProperty(AttachmentProperty.fromLink(uri, formatType))
	}

	/**
	 * Adds a new contact
	 *
	 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.2
	 *
	 * @param {string} contact The textual contact description to add
	 */
	addContact(contact) {
		this.addProperty(new TextProperty('CONTACT', contact))
	}

	/**
	 * Adds a new comment
	 *
	 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.4
	 *
	 * @param {string} comment The comment to add
	 */
	addComment(comment) {
		this.addProperty(new TextProperty('COMMENT', comment))
	}

	/**
	 * Adds a new image from raw data
	 *
	 * @param {string} data Data of the image to add
	 * @param {string=} display What display-type the image is optimized for
	 * @param {string=} formatType The mime-type of the image
	 */
	addImageFromData(data, display = null, formatType = null) {
		this.addProperty(ImageProperty.fromData(data, display, formatType))
	}

	/**
	 * Adds a new image from a link
	 *
	 * @param {string} uri The URI of the image to add
	 * @param {string=} display What display-type the image is optimized for
	 * @param {string=} formatType The mime-type of the image
	 */
	addImageFromLink(uri, display = null, formatType = null) {
		this.addProperty(ImageProperty.fromLink(uri, display, formatType))
	}

	/**
	 * Creates a new RELATED-TO property based on a relation-type and id
	 * and adds it to this object
	 *
	 * @param {string} relType The type of relation to add
	 * @param {string} relId The id of the related calendar-document
	 */
	addRelation(relType, relId) {
		this.addProperty(RelationProperty.fromRelTypeAndId(relType, relId))
	}

	/**
	 * Creates a new REQUEST-STATUS property based on code and message
	 * and adds it to this object
	 *
	 * @param {number} code The status-code of the request status
	 * @param {string} message The message of the request status
	 */
	addRequestStatus(code, message) {
		this.addProperty(RequestStatusProperty.fromCodeAndMessage(code, message))
	}

	/**
	 * Adds a new absolute alarm based on action and trigger time
	 *
	 * @param {string} action The type of alarm Action
	 * @param {DateTimeValue} alarmTime The trigger time of the alarm
	 * @return {AlarmComponent}
	 */
	addAbsoluteAlarm(action, alarmTime) {
		const alarmComp = new AlarmComponent('VALARM', [
			['action', action],
			TriggerProperty.fromAbsolute(alarmTime),
		])

		this.addComponent(alarmComp)
		return alarmComp
	}

	/**
	 * Adds a new relative alarm based on action, trigger time and relativeTo parameter
	 *
	 * @param {string} action The type of alarm Action
	 * @param {DurationValue} alarmOffset The trigger time of the alarm
	 * @param {boolean=} relatedToStart Whether or not the alarm is related to the event's start
	 * @return {AlarmComponent}
	 */
	addRelativeAlarm(action, alarmOffset, relatedToStart = true) {
		const alarmComp = new AlarmComponent('VALARM', [
			['action', action],
			TriggerProperty.fromRelativeAndRelated(alarmOffset, relatedToStart),
		])

		this.addComponent(alarmComp)
		return alarmComp
	}

	/**
	 * Marks a certain property as edited
	 *
	 * @param {string} propertyName The name of the property
	 */
	markPropertyAsDirty(propertyName) {
		this.markDirty()

		// Properties that must be considered a significant change
		// according to RFC 5546 Section 2.1.4
		const props = [
			'DTSTART',
			'DTEND',
			'DURATION',
			'RRULE',
			'RDATE',
			'EXDATE',
			'STATUS',
			...getConfig('property-list-significant-change', []),
		]

		if (props.includes(uc(propertyName))) {
			this.markChangesAsSignificant()
		}
	}

	/**
	 * Marks a certain component as edited
	 *
	 * @param {string} componentName The name of the component
	 */
	markSubComponentAsDirty(componentName) {
		this.markDirty()

		if (getConfig('component-list-significant-change', []).includes(componentName)) {
			this.markChangesAsSignificant()
		}
	}

	/**
	 * Returns whether or not this component is dirty
	 *
	 * @return {boolean}
	 */
	isDirty() {
		return this._dirty || this._significantChange
	}

	/**
	 * Marks this object as dirty
	 */
	markDirty() {
		this._dirty = true
	}

	/**
	 * Marks changes as significant. Can be called by the program using this lib
	 */
	markChangesAsSignificant() {
		this._significantChange = true
	}

	/**
	 * Updates the event after modifications.
	 *
	 * @return {boolean} true if last-modified was updated
	 */
	undirtify() {
		if (!this.isDirty()) {
			return false
		}

		if (!this.hasProperty('SEQUENCE')) {
			this.sequence = 0
		}

		this.updatePropertyWithValue('DTSTAMP', DateTimeValue.fromJSDate(dateFactory(), true))
		this.updatePropertyWithValue('LAST-MODIFIED', DateTimeValue.fromJSDate(dateFactory(), true))
		if (this._significantChange) {
			this.sequence++
		}

		this.resetDirty()

		return true
	}

	/**
	 * Resets the dirty indicators without updating DTSTAMP or LAST-MODIFIED
	 */
	resetDirty() {
		this._dirty = false
		this._significantChange = false
	}

	/**
	 * @inheritDoc
	 * @param {string} propertyName Name of the property to update / create
	 * @param {string | number | AbstractValue | string[] | number[] | AbstractValue[] | null} value The value to set
	 */
	updatePropertyWithValue(propertyName, value) {
		super.updatePropertyWithValue(propertyName, value)

		if (uc(propertyName) === 'UID') {
			this._cachedId = null
		}

		this.markPropertyAsDirty(propertyName)
	}

	/**
	 * @inheritDoc
	 * @param {Property} property The property to add
	 * @return {boolean}
	 */
	addProperty(property) {
		this.markPropertyAsDirty(property.name)
		property.subscribe(() => this.markPropertyAsDirty(property.name))
		return super.addProperty(property)
	}

	/**
	 * @inheritDoc
	 * @param {Property} property The property to delete
	 * @return {boolean}
	 */
	deleteProperty(property) {
		this.markPropertyAsDirty(property.name)
		return super.deleteProperty(property)
	}

	/**
	 * @inheritDoc
	 * @param {string} propertyName The name of the properties to delete
	 * @return {boolean}
	 */
	deleteAllProperties(propertyName) {
		this.markPropertyAsDirty(propertyName)
		return super.deleteAllProperties(propertyName)
	}

	/**
	 * @inheritDoc
	 * @param {AbstractComponent} component The component to add
	 * @return {boolean}
	 */
	addComponent(component) {
		this.markSubComponentAsDirty(component.name)
		component.subscribe(() => this.markSubComponentAsDirty(component.name))
		return super.addComponent(component)
	}

	/**
	 * @inheritDoc
	 * @param {AbstractComponent} component The component to delete
	 * @return {boolean}
	 */
	deleteComponent(component) {
		this.markSubComponentAsDirty(component.name)
		return super.deleteComponent(component)
	}

	/**
	 * @inheritDoc
	 * @param {string} componentName The name of the components to delete
	 * @return {boolean}
	 */
	deleteAllComponents(componentName) {
		this.markSubComponentAsDirty(componentName)
		return super.deleteAllComponents(componentName)
	}

	/**
	 * Gets a recurrence-id that has to be used to refer to this event.
	 * This is used for recurrence-management
	 *
	 * @return {DateTimeValue|null}
	 */
	getReferenceRecurrenceId() {
		if (this.originalRecurrenceId) {
			return this.originalRecurrenceId
		} else if (this.recurrenceId) {
			return this.recurrenceId
		} else if (this.startDate) {
			return this.startDate
		}

		return null
	}

	/**
	 * Overrides the master item with this one
	 *
	 * @private
	 */
	_overridePrimaryItem() {
		const oldStartDate = this.primaryItem.startDate

		for (const property of this.primaryItem.getPropertyIterator()) {
			this.primaryItem.deleteProperty(property)
		}

		for (const property of this.getPropertyIterator()) {
			this.primaryItem.addProperty(property)
		}

		this.recurrenceManager.resetCache()
		if (this.startDate.compare(oldStartDate) !== 0) {
			this.recurrenceManager.updateStartDateOfMasterItem(this.startDate, oldStartDate)
		}
	}

	/**
	 * @inheritDoc
	 * @param {string} componentName The name of the component
	 * @return {ReturnType<typeof getConstructorForComponentName>}
	 */
	static _getConstructorForComponentName(componentName) {
		return getConstructorForComponentName(componentName)
	}

	/**
	 * @inheritDoc
	 * @param {Parameters<typeof AbstractComponent.fromICALJs>} args Arguments forwarded to the base class
	 * @return {AbstractComponent}
	 */
	static fromICALJs(...args) {
		const comp = super.fromICALJs(...args)
		comp.resetDirty()

		return comp
	}
}

/**
 * Date-Time stamp of this object.
 * It has different meaning, based on whether or not a method is defined
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.7.2
 *
 * @name EventComponent#stampTime
 * @type {DateTimeValue}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'stampTime',
	iCalendarName: 'DTSTAMP',
})

/**
 * Recurrence-ID of this object, used for recurrence-exceptions
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.4
 *
 * @name EventComponent#recurrenceId
 * @type {DateTimeValue}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'recurrenceId',
	iCalendarName: 'RECURRENCE-ID',
})

/**
 * Special color for this event / journal / task
 *
 * @see https://tools.ietf.org/html/rfc7986#section-5.9
 *
 * @name EventComponent#color
 * @type {string}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, 'color')

/**
 * Creation Time of this event / journal / task
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.7.1
 *
 * @name EventComponent#creationTime
 * @type {DateTimeValue}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'creationTime',
	iCalendarName: 'CREATED',
})

/**
 * The time this event / journal / task
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.7.3
 *
 * @name EventComponent#modificationTime
 * @type {DateTimeValue}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'modificationTime',
	iCalendarName: 'LAST-MODIFIED',
})

/**
 * Organizer of this event / journal / task
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.3
 *
 * @name EventComponent#organizer
 * @type {string}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, 'organizer')

/**
 * Revision of this this event / journal / task
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.7.4
 *
 * @name EventComponent#sequence
 * @type {number}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, 'sequence')

/**
 * Status of this event / journal / task
 * This indicates whether an event is tentative / confirmed / cancelled
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.11
 *
 * @name EventComponent#status
 * @type {string}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, 'status')

/**
 * URL of a more dynamic rendition of this event / journal / task
 * DO NOT use this to simply point to a website merely related.
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.4.6
 *
 * @name EventComponent#url
 * @type {string}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, 'url')

/**
 * Title of this event / journal / task
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.12
 *
 * @name EventComponent#title
 * @type {string}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'title',
	iCalendarName: 'SUMMARY',
})

/**
 * Access class of this event / journal / task
 * This determines what other users can see when sharing
 *
 * @see https://tools.ietf.org/html/rfc5545#section-3.8.1.3
 *
 * @name EventComponent#accessClass
 * @type {string}
 */
advertiseSingleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'accessClass',
	iCalendarName: 'class',
	allowedValues: ['PUBLIC', 'PRIVATE', 'CONFIDENTIAL'],
	defaultValue: 'PUBLIC',
	unknownValue: 'PRIVATE',
})

/**
 * Returns an iterator over all categories
 * If the parameter lang is given, it will only
 * return an iterator for Categories matching that language
 *
 * @name AbstractRecurringComponent#getCategoryIterator
 * @function
 * @param {string=} lang
 * @return {IterableIterator<string>}
 */

/**
 * Returns a list of all categories
 * If the parameter lang is given, it will only
 * return an iterator for Categories matching that language
 *
 * @name AbstractRecurringComponent#getCategoryList
 * @function
 * @param {string=} lang
 * @return {string[]}
 */

/**
 * Adds a new category
 *
 * @name AbstractRecurringComponent#addCategory
 * @function
 * @param {string} category
 * @param {string=} lang
 */

/**
 * Removes a category
 *
 * @name AbstractRecurringComponent#removeCategory
 * @function
 * @param {string} category
 * @param {string=} lang
 */

/**
 * Clear all categories of a given language
 *
 * @name AbstractRecurringComponent#clearAllCategories
 * @function
 */
advertiseMultiValueStringPropertySeparatedByLang(AbstractRecurringComponent.prototype, {
	name: 'category',
	pluralName: 'categories',
	iCalendarName: 'CATEGORIES',
})

/**
 * Returns an iterator over all attendees
 *
 * @name AbstractRecurringComponent#getAttendeeIterator
 * @function
 * @return {IterableIterator<AttendeeProperty>}
 */

/**
 * Gets a list of all attendees
 *
 * @name AbstractRecurringComponent#getAttendeeList
 * @function
 * @return {AttendeeProperty[]}
 */

/**
 * Removes an attendee from this event / journal / task
 *
 * @name AbstractRecurringComponent#removeAttendee
 * @function
 * @param {AttendeeProperty} attendee
 */

/**
 * Removes all attendees from this event / journal / task
 *
 * @name AbstractRecurringComponent#clearAllAttendees
 * @function
 */
advertiseMultipleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'attendee',
})

/**
 * Returns an iterator over all attachments
 *
 * @name AbstractRecurringComponent#getAttachmentIterator
 * @function
 * @return {IterableIterator<AttachmentProperty>}
 */

/**
 * Gets a list of all attachments
 *
 * @name AbstractRecurringComponent#getAttachmentList
 * @function
 * @return {AttachmentProperty[]}
 */

/**
 * Removes one attachment from this event / journal / task
 *
 * @name AbstractRecurringComponent#removeAttachment
 * @function
 * @param {AttachmentProperty} attachment
 */

/**
 * Removes all attachments from this event / journal / task
 *
 * @name AbstractRecurringComponent#clearAllAttachments
 * @function
 */
advertiseMultipleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'attachment',
	iCalendarName: 'ATTACH',
})

/**
 * Returns an iterator over all relation properties
 *
 * @name AbstractRecurringComponent#getRelationIterator
 * @function
 * @return {IterableIterator<RelationProperty>}
 */

/**
 * Returns a list of all relation properties
 *
 * @name AbstractRecurringComponent#getRelationList
 * @function
 * @return {RelationProperty[]}
 */

/**
 * Removes a relation from this event / journal / task
 *
 * @name AbstractRecurringComponent#removeRelation
 * @function
 * @param {RelationProperty} relation
 */

/**
 * Removes all relations from this event / journal / task
 *
 * @name AbstractRecurringComponent#clearAllRelations
 * @function
 */
advertiseMultipleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'relation',
	iCalendarName: 'RELATED-TO',
})

/**
 * Returns an iterator over all comments in this event / journal / task
 *
 * @name AbstractRecurringComponent#getCommentIterator
 * @function
 * @return {IterableIterator<TextProperty>}
 */

/**
 * Returns a list of all comments in this event / journal / task
 *
 * @name AbstractRecurringComponent#getCommentList
 * @function
 * @return {TextProperty[]}
 */

/**
 * Removes a comment from this event / journal / task
 *
 * @name AbstractRecurringComponent#removeComment
 * @function
 * @param {TextProperty} comment
 */

/**
 * Removes all comments from this event / journal / task
 *
 * @name AbstractRecurringComponent#clearAllComments
 * @function
 */
advertiseMultipleOccurrenceProperty(AbstractRecurringComponent.prototype, 'comment')

/**
 * Returns an iterator over all contacts referenced in this event / journal / task
 *
 * @name AbstractRecurringComponent#getContactIterator
 * @function
 * @return {IterableIterator<TextProperty>}
 */

/**
 * Returns a list of all contacts referenced in this event / journal / task
 *
 * @name AbstractRecurringComponent#getContactList
 * @function
 * @return {TextProperty[]}
 */

/**
 * Removes one contact from this event / journal / task
 *
 * @name AbstractRecurringComponent#removeContact
 * @function
 * @param {TextProperty} contact
 */

/**
 * Removes all contacts from this event / journal / task
 *
 * @name AbstractRecurringComponent#clearAllContacts
 * @function
 */
advertiseMultipleOccurrenceProperty(AbstractRecurringComponent.prototype, 'contact')

/**
 * Returns an iterator over all image properties
 *
 * @name AbstractRecurringComponent#getImageIterator
 * @function
 * @return {IterableIterator<ImageProperty>}
 */

/**
 * Returns a list of all image properties
 *
 * @name AbstractRecurringComponent#getImageList
 * @function
 * @return {ImageProperty[]}
 */

/**
 * Removes one image from this event / journal / task
 *
 * @name AbstractRecurringComponent#removeImage
 * @function
 * @param {ImageProperty} image
 */

/**
 * Removes all images from this event / journal / task
 *
 * @name AbstractRecurringComponent#clearAllImages
 * @function
 */
advertiseMultipleOccurrenceProperty(AbstractRecurringComponent.prototype, 'image')

/**
 * Returns an iterator over all request status
 *
 * @name AbstractRecurringComponent#getRequestStatusIterator
 * @function
 * @return {IterableIterator<RequestStatusProperty>}
 */

/**
 * Returns a list of all request status
 *
 * @name AbstractRecurringComponent#getRequestStatusList
 * @function
 * @return {RequestStatusProperty[]}
 */

/**
 * Removes one request status from this event / journal / task
 *
 * @name AbstractRecurringComponent#removeRequestStatus
 * @function
 * @param {RequestStatusProperty} requestStatus
 */

/**
 * Removes all request status from this event / journal / task
 *
 * @name AbstractRecurringComponent#clearAllRequestStatus
 * @function
 */
advertiseMultipleOccurrenceProperty(AbstractRecurringComponent.prototype, {
	name: 'requestStatus',
	pluralName: 'requestStatus',
	iCalendarName: 'REQUEST-STATUS',
})

/**
 * Returns an iterator of all alarms
 *
 * @name AbstractRecurringComponent#getAlarmIterator
 * @function
 * @return {IterableIterator<AlarmComponent>}
 */

/**
 * Returns a list of all alarms
 *
 * @name AbstractRecurringComponent#getAlarmList
 * @function
 * @return {AlarmComponent[]}
 */

/**
 * Removes an alarm from this event / journal / task
 *
 * @name AbstractRecurringComponent#removeAlarm
 * @function
 * @param {AlarmComponent} alarm
 */

/**
 * Removes all alarms from this event / journal / task
 *
 * @name AbstractRecurringComponent#clearAllAlarms
 * @function
 */
advertiseComponent(AbstractRecurringComponent.prototype, 'alarm')
