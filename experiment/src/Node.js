/**
 * Extract Component Tree
 *
 * @param  {Tree} older
 * @return {Tree}
 */
function extract (older) {
	var type = older.type;
	var props = older.props;
	var children = older.children;
	var length = children.length;
	var group = older.group;
	var defaults = type.defaultProps;
	var types = type.propTypes;
	var owner;
	var newer;
	var proto;
	var UUID;

	if (props === object) {
		props = {};
	}
	if (length !== 0) {
		props.children = children;
	}

	if (defaults !== void 0) {
		merge(getInitialStatic(type, defaults, 'defaultProps', props), props);
	}
	if (types !== void 0) {
		getInitialStatic(type, types, 'propTypes', props);
	}

	if (group > 1) {
		UUID = (proto = type.prototype).UUID;

		if (UUID === 2) {
			owner = new type(props);
		} else {
			if (UUID !== 1) {
				extendClass(type, proto);
			}
			owner = new type(props);
			Component.call(owner, props);
		}

		older.owner = owner;

		if (owner._async === 0) {
			older.async = 1;
			newer = renderBoundary(older, group);
			older.async = 0;
		}
		newer = shape(newer, owner._older = older, true);
	} else {
		newer = shape(renderBoundary(older, group), older, true);
	}

	older.tag = newer.tag;
	older.flag = newer.flag;
	older.node = newer.node;
	older.attrs = newer.attrs;
	older.xmlns = newer.xmlns;
	older.children = newer.children;

	return newer;
}

/**
 * Shape Tree
 *
 * @param  {Any} value
 * @param  {Tree?} older
 * @param  {Boolean} abstract
 * @return {Tree}
 */
function shape (value, older, abstract) {
	var newer = (value !== null && value !== void 0) ? value : text('');

	if (newer.group === void 0) {
		switch (typeof newer) {
			case 'function': {
				newer = element(newer, older === null ? null : older.props);
				break;
			}
			case 'string':
			case 'number':
			case 'boolean': {
				newer = text(newer);
				break;
			}
			case 'object': {
				switch (newer.constructor) {
					case Promise: return older === null ? text('') : resolve(older, newer);
					case Array: newer = fragment(newer); break;
					case Date: newer = text(newer+''); break;
					case Object: newer = text(''); break;
					default: {
						newer = newer.next !== void 0 && older !== null ? coroutine(older, newer) : text('');
					}
				}
				break;
			}
		}
	}

	return newer.group > 0 && abstract === true ? fragment(newer) : newer;
}

/**
 * Resolve Tree
 *
 * @param {Tree} older
 * @param {Promise} pending
 */
function resolve (older, pending) {
	older.async = 2;

	pending.then(function (value) {
		var newer = value;
		if (older.node === null) {
			return;
		}

		older.async = 0;
		newer = shape(newer, older, true);

		if (older.tag !== newer.tag) {
			exchange(older, newer, older, false);
		} else {
			patch(older, newer, 0);
		}
	});

	return older.node !== null ? older : text('');;
}

/**
 * Create Coroutine
 *
 * @param  {Tree} older
 * @param  {Generator} generator
 * @return {Tree}
 */
function coroutine (older, generator) {
	var previous;
	var current;

	older.yield = function () {
		var supply = generator.next(previous);
		var next = supply.value;

		if (supply.done === true) {
			current = shape(next !== void 0 && next !== null ? next : previous, older, true);
		} else {
			current = shape(next, older, true);
		}
		return previous = current;
	};

	return shape(renderBoundary(older, older.group), older, true);
}

/**
 * Exchange Tree
 *
 * @param {Tree} newer
 * @param {Tree} older
 * @param {Boolean} deep
 */
function exchange (older, newer, deep) {
	if (older.flag !== 1 && older.children.length > 0) {
		unmount(older, false);
	}

	swap(older, newer, older.host);
	copy(older, newer, deep);
}

/**
 * Unmount Children
 *
 * @param  {Tree} older
 * @param  {Boolean} release
 */
function unmount (older, release) {
	var children = older.children;
	var length = children.length;

	if (older.flag === 1 || length === 0) {
		return;
	}

	for (var i = 0, child; i < length; i++) {
		if ((child = children[i]).group > 0 && child.owner.componentWillUnmount !== void 0) {
			mountBoundary(child.owner, 2);
		}

		unmount(child, true);
	}

	if (release === true) {
		older.parent = null;
		older.owner = null;
		older.node = null;
		older.host = null;
	}
}

/**
 * Fill Children
 *
 * @param {Tree} older
 * @param {Tree} newer
 * @param {Number} length
 */
function fill (older, newer, length) {
	var children = newer.children;
	var host = older.host;

	for (var i = 0, child; i < length; i++) {
		create(child = children[i], host, older, empty, 1, null);
	}
	older.children = children;
}
