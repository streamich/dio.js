/*! DIO 8.0.0 @license MIT */

module.exports = function (exports, Element, mountComponent, commitElement, getComponentElement, invokeErrorBoundary) {
	
	'use strict'
	
	var SharedElementPromise = -3
	var SharedElementFragment = -2
	var SharedElementPortal = -1
	var SharedElementEmpty = 0
	var SharedElementComponent = 1
	var SharedElementNode = 2
	var SharedElementText = 3
	
	var SharedReferenceRemove = -1
	var SharedReferenceAssign = 0
	var SharedReferenceDispatch = 1
	var SharedReferenceReplace = 2
	
	var SharedComponentForceUpdate = 0
	var SharedComponentPropsUpdate = 1
	var SharedComponentStateUpdate = 2
	
	var SharedMountQuery = 0
	var SharedMountCommit = 1
	var SharedMountRemove = 2
	var SharedMountAppend = 3
	var SharedMountInsert = 4
	
	var SharedWorkMounting = -1
	var SharedWorkUpdating = 0
	var SharedWorkIdle = 1
	
	var SharedErrorPassive = -2
	var SharedErrorActive = -1
	
	var SharedPropsMount = 1
	var SharedPropsUpdate = 2
	
	var SharedSiblingPrevious = 'prev'
	var SharedSiblingNext = 'next'
	
	var SharedSiteCallback = 'callback'
	var SharedSiteRender = 'render'
	var SharedSiteElement = 'element'
	var SharedSiteConstructor = 'constructor'
	var SharedSiteAsync = 'async'
	var SharedSiteSetState = 'setState'
	var SharedSiteFindDOMNode = 'findDOMNode'
	
	var SharedTypeKey = '.'
	var SharedTypeText = '#text'
	var SharedTypeFragment = '#fragment'
	
	var SharedComponentWillMount = 'componentWillMount'
	var SharedComponentDidMount = 'componentDidMount'
	var SharedComponentWillReceiveProps = 'componentWillReceiveProps'
	var SharedComponentShouldUpdate = 'shouldComponentUpdate'
	var SharedComponentWillUpdate = 'componentWillUpdate'
	var SharedComponentDidUpdate = 'componentDidUpdate'
	var SharedComponentWillUnmount = 'componentWillUnmount'
	var SharedComponentDidCatch = 'componentDidCatch'
	var SharedGetChildContext = 'getChildContext'
	var SharedGetInitialState = 'getInitialState'
	
	var SharedDOMObject = {target: null}
	var SharedElementObject = {active: false, DOM: null}
	
	var Readable = require('stream').Readable
	var RegExpEscape = /[<>&"']/g
	var RegExpDashCase = /([a-zA-Z])(?=[A-Z])/g
	var RegExpVendor = /^(ms|webkit|moz)/
	
	Object.defineProperties(Element.prototype, {
		toJSON: {value: toJSON},
		toString: {value: toString},
		toStream: {value: toStream}
	})
	
	exports.renderToString = renderToString
	exports.renderToStream = renderToStream
	
	/**
	 * @return {void}
	 */
	function noop () {}
	
	/**
	 * @param {*} value
	 * @return {string}
	 */
	function getTextEscape (value) {
		return (value+'').replace(RegExpEscape, getTextEncode)
	}
	
	/**
	 * @param {string} character
	 * @return {string}
	 */
	function getTextEncode (character) {
		switch (character) {
			case '<':
				return '&lt;'
			case '>':
				return '&gt;'
			case '"':
				return '&quot;'
			case "'":
				return '&#x27;'
			case '&':
				return '&amp;'
			default:
				return character
		}
	}
	
	/**
	 * @param {string}
	 */
	function getElementType (type) {
		switch ((type+'').toLowerCase()) {
			case 'area':
			case 'base':
			case 'br':
			case 'meta':
			case 'source':
			case 'keygen':
			case 'img':
			case 'col':
			case 'embed':
			case 'wbr':
			case 'track':
			case 'param':
			case 'link':
			case 'input':
			case 'hr':
			case '!doctype':
				return SharedElementEmpty
			default:
				return SharedElementNode
		}
	}
	
	/**
	 * @param {Response} response
	 */
	function setHeader (response) {
		if (typeof response.getHeader === 'function' && !response.getHeader('Content-Type'))
			response.setHeader('Content-Type', 'text/html')
	}
	
	/**
	 * @return {string}
	 */
	function toString () {
		return getStringElement(this, null)
	}
	
	/**
	 * @param {Element} element
	 * @param {Element?} host
	 * @return {string}
	 */
	function getStringElement (element, host) {
		switch (element.host = host, element.id) {
			case SharedElementText:
				return getTextEscape(element.children)
			case SharedElementComponent:
				return getStringElement(mountComponent(element), element)
		}
	
		var type = element.type
		var children = element.children
		var length = children.length
		var output = element.id === SharedElementNode ? '<' + type + getStringProps(element, element.props) + '>' : ''
		
		if (getElementType(type) === SharedElementEmpty)
			return output
	
		if (!element.DOM)
			while (length-- > 0)
				output += getStringElement(children = children.next, host)
		else (output += element.DOM)
			element.DOM = null
	
		if (element.id === SharedElementNode)
			return output + '</' + type + '>'
		else
			return output
	}
	
	/**
	 * @param {Element} element
	 * @param  {Object} props
	 * @return {String}
	 */
	function getStringProps (element, props) {
		var output = ''
	
		for (var key in props) {
			var value = props[key]
			
			switch (key) {
				case 'dangerouslySetInnerHTML':
					if (value && value.__html)
						value = value.__html
					else
						break
				case 'innerHTML':
					element.DOM = value + ''
					break
				case 'defaultValue':
					if (!props.value)
						output += ' value="' + getTextEscape(value) + '"'
				case 'key':
				case 'ref':
				case 'children':
					break
				case 'style':
					output += ' style="' + (typeof value === 'string' ? value : getStringStyle(value)) + '"'				
					break
				case 'className':
					key = 'class'
				default:
					switch (typeof value) {
						case 'boolean':
							if (value === false)
								break
						case 'string':
						case 'number':
							output += ' ' + key + (value !== true ? '="'+getTextEscape(value) + '"' : '')
					}
			}
		}
	
		return output
	}
	
	/**
	 * @param {Object} object
	 * @return {string}
	 */
	function getStringStyle (object) {
		var output = ''
	
		for (var key in object) {
			var value = object[key]
	
			if (key !== key.toLowerCase())
				key = key.replace(RegExpDashCase, '$1-').replace(RegExpVendor, '-$1').toLowerCase()
	
			output += key + ':' + value + ';'
		}
	
		return output
	}
	
	/**
	 * @return {Object}
	 */
	function toJSON () {
		var element = this
		
		switch (element.id) {
			case SharedElementText:
				return element.children
			case SharedElementComponent:
				return mountComponent(element).toJSON()
		}
	
		var output = {type: element.type, props: element.props, children: []}
		var children = element.children
		var length = children.length
	
		if (element.id < SharedElementEmpty)
			children = (length--, children.next)
	
		while (length-- > 0)
			output.children.push((children = children.next).toJSON())
	
		if (element.id < SharedElementEmpty)
			if (output = output.children)
				output.pop()
	
		return output
	}
	
	/**
	 * @param {function=}
	 * @return {Stream}
	 */
	function toStream (callback) {
		var readable = new Stream(this)
	
		if (typeof callback === 'function')
			readable.on('end', callback)
	
		return readable
	}
	
	/**
	 * @constructor
	 * @param {Element}
	 */
	function Stream (element) {
		this.host = null
		this.stack = [element]
	
		Readable.call(this)
	}
	/**
	 * @type {Object}
	 */
	Stream.prototype = Object.create(Readable.prototype, {_read: {value: getStreamElement}})
	
	/**
	 * @return {void}
	 */
	function getStreamElement () {
		if (this.stack.length > 0)
			readStreamElement(this.stack.pop(), this.host, this.stack, this)
		else
			this.push(null)
	}
	
	/**
	 * @param {Element} element
	 * @param {Element} host
	 * @param {Array} stack
	 * @param {Readable} readable
	 * @param {number} id
	 * @param {number} signature
	 */
	function pendingStreamElement (element, host, stack, readable, id, signature) {
		return function (value) {
			var children
	
			if (signature !== SharedErrorActive)
				children = invokeErrorBoundary(element, value, SharedSiteAsync+':'+SharedSiteSetState, SharedErrorActive)
			else if (id !== SharedElementComponent)
				children = commitElement(value)
			else
				children = getComponentElement(element, (element.instance.state = value || {}, element.instance))
	
			readStreamElement(children, host, stack, readable)
		}
	}
	
	/**
	 * @param {Element} element
	 * @param {Element?} host
	 * @param {Array} stack
	 * @param {Readable} readable
	 */
	function readStreamElement (element, host, stack, readable) {
		var output = ''
		var children = element.children
	
		switch (element.host = host, element.id) {
			case SharedElementComponent:
				children = mountComponent(readable.host = element)
	
				if (!element.state || element.state.constructor !== Promise)
					return readStreamElement(children, element, stack, readable)
	
				return void element.state
					.then(pendingStreamElement(element, element, stack, readable, SharedElementComponent, SharedErrorActive))
					.catch(pendingStreamElement(element, element, stack, readable, SharedElementComponent, SharedErrorPassive))
			case SharedElementPromise:
				return void element.type
					.then(pendingStreamElement(element, host, stack, readable, SharedElementPromise, SharedErrorActive))
					.catch(pendingStreamElement(element, host, stack, readable, SharedElementPromise, SharedErrorPassive))
			case SharedElementText:
				return writeStreamElement(children, readable)
			case SharedElementNode:
				if (element.DOM)
					return element.DOM = writeStreamElement(element.DOM, readable)
	
				output += '<' + element.type + getStringProps(element, element.props) + '>'
				
				if (getElementType(element.type) === SharedElementEmpty)
					return writeStreamElement(output, readable)
				
				if (element.DOM)
					output += element.DOM
	
				element.DOM = '</' + element.type + '>'
				stack.push(element)
			default:
				var length = children.length
	
				while (length-- > 0)
					stack.push(children = children.prev)
		}
	
		writeStreamElement(output, readable)
	}
	
	/**
	 * @param {string} output
	 * @param {Readable} readable
	 */
	function writeStreamElement (output, readable) {
		readable.push(output)
	
		if (!output)
			readable.read(0)
	}
	
	/**
	 * @param {*} subject
	 * @param {Writable?} target
	 * @param {function=} callback
	 */
	function renderToString (subject, target, callback) {
		if (!target || !target.writable)
			return commitElement(subject).toString()
		else
			setHeader(target)
		
		return target.end(commitElement(subject).toString(), 'utf8', callback)
	}
	
	/**
	 * @param {*} subject
	 * @param {Writable?} target
	 * @param {function=} callback
	 */
	function renderToStream (subject, target, callback) {
		if (!target || !target.writable)
			return commitElement(subject).toStream()
		else
			setHeader(target)
		
		return commitElement(subject).toStream(callback).pipe(target)
	}
}
