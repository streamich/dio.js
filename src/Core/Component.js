/**
 * @constructor
 */
function Component (props, context) {
	this.refs = null
	this.state = null
	this.props = props
	this.context = context
	this.children = null
}
/**
 * @type {Object}
 */
var descriptors = {forceUpdate: {value: forceUpdate}, setState: {value: setState}}

/**
 * @type {Object}
 */
Component.prototype = Object.create(null, merge({render: {value: noop}}, descriptors))

/**
 * @param {(Object|function)} state
 * @param {function?} callback
 */
function setState (state, callback) {
	enqueueState(this.children, this, state, callback)
}

/**
 * @param {function} callback
 */
function forceUpdate (callback) {
	enqueueUpdate(this.children, this, callback, 0)
}

/**
 * @param {Element} element
 * @return {number}
 */
function componentMount (element) {
	var owner = element.type
	var prototype = owner.prototype
	var instance = null
	var children = null

	if (prototype && prototype.render) {
		if (!prototype.setState)
			Object.defineProperties(prototype, descriptors)

		instance = owner = getChildInstance(element)
	} else {
		instance = new Component()
		instance.render = owner
	}

	instance.refs = {}
	instance.props = element.props
	instance.context = element.context
	instance.children = element

	element.owner = owner
	element.instance = instance

	if (owner[LifecycleInitialState])
		instance.state = getInitialState(element, instance, lifecycleGet(element, LifecycleInitialState))
	else if (!instance.state)
		instance.state = {}
	
	if (owner[LifecycleChildContext])
		element.context = getChildContext(element)

	children = getChildElement(element)
	children.context = element.context

	return element.children = children
}

/**
 * @param {Element} element
 * @param {Element} snapshot
 * @param {number} signature
 */
function componentUpdate (element, snapshot, signature) {
	if (element.sync < PriorityHigh)
		return

	element.sync = PriorityTask

	var instance = element.instance
	var owner = element.owner
	var context = instance.context
	var prevState = instance.state
	var nextState = signature > 1 ? assign({}, prevState, element.state) : prevState
	var prevProps = element.props
	var nextProps = snapshot.props

	if (owner[LifecycleChildContext])
		merge(element.context, getChildContext(element))

	switch (signature) {
		case 0:
			break
		case 1:
			if (owner[LifecycleWillReceiveProps])
				lifecycleUpdate(element, LifecycleWillReceiveProps, nextProps, nextState, context)
		case 2:
			if (owner[LifecycleShouldUpdate])
				if (lifecycleUpdate(element, LifecycleShouldUpdate, nextProps, nextState, context) === false)
					return
	}

	if (owner[LifecycleWillUpdate])
		lifecycleUpdate(element, LifecycleWillUpdate, nextProps, nextState, context)

	instance.state = nextState
	instance.props = nextProps

	patchElement(element.children, getChildElement(element))

	if (owner[LifecycleDidUpdate])
		lifecycleUpdate(element, LifecycleDidUpdate, prevProps, prevState, context)

	if (element.ref !== snapshot.ref)
		commitReference(element, snapshot.ref, 2)

	element.sync = PriorityHigh
}

/**
 * @param {Element} host
 * @param {List} children
 * @param {Element} parent
 * @param {number} signature
 * @param {number} resolve
 */
function componentUnmount (host, children, parent, signature, resolve) {
	if (resolve > 0 && host.owner[LifecycleWillUnmount])
		if (host.state = lifecycleMount(host, LifecycleWillUnmount))
			if (host.state.constructor === Promise)
				return void host.state.then(function () {
					host.state = componentUnmount(host, children, element, parent, signature, 0)
				})

	commitUnmount(children, parent, signature)
}

/**
 * @param {(Component|Node)?} value
 * @param {*} key
 * @param {Element} element
 */
function componentReference (value, key, element) {
	if (this.refs) {
		if (key !== element.ref)
			delete this.refs[element.ref]

		this.refs[key] = element.instance
	}
}

