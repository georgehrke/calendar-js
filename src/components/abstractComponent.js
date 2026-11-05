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
import lockableTrait from '../traits/lockable.js'
import ExpectedICalJSError from '../errors/expectedICalJSError.js'
import { lc, uc, ucFirst } from '../helpers/stringHelper.js'
import { createComponent } from '../factories/icalFactory.js'
import { getConstructorForPropertyName } from '../properties/index.js'
import Property from '../properties/property.js'
import Parameter from '../parameters/parameter.js'
import observerTrait from '../traits/observer.js'
import ICAL from 'ical.js'

/**
 * @import AbstractValue from '../values/abstractValue.js'
 * @import CalendarComponent from './calendarComponent.js'
 */

/**
 * @class AbstractComponent
 */
export default class AbstractComponent extends observerTrait(lockableTrait(class {})) {
	/**
	 * Constructor
	 *
	 * @param {string} name - Name of component
	 * @param {Array<Property | [string, string | number | AbstractValue | string[] | number[] | AbstractValue[] | null]>} properties - Array of properties stored inside the component
	 * @param {AbstractComponent[]} components - Array of subcomponents stored inside this component
	 * @param {CalendarComponent|null} root - The root of this calendar document
	 * @param {AbstractComponent|null} parent - The parent component of this element
	 */
	constructor(name, properties = [], components = [], root = null, parent = null) {
		super()

		/**
		 * Name of component
		 *
		 * @type {string}
		 * @private
		 */
		this._name = uc(name)

		/**
		 * All properties in this component
		 *
		 * @type {Map<string, Property[]>}
		 * @private
		 */
		this._properties = new Map()

		/**
		 * All subcomponents of this component
		 *
		 * @type {Map<string, AbstractComponent[]>}
		 * @private
		 */
		this._components = new Map()

		/**
		 * Root node of ical document
		 *
		 * @type {CalendarComponent|null}
		 * @private
		 */
		this._root = root

		/**
		 * Parent node
		 *
		 * @type {AbstractComponent|null}
		 * @private
		 */
		this._parent = parent

		this._setPropertiesFromConstructor(properties)
		this._setComponentsFromConstructor(components)
	}

	/**
	 * Get the component's name
	 *
	 * @return {string}
	 */
	get name() {
		return this._name
	}

	/**
	 * Gets the root of this calendar-document
	 *
	 * @return {CalendarComponent}
	 */
	get root() {
		return this._root
	}

	/**
	 * Sets the root of this calendar-document
	 *
	 * @param {CalendarComponent} root The new root element
	 */
	set root(root) {
		this._modify()
		this._root = root

		for (const property of this.getPropertyIterator()) {
			property.root = root
		}

		for (const component of this.getComponentIterator()) {
			component.root = root
		}
	}

	/**
	 * Gets the parent component
	 *
	 * @return {AbstractComponent}
	 */
	get parent() {
		return this._parent
	}

	/**
	 * Sets the parent component
	 *
	 * @param {AbstractComponent} parent The new parent element
	 */
	set parent(parent) {
		this._modify()
		this._parent = parent
	}

	/**
	 * Gets the first property that matches the given propertyName
	 *
	 * @param {string} propertyName Name of the property to get
	 * @return {Property|null}
	 */
	getFirstProperty(propertyName) {
		if (!this._properties.has(uc(propertyName))) {
			return null
		}

		return this._properties.get(uc(propertyName))[0]
	}

	/**
	 * Gets the first value of the first property matching that name
	 *
	 * @param {string} propertyName Name of the property to get first value of
	 * @return {string | number | AbstractValue | string[] | number[] | AbstractValue[] | null}
	 */
	getFirstPropertyFirstValue(propertyName) {
		const property = this.getFirstProperty(propertyName)
		if (!property) {
			return null
		}

		return property.getFirstValue()
	}

	/**
	 * update a property if it exists,
	 * create a new one if it doesn't
	 *
	 * @param {string} propertyName Name of the property to update / create
	 * @param {string | number | AbstractValue | string[] | number[] | AbstractValue[] | null} value The value to set
	 */
	updatePropertyWithValue(propertyName, value) {
		this._modify()
		const property = this.getFirstProperty(propertyName)
		if (property) {
			property.value = value
		} else {
			const constructor = getConstructorForPropertyName(propertyName)
			const newProperty = new constructor(propertyName, value, [], this, this.root)
			this.addProperty(newProperty)
		}
	}

