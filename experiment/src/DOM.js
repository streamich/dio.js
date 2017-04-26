/**
 * Generate
 *
 * @param  {Tree} newer
 * @param  {Tree} host
 * @param  {String?} xmlns
 * @return {Node}
 */
function generate (newer, host, xmlns) {
	try {
		if (xmlns === null) {
			return document.createElement(newer.tag);
		} else {
			return document.createElementNS(newer.xmlns === xmlns, newer.tag);
		}
	} catch (err) {
		return errorBoundary(err, host.owner, newer.flag = 3, 0);
	}
}

/**
 * Create
 *
 * @param  {Tree} newer
 * @param  {Tree?} _host
 * @param  {Tree} parent
 * @param  {Tree} sibling
 * @param  {Number} action
 * @param  {String?} _xmlns
 */
function create (older, _host, parent, sibling, action, _xmlns) {
	var host = _host;
	var xmlns = _xmlns;
	var group = older.group;
	var flag = older.flag;
	var type = 2;
	var owner;
	var node;
	var children;
	var length;
	var newer;

 	// preserve last namespace context among children
 	if (flag !== 1 && older.xmlns !== null) {
 		xmlns = older.xmlns;
 	}

 	if (group > 0) {
 		if (group > 1) {
 			host = older.host = older;
 		}

 		newer = extract(older);

 		flag = newer.flag;
 		owner = older.owner;
 	} else if (host !== null) {
		older.host = host;
 	}

 	if (type === 2) {
 		if (flag === 1) {
 			node = older.node = document.createTextNode((type = 1, older.children));
 		} else {
 			node = generate(older, host, xmlns);

 			if (older.flag === 3) {
 				create(node, host, older, sibling, action, xmlns);
 				copy(older, node, false);

 				type = 0;
 			} else {
 				older.node = node;
 				children = older.children;
 				length = children.length;

 				if (length > 0) {
 					for (var i = 0, child; i < length; i++) {
 						// hoisted
 						if ((child = children[i]).node !== null) {
 							copy(child = children[i] = new Tree(child.flag), child, false);
 						}
 						create(child, host, older, sibling, 1, xmlns);
 					}
 				}
 			}
 		}
 	}

 	if (type > 0) {
 		if (group > 0 && owner.componentWillMount !== void 0) {
 			mountBoundary(owner, 0);
 		}

 		older.parent = parent;

 		switch (action) {
 			case 1: {
 				parent.node.appendChild(node);
 				break;
 			}
 			case 2: {
 				parent.node.insertBefore(node, sibling.node);
 				break;
 			}
 			case 3: {
 				if (sibling.group > 0 && sibling.owner.componentWillUnmount !== void 0) {
 					mountBoundary(sibling.owner, 2);
 				}
 				parent.node.replaceChild(node, sibling.node);
 				break;
 			}
 		}

 		if (type !== 1) {
 			attribute(older, xmlns);
 		}

 		if (group > 0 && owner.componentDidMount !== void 0) {
 			mountBoundary(owner, 1);
 		}
 	}
}

/**
 * Swap
 *
 * @param  {Tree} older
 * @param  {Tree} newer
 */
function swap (older, newer) {
	create(newer, older.host, older.parent, older, 3, null);
}

/**
 * Move
 *
 * @param {Tree} older
 * @param {Tree} sibling
 * @param {Tree} parent
 */
function move (older, sibling, parent) {
	parent.node.insertBefore(older.node, sibling.node);
}

/**
 * Append
 *
 * @param {Tree} older
 * @param {Tree} parent
 */
function append (older, parent) {
	parent.node.appendChild(older.node);
}

/**
 * Remove
 *
 * @param {Tree} older
 * @param {Tree} parent
 */
function remove (older, parent) {
	if (older.group > 0 && older.owner.componentWillUnmount !== void 0) {
		mountBoundary(older.owner, 2);
	}

	parent.node.removeChild(older.node);
}

/**
 * Clear
 *
 * @param {Tree} older
 */
function clear (older) {
	older.node.textContent = null;
}

/**
 * Text
 *
 * @param {Tree} older
 * @param {String|Number} value
 */
function content (older, value) {
	older.node.nodeValue = value;
}

/**
 * Attribute
 *
 * @param {Number} type
 * @param {String} name
 * @param {Any} value
 * @param {String?} xmlns
 * @param {Tree} newer
 */
function assign (type, name, value, xmlns, newer) {
	var node = newer.node;

	switch (type) {
		case 0: {
			if (value !== null && value !== void 0 && value !== false) {
				node.setAttribute(name, (value === true ? '' : value));
			} else {
				node.removeAttribute(name);
			}
			break;
		}
		case 1: {
			if (xmlns === null) {
				node.className = value;
			} else {
				assign(0, 'class', value, xmlns, node);
			}
			break;
		}
		case 3: {
			if (node[name] === void 0) {
				node.style.setProperty(name, value);
			} else if (isNaN(Number(value)) === true) {
				assign(0, name, value, xmlns, node);
			} else {
				assign(6, name, value, xmlns, node);
			}
			break;
		}
		case 4: {
			node.setAttributeNS('http://www.w3.org/1999/xlink', 'href', value);
			break;
		}
		case 5:
		case 6: {
			node[name] = value;
			break;
		}
		case 10: {
			node.innerHTML = value;
			break;
		}
	}
}

/**
 * Style
 *
 * @param {Tree} older
 * @param {Tree} newer
 * @param {Number} type
 */
function style (older, newer, type) {
	var node = older.node.style;
	var next = newer.attrs.style;

	if (typeof next !== 'string') {
		switch (type) {
			// assign
			case 0: {
				for (var name in next) {
					var value = next[name];

					if (name.charCodeAt(0) === 45) {
						node.setProperty(name, value);
					} else {
						node[name] = value;
					}
				}
				break;
			}
			// update
			case 1: {
				var prev = older.attrs.style;

				for (var name in next) {
					var value = next[name];

					if (name.charCodeAt(0) === 45) {
						node.setProperty(name, value);
					} else {
						node[name] = value;
					}
				}
				break;
			}
		}
	} else {
		node.cssText = next;
	}
}

/**
 * Event
 *
 * @param {Tree} older
 * @param {String} type
 * @param {Function} value
 * @param {Number} action
 */
function event (older, type, value, action) {
	var name = type.toLowerCase().substring(2);
	var host = older.host;
	var node = older.node;
	var fns = node._fns;

	if (fns === void 0) {
		fns = node._fns = {};
	}

	switch (action) {
		case 0: {
			node.removeEventListener(name, proxy);

			if (node._owner !== void 0) {
				node._owner = null;
			}
			break;
		}
		case 1: {
			node.addEventListener(name, proxy);
		}
		case 2: {
			if (host !== null && host.group > 1) {
				node._owner = host.owner;
			}
		}
	}

	fns[name] = value;
}

/**
 * Proxy
 *
 * @param {Event} e
 */
function proxy (e) {
	var type = e.type;
	var fns = this._fns;
	var fn = fns[type];

	if (fn === null || fn === void 0) {
		return;
	}

	var owner = this._owner;

	if (owner !== void 0) {
		eventBoundary(owner, fn, e);
	} else {
		fn.call(this, e);
	}
}