/**
 * @param {Element} Element
 * @param {Component} instance
 * @param {(Object|function)} state
 * @param {function?} callback
 */
function enqueueState (element, instance, state, callback) {
	if (state)
		switch (state.constructor) {
			case Promise:
				return enqueuePending(element, instance, state, callback)
			case Function:
				return enqueueState(element, instance, enqueueCallback(element, instance, state), callback)
			default:
				element.state = element.sync === PriorityHigh ? state : assign({}, element.state, state)

				enqueueUpdate(element, instance, callback, 2)
		}
}

/**
 * @param {Element} Element
 * @param {Component} instance
 * @param {function} callback
 */
function enqueueCallback (element, instance, callback) {
	try {
		return callback.call(instance, instance.state)
	} catch (e) {
		errorBoundary(element, e, LifecycleCallback+':'+getDisplayName(callback))
	}
}

/**
 * @param {Element} element
 * @param {Component} instance
 * @param {Promise} state
 * @param {function?} callback
 */
function enqueuePending (element, instance, state, callback) {
	state.then(function (value) {
		setImmediate(function () {
			enqueueState(element, instance, value, callback)
		})
	})
}

/**
 * @param {Element} element
 * @param {Component} instance
 * @param {function=} callback
 * @param {number} signature
 */
function enqueueUpdate (element, instance, callback, signature) {
	if (element == null)
		return setImmediate(function () {
			enqueueUpdate(getHostChildren(instance), instance, callback, signature)
		})

	if (element.sync < PriorityHigh)
		return setImmediate(function () {
			enqueueUpdate(element, instance, callback, signature)
		})

	if (!element.DOM)
		return

	componentUpdate(element, element, signature)

	if (typeof callback === 'function')
		enqueueCallback(element, instance, callback)
}

/**
 * @param {Element} element
 * @param {(Component|Element)} instance
 * @param {Object} state
 * @return {Object}
 */
function getInitialState (element, instance, state) {	
	if (state)
		switch (state.constructor) {
			case Promise:
				enqueuePending(element, instance, state)
			case Boolean:
				break
			default:
				return state
		}

	return instance.state || {}
}

/**
 * @param {Element} element
 * @return {Component}
 */
function getChildInstance (element) {
	try {
		return new element.type(element.props, element.context)
	} catch (e) {
		return errorBoundary(element.host, e, LifecycleConstructor), new Component()
	}
}

/**
 * @param {Element} element
 * @return {Element}
 */
function getChildElement (element) {
	try {
		return commitElement(
			element.instance.render(element.instance.props, element.instance.state, element.context)
		)
	} catch (e) {
		return errorBoundary(element, e, LifecycleRender)
	}
}

/**
 * @param {Element} element
 * @return {Object?}
 */
function getChildContext (element) {
	if (element.owner[LifecycleChildContext])
		return lifecycleGet(element, LifecycleChildContext) || element.context || {}
	else
		return element.context || {}
}

/**
 * @param {Element} element
 * @return {Element}
 */
function getHostElement (element) {
	return element.flag !== ElementComponent ? element : getHostElement(element.children)
}

/**
 * @param  {(Element|Component)} element
 * @return {Element?}
 */
function getHostChildren (element) {
	return isValidElement(element) ? element : element.children	
}

/**
 * @param {(function|string)} subject
 * @return {string}
 */
function getDisplayName (subject) {
	switch (typeof subject) {
		case 'function':
			return getDisplayName(subject.displayName || subject.name)
		case 'string':
			if (subject)
				return subject
		default:
			return 'anonymous'
	}
}

/**
 * @param {Element} element
 * @param {(Object|function)} defaultProps
 * @param {Object} props
 */
function getDefaultProps (element, defaultProps, props) {
	if (typeof defaultProps !== 'function')
		return assign({}, defaultProps, props)

	Object.defineProperty(element.type, 'defaultProps', {
		value: getDefaultProps(element, lifecycleCallback(element, defaultProps), props)
	})

	return element.type.defaultProps
}