	/**
	 * Returns iterator for all properties of a given propertyName
	 * or if no propertyName was given over all available properties
	 *
	 * @yields {Property} A property matching the requested name
	 * @return {Generator<Property, void, undefined>}
	 *
	 * @param {string=} propertyName Name of the property to get an iterator for
	 */
	* getPropertyIterator(propertyName = null) {
		if (propertyName) {
			if (!this.hasProperty(propertyName)) {
				return
			}

			// this._properties.get() returns an array
			// [Symbol.iterator]() creates an iterator from that array
			yield* this._properties.get(uc(propertyName)).slice()[Symbol.iterator]()
		} else {
			for (const key of this._properties.keys()) {
				yield* this.getPropertyIterator(key)
			}
		}
	}

	/**
	 * Get all properties by name that match the given LANG parameter
	 *
	 * @param {string} propertyName The name of the property
	 * @param {string | null} lang The lang to query
	 * @yields {Property} A property matching the requested language
	 * @return {Generator<Property, void, undefined>}
	 *
	 * @private
	 */
	* _getAllOfPropertyByLang(propertyName, lang) {
		for (const property of this.getPropertyIterator(propertyName)) {
			// getParameterFirstValue will return null if language not set, so no language parameter will match lang=null
			if (property.getParameterFirstValue('LANGUAGE') === lang) {
				yield property
			}
		}
	}

	/**
	 * Get the first property by name that matches the given LANG parameter
	 *
	 * @param {string} propertyName The name of the property
	 * @param {string | null} lang The lang to query
	 * @return {Property|null}
	 * @private
	 */
	_getFirstOfPropertyByLang(propertyName, lang) {
		const iterator = this._getAllOfPropertyByLang(propertyName, lang)
		return iterator.next().value || null
	}

	/**
	 * Adds a property
	 *
	 * @param {Property} property The property to add
	 * @return {boolean}
	 */
	addProperty(property) {
		this._modify()

		property.root = this.root
		property.parent = this

		if (this._properties.has(property.name)) {
			const arr = this._properties.get(property.name)
			if (arr.indexOf(property) !== -1) {
				// If the property is already part of this component,
				// return false to indicate an error
				return false
			}

			arr.push(property)
		} else {
			this._properties.set(property.name, [property])
		}

		property.subscribe(() => this._notifySubscribers())

		return true
	}

	/**
	 * Checks if this component has a property of the given name
	 *
	 * @param {string} propertyName The name of the property
	 * @return {boolean}
	 */
	hasProperty(propertyName) {
		return this._properties.has(uc(propertyName))
	}

	/**
	 * Removes the given property from this component
	 *
	 * @param {Property} property The property to delete
	 * @return {boolean}
	 */
	deleteProperty(property) {
		this._modify()
		if (!this._properties.has(property.name)) {
			return false
		}

		const arr = this._properties.get(property.name)
		const index = arr.indexOf(property)
		if (index === -1) {
			return false
		}

		if (index !== -1 && arr.length === 1) {
			// If this is the last property of the given name,
			// remove the entire array from _properties
			// This is required for hasProperty to work properly
			this._properties.delete(property.name)
		} else {
			arr.splice(index, 1)
		}

		return true
	}

	/**
	 * Removes all properties of a given name
	 *
	 * @param {string} propertyName The name of the property
	 * @return {boolean}
	 */
	deleteAllProperties(propertyName) {
		this._modify()
		return this._properties.delete(uc(propertyName))
	}

	/**
	 * Gets the first component of a given name
	 *
	 * @param {string} componentName The name of the component
	 * @return {AbstractComponent|null}
	 */
	getFirstComponent(componentName) {
		if (!this.hasComponent(componentName)) {
			return null
		}

		return this._components.get(uc(componentName))[0]
	}

	/**
	 * Returns iterator for all components of a given componentName
	 * or if no componentName was given over all available components
	 *
	 * @yields {AbstractComponent} A component matching the requested name
	 * @return {Generator<AbstractComponent, void, undefined>}
	 *
	 * @param {string=} componentName The name of the component
	 */
	* getComponentIterator(componentName) {
		if (componentName) {
			if (!this.hasComponent(componentName)) {
				return
			}

			// this._components.get() returns an array
			// [Symbol.iterator]() creates an iterator from that array
			yield* this._components.get(uc(componentName)).slice()[Symbol.iterator]()
		} else {
			for (const key of this._components.keys()) {
				yield* this.getComponentIterator(key)
			}
		}
	}

	/**
	 * Adds a new component to this component
	 *
	 * @param {AbstractComponent} component The component to add
	 * @return {boolean}
	 */
	addComponent(component) {
		this._modify()

		component.root = this.root
		component.parent = this

		if (this._components.has(component.name)) {
			const arr = this._components.get(component.name)
			if (arr.indexOf(component) !== -1) {
				// If the property is already part of this component,
				// return false to indicate an error
				return false
			}

			arr.push(component)
		} else {
			this._components.set(component.name, [component])
		}

		component.subscribe(() => this._notifySubscribers())

		return true
	}

	/**
	 * Checks if this component has a component of the given name
	 *
	 * @param {string} componentName The name of the component
	 * @return {boolean}
	 */
	hasComponent(componentName) {
		return this._components.has(uc(componentName))
	}

	/**
	 * Removes the given component from this component
	 *
	 * @param {AbstractComponent} component The component to delete
	 * @return {boolean}
	 */
	deleteComponent(component) {
		this._modify()
		if (!this._components.has(component.name)) {
			return false
		}

		const arr = this._components.get(component.name)
		const index = arr.indexOf(component)
		if (index === -1) {
			return false
		}

		if (index !== -1 && arr.length === 1) {
			// If this is the last component of the given name,
			// remove the entire array from _components
			// This is required for hasComponent to work properly
			this._components.delete(component.name)
		} else {
			arr.splice(index, 1)
		}

		return true
	}

	/**
	 * Removes all components of a given name
	 *
	 * @param {string} componentName The name of the component
	 * @return {boolean}
	 */
	deleteAllComponents(componentName) {
		this._modify()
		return this._components.delete(uc(componentName))
	}

	/**
	 * Marks this parameter is immutable
	 * locks it against further modification
	 */
	lock() {
		super.lock()

		for (const property of this.getPropertyIterator()) {
			property.lock()
		}

		for (const component of this.getComponentIterator()) {
			component.lock()
		}
	}

	/**
	 * Marks this parameter as mutable
	 * allowing further modification
	 */
	unlock() {
		super.unlock()

		for (const property of this.getPropertyIterator()) {
			property.unlock()
		}

		for (const component of this.getComponentIterator()) {
			component.unlock()
		}
	}

	/**
	 * Creates a copy of this component
	 *
	 * @return {this}
	 */
	clone() {
		const properties = []
		for (const property of this.getPropertyIterator()) {
			properties.push(property.clone())
		}

		const components = []
		for (const component of this.getComponentIterator()) {
			components.push(component.clone())
		}

		return new this.constructor(this.name, properties, components, this.root, this.parent)
	}

	/**
	 * Adds properties from constructor to this._properties
	 *
	 * @param {Array<Property | [string, string | number | AbstractValue | string[] | number[] | AbstractValue[] | null]>} properties Array of properties
	 * @private
	 */
	_setPropertiesFromConstructor(properties) {
		for (let property of properties) {
			if (Array.isArray(property)) {
				const constructor = getConstructorForPropertyName(property[0])
				property = new constructor(property[0], property[1])
			}

			this.addProperty(property)
		}
	}

	/**
	 * Adds components from constructor to this._components
	 *
	 * @param {AbstractComponent[]} components Array of components
	 * @private
	 */
	_setComponentsFromConstructor(components) {
		for (const component of components) {
			this.addComponent(component)
		}
	}

	/**
	 * Creates a new Component based on an ical object
	 *
	 * @param {ICAL.Component} icalValue The ical.js component to initialise from
	 * @param {CalendarComponent=} root The root of the Calendar Document
	 * @param {AbstractComponent=} parent The parent element of this component
	 * @return {AbstractComponent}
	 */
	static fromICALJs(icalValue, root = null, parent = null) {
		if (!(icalValue instanceof ICAL.Component)) {
			throw new ExpectedICalJSError()
		}

		const name = icalValue.name
		const newComponent = new this(name, [], [], root, parent)

		for (const icalProp of icalValue.getAllProperties()) {
			const constructor = getConstructorForPropertyName(icalProp.name)
			const property = constructor.fromICALJs(icalProp, root, newComponent)
			newComponent.addProperty(property)
		}

		for (const icalComp of icalValue.getAllSubcomponents()) {
			const constructor = this._getConstructorForComponentName(icalComp.name)
			const component = constructor.fromICALJs(icalComp, root, newComponent)
			newComponent.addComponent(component)
		}

		return newComponent
	}

	/**
	 * Gets a constructor for a give component name
	 *
	 * @param {string} componentName The name of the component
	 * @return {typeof AbstractComponent}
	 * @protected
	 */
	static _getConstructorForComponentName(componentName) {
		void componentName
		return AbstractComponent
	}

	/**
	 * turns this Component into an ICAL.js component
	 *
	 * @return {ICAL.Component}
	 */
	toICALJs() {
		const component = createComponent(lc(this.name))

		for (const prop of this.getPropertyIterator()) {
			component.addProperty(prop.toICALJs())
		}
		for (const comp of this.getComponentIterator()) {
			component.addSubcomponent(comp.toICALJs())
		}

		return component
	}
}

/**
 * Advertise properties that may at most occur once
 *
 * Properties, which may at most occur once, get a simple getter and setter
 *
 * @param {object} prototype The object's prototype
 * @param {object} options The options for advertising properties
 * @param {boolean} advertiseValueOnly Whether to advertise the value only or the entire property
 */
export function advertiseSingleOccurrenceProperty(prototype, options, advertiseValueOnly = true) {
	void advertiseValueOnly
	options = getDefaultOncePropConfig(options)

	Object.defineProperty(prototype, options.name, {
		get() {
			const value = this.getFirstPropertyFirstValue(options.iCalendarName)

			if (!value) {
				return options.defaultValue
			} else {
				if (Array.isArray(options.allowedValues) && !options.allowedValues.includes(value)) {
					return options.unknownValue
				}

				return value
			}
		},
		set(value) {
			this._modify()

			if (value === null) {
				this.deleteAllProperties(options.iCalendarName)
				return
			}

			if (Array.isArray(options.allowedValues) && !options.allowedValues.includes(value)) {
				throw new TypeError('Illegal value')
			}
			this.updatePropertyWithValue(options.iCalendarName, value)
		},
	})
}

/**
 * Advertise properties that may occur more than once
 *
 * Properties, which may occur more than once, won't get simple getter / setter,
 * but rather a more advanced set of get{name}Iterator, get{name}List, add{name},
 * remove{name} and clearAll{name} methods
 *
 * @param {object} prototype The object's prototype
 * @param {object} options The options for advertising properties
 */
export function advertiseMultipleOccurrenceProperty(prototype, options) {
	options = getDefaultMultiplePropConfig(options)

	prototype['get' + ucFirst(options.name) + 'Iterator'] = function* () {
		yield* this.getPropertyIterator(options.iCalendarName)
	}

	prototype['get' + ucFirst(options.name) + 'List'] = function() {
		return Array.from(this['get' + ucFirst(options.name) + 'Iterator']())
	}

	prototype['remove' + ucFirst(options.name)] = function(property) {
		this.deleteProperty(property)
	}

	prototype['clearAll' + ucFirst(options.pluralName)] = function() {
		this.deleteAllProperties(options.iCalendarName)
	}
}

/**
 * advertises a multi-value string property enabling simple access by language
 * This is used for:
 * - CATEGORIES
 * - RESOURCES
 *
 * @param {object} prototype The object's prototype
 * @param {object} options The options for advertising properties
 */
export function advertiseMultiValueStringPropertySeparatedByLang(prototype, options) {
	options = getDefaultMultiplePropConfig(options)

	prototype['get' + ucFirst(options.name) + 'Iterator'] = function* (lang = null) {
		for (const property of this._getAllOfPropertyByLang(options.iCalendarName, lang)) {
			yield* property.getValueIterator()
		}
	}

	prototype['get' + ucFirst(options.name) + 'List'] = function(lang = null) {
		return Array.from(this['get' + ucFirst(options.name) + 'Iterator'](lang))
	}

	prototype['add' + ucFirst(options.name)] = function(value, lang = null) {
		const property = this._getFirstOfPropertyByLang(options.iCalendarName, lang)
		if (property) {
			property.addValue(value)
		} else {
			const newProperty = new Property(options.iCalendarName, [value])
			if (lang) {
				const languageParameter = new Parameter('LANGUAGE', lang)
				newProperty.setParameter(languageParameter)
			}

			this.addProperty(newProperty)
		}
	}

	prototype['remove' + ucFirst(options.name)] = function(value, lang = null) {
		for (const property of this._getAllOfPropertyByLang(options.iCalendarName, lang)) {
			if (property.isMultiValue() && property.hasValue(value)) {
				if (property.value.length === 1) {
					this.deleteProperty(property)
					return true
				}

				property.removeValue(value)
				return true
			}
		}

		return false
	}

	prototype['clearAll' + ucFirst(options.pluralName)] = function(lang = null) {
		for (const property of this._getAllOfPropertyByLang(options.iCalendarName, lang)) {
			this.deleteProperty(property)
		}
	}
}

/**
 * advertise a component
 *
 * @param {object} prototype The object's prototype
 * @param {object} options The options for advertising components
 */
export function advertiseComponent(prototype, options) {
	options = getDefaultMultipleCompConfig(options)

	prototype['get' + ucFirst(options.name) + 'Iterator'] = function* () {
		yield* this.getComponentIterator(options.iCalendarName)
	}

	prototype['get' + ucFirst(options.name) + 'List'] = function() {
		return Array.from(this['get' + ucFirst(options.name) + 'Iterator']())
	}

	prototype['remove' + ucFirst(options.name)] = function(component) {
		this.deleteComponent(component)
	}

	prototype['clearAll' + ucFirst(options.pluralName)] = function() {
		this.deleteAllComponents(options.iCalendarName)
	}
}

/**
 * Fill up the options object for advertiseProperty
 *
 * @param {object | string} options The options object
 * @param {string} options.name Advertised name of the property
 * @param {string=} options.iCalendarName The iCalendar name of the property
 * @param {string[]=} options.allowedValues A list of allowed values
 * @param {string | number=} options.defaultValue The default value if unset
 * @param {string | number=} options.unknownValue The fallback value if unknown value
 * @return {object}
 */
function getDefaultOncePropConfig(options) {
	if (typeof options === 'string') {
		options = {
			name: options,
		}
	}

	return { iCalendarName: uc(options.name), pluralName: options.name + 's', allowedValues: null, defaultValue: null, unknownValue: null, ...options }
}

/**
 * Fill up the options object for advertiseProperty
 *
 * @param {object | string} options The options object
 * @param {string} options.name Advertised name of property
 * @param {string=} options.iCalendarName The iCalendar name of the property
 * @param {boolean=} options.customAddMethod Whether or not to use a custom add method
 * @return {object}
 */
function getDefaultMultiplePropConfig(options) {
	if (typeof options === 'string') {
		options = {
			name: options,
		}
	}

	return { iCalendarName: uc(options.name), pluralName: options.name + 's', ...options }
}

/**
 * Fill up the options object for advertiseComponent
 *
 * @param {object | string} options Options destructuring object
 * @param {string} options.name Advertised name of component
 * @param {string=} options.iCalendarName The iCalendar name of the component
 * @param {boolean=} options.customAddMethod Whether or not to use a custom add method
 * @return {object}
 */
function getDefaultMultipleCompConfig(options) {
	if (typeof options === 'string') {
		options = {
			name: options,
		}
	}

	return { iCalendarName: 'V' + uc(options.name), pluralName: options.name + 's', ...options }
}
