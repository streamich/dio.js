describe('Component', () => {
	it('should render a class that extends Component', () => {
		let container = document.createElement('div')

		render(class extends Component {
			render() {
				return '1'
			}
		}, container)

		assert.html(container, '1')
	})

	it('should render a class that does not extend Component', () => {
		let container = document.createElement('div')

		render(class {
			render() {
				return '1'
			}
		}, container)

		assert.html(container, '1')
	})

	it('should provide a render fallback method', () => {
		let container = document.createElement('div')
		let stack = []

		assert.doesNotThrow(() => {
			render(h(class A extends Component {
				componentDidCatch(err) {
					stack.length = 0
					err.preventDefault()
				}
				componentWillMount() {
					stack.push('willMount')
				}
				componentDidMount() {
					stack.push('didMount')
				}
			}), container)
		})

		assert.html(container, '')
		assert.include(stack, 'willMount')
		assert.include(stack, 'didMount')
	})

	it('should call lifecycle methods on class component', () => {
		let container = document.createElement('div')
		let stack = []
		let A = class {
			constructor() { stack.push('constructor') }
			getInitialState() { stack.push('getInitialState') }
			componentWillMount() { stack.push('componentWillMount') }
			componentDidMount() { stack.push('componentDidMount') }
			componentWillReceiveProps() { stack.push('componentWillReceiveProps') }
			shouldComponentUpdate() { return !!stack.push('shouldComponentUpdate') }
			componentWillUpdate() { stack.push('componentWillUpdate') }
			componentDidUpdate() { stack.push('componentDidUpdate') }
			componentWillUnmount() { stack.push('componentWillUnmount') }
			render() { stack.push('render') }
		}

		render(A, container)
		render(A, container)
		unmountComponentAtNode(container)

		assert.deepEqual(stack, [
			'constructor',
			'getInitialState',
			'componentWillMount',
			'render',
			'componentDidMount',
			'componentWillReceiveProps',
			'shouldComponentUpdate',
			'componentWillUpdate',
			'render',
			'componentDidUpdate',
			'componentWillUnmount'
		])
	})

	it('should call lifecycle methods on function component', () => {
		let container = document.createElement('div')
		let stack = []
		let A = () => { stack.push('render') }
		A.getInitialState = () => { stack.push('getInitialState') }
		A.componentWillMount = () => { stack.push('componentWillMount') }
		A.componentDidMount = () => { stack.push('componentDidMount') }
		A.componentWillReceiveProps = () => { stack.push('componentWillReceiveProps') }
		A.shouldComponentUpdate = () => { return !!stack.push('shouldComponentUpdate') }
		A.componentWillUpdate = () => { stack.push('componentWillUpdate') }
		A.componentDidUpdate = () => { stack.push('componentDidUpdate') }
		A.componentWillUnmount = () => { stack.push('componentWillUnmount') }

		render(A, container)
		render(A, container)
		unmountComponentAtNode(container)

		assert.deepEqual(stack, [
			'getInitialState',
			'componentWillMount',
			'render',
			'componentDidMount',
			'componentWillReceiveProps',
			'shouldComponentUpdate',
			'componentWillUpdate',
			'render',
			'componentDidUpdate',
			'componentWillUnmount'
		])
	})

	it('should call (un)mount lifecycle in the right order', () => {
		let container = document.createElement('div')
		let stack = []

		render(class A {
			componentDidMount() {
				stack.push('mount A')
			}
			componentWillUnmount() {
				stack.push('unmount A')
			}
			render() {
				return class B {
					componentDidMount() {
						stack.push('mount B')
					}
					componentWillUnmount() {
						stack.push('unmount B')
					}
					render() {
						return 'B'
					}
				}
			}
		}, container)

		render(class C {
			componentDidMount() {
				stack.push('mount C')
			}
			render() {
				return 'C'
			}
		}, container)

		assert.html(container, 'C')
		assert.deepEqual(stack, [
			'mount B',
			'mount A',
			'unmount B',
			'unmount A',
			'mount C'
		])
	})

	it('should update Component', () => {
		let container = document.createElement('div')
		let A = class {
			shouldComponentUpdate() {
				return true
			}
			render({children}) {
				return children
			}
		}

		render(h(A, '1'), container)
		render(h(A, '2'), container)

		assert.html(container, '2')
	})

	it('should not update Component', () => {
		let container = document.createElement('div')
		let A = class {
			shouldComponentUpdate() {
				return false
			}
			render({children}) {
				return children
			}
		}

		render(h(A, '1'), container)
		render(h(A, '2'), container)

		assert.html(container, '1')
	})

	it('should update PureComponent', () => {
		let container = document.createElement('div')
		let A = class extends PureComponent {
			render () {
				return ++counter
			}
		}

		let counter = 0

		render(h(A, {children: 1, new: true}), container)
		render(h(A, {children: 1}), container)

		assert.html(container, '2')
	})

	it('should not update PureComponent', () => {
		let container = document.createElement('div')
		let A = class extends PureComponent {
			render () {
				return ++counter
			}
		}

		let counter = 0

		render(h(A, {children: 1}), container)
		render(h(A, {children: 1}), container)

		assert.html(container, '1')
	})

	it('should update PureComponent with -0', () => {
		let container = document.createElement('div')
		let A = class extends PureComponent {
			render () {
				return ++counter
			}
		}

		let counter = 0

		render(h(A, {children: 0}), container)
		render(h(A, {children: -0}), container)

		assert.html(container, '2')
	})

	it('should not update PureComponent with NaN', () => {
		let container = document.createElement('div')
		let A = class extends PureComponent {
			render () {
				return ++counter
			}
		}

		let counter = 0

		render(h(A, {children: NaN}), container)
		render(h(A, {children: NaN}), container)

		assert.html(container, '1')
	})

	it('should update component props', () => {
		let container = document.createElement('div')
		let stack = []
		let Child = class {
			constructor() {
				setStateChild = this.setState.bind(this)
			}
			shouldComponentUpdate(props, state) {
				stack.push(this.props, props)
				return PureComponent.prototype.shouldComponentUpdate.call(this, props, state)
			}
			render({x}) {
			  return h('div', x)
			}
		}
		let Parent = class {
			constructor() {
				setState = this.setState.bind(this)
			}
			getInitialState() {
				return {x: 'abc'}
			}
			render() {
				return h('div', h(Child, {x: this.state.x}))
			}
		}

		let setStateChild = null
		let setState = null

		render(h(Parent), container)
		setState({x: 'xxx'})
		assert.deepEqual(stack[0], {x: 'abc'})
		assert.deepEqual(stack[1], {x: 'xxx'})

		setStateChild({abc: 1})
		assert.deepEqual(stack[2], {x: 'xxx'})
		assert.deepEqual(stack[3], {x: 'xxx'})
	})

	it('should not update component props', () => {
		let container = document.createElement('div');
		let stack = []
		let Child = class {
			constructor() {
				forceUpdateChild = this.forceUpdate.bind(this)
			}
			render({x}) {
				return h('div', x)
			}
		}
		let Root = class {
			constructor() {
				setState = this.setState.bind(this)
			}
			getInitialState() {
				return {locale: {}}
			}
			render() {
				return h('div', h(Child, {
				  x: this.state.locale['xxx']
				}))
			}
		}
		let forceUpdateChild = null
		let setState = null

		render(h(Root), container)
		assert.html(container, '<div><div></div></div>')

		setState({locale: {xxx: 'abc'}})
		assert.html(container, '<div><div>abc</div></div>')

		forceUpdateChild()
		assert.html(container, '<div><div>abc</div></div>')
	})

	it('should setState from a class lifecycle method', (done) => {
		let container = document.createElement('div')
		render(class {
			componentDidMount() {
				return {x: 'value'}
			}
			render() {
				return h('div', this.state.x)
			}
		}, container)

		nextTick(() => {
			assert.html(container, '<div>value</div>')
			done()
		})
	})

	it('should setState from a function component lifecycle method', (done) => {
		let container = document.createElement('div')
		let A = (props, {x}) => h('div', x)
		A.componentDidMount = () => ({x: 'value'})

		render(A, container)

		nextTick(() => {
			assert.html(container, '<div>value</div>')
			done()
		})
	})

	it('should update a nested component in a hoisted tree', () => {
		let container = document.createElement('div')
		let props = {x: 1}
		let A = ({x}) => h(B, {x})
		let B = ({x}) => x
		let hoist = h(A, props)

		render(hoist, container)
		Object.assign(props, {x: 2})
		render(hoist, container)

		assert.html(container, '2')
	})

	it('should getInitialState', () => {
		let container = document.createElement('div')

		render(class {
			getInitialState() {
				return {x: '!!'}
			}
			render(props, {x}) {
				return h('h1', 'Hello World', x)
			}
		}, container)

		assert.html(container, '<h1>Hello World!!</h1>')
	})

	it('should async getInitialState', (done) => {
		let container = document.createElement('div')
		let stack = []
		let refs = null

		render(class {
			getInitialState() {
				return refs = Promise.resolve({x: '!!'})
			}
			render(props, {x}) {
				stack.push(x)
				return h('h1', 'Hello World', x)
			}
		}, container)

		refs.then(() => {
			nextTick(() => {
				assert.html(container, '<h1>Hello World!!</h1>')
				assert.lengthOf(stack, 1)
				done()
			}, 1)
		})
	})

	it('should fallback to default object when getInitialState returns nothing', () => {
		let container = document.createElement('div')

		render(class {
			getInitialState() {
			}
			render(props, state) {
				return h('h1', 'Hello World', JSON.stringify(state))
			}
		}, container)

		assert.html(container, '<h1>Hello World{}</h1>')
	})

	it('should async state', (done) => {
		let container = document.createElement('div')
		let stack = []
		let refs = null

		render(class {
			constructor() {
				refs = this.state = Promise.resolve({x: '!!'})
			}
			render(props, {x}) {
				stack.push(x)
				return h('h1', 'Hello World', x)
			}
		}, container)

		refs.then(() => {
			nextTick(() => {
				assert.html(container, '<h1>Hello World!!</h1>')
				assert.lengthOf(stack, 1)
				done()
			}, 1)
		})
	})

	it('should pass props, state and context to getInitialState', () => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			getChildContext() {
				return {
					passed: true
				}
			}
			render() {
				return class {
					constructor() {
						this.state = {
							passed: true
						}
					}
					static defaultProps() {
						return {
							passed: true
						}
					}
					getInitialState(props, state, context) {
						props.passed && stack.push('props')
						state.passed && stack.push('state')
						context.passed && stack.push('context')
					}
					render() {

					}
				}
			}
		}, container)

		assert.html(container, '')
		assert.include(stack, 'props')
		assert.include(stack, 'state')
		assert.include(stack, 'context')
	})

	it('should async mount', (done) => {
		let container = document.createElement('div')
		let refs = Promise.resolve(h('h1', 'Hello'))

		render(class {
			render() {
				return refs
			}
		}, container)

		assert.html(container, '')
		refs.then(() => assert.html(container, '<h1>Hello</h1>')).then(done)
	})

	it('should render a placeholder before async mount', (done) => {
		let container = document.createElement('div')
		let refs = Promise.resolve(h('h1', 'Hello'))

		render(class {
			render() {
				return h(refs, h('h1', 'Loading'))
			}
		}, container)

		assert.html(container, '<h1>Loading</h1>')
		refs.then(() => assert.html(container, '<h1>Hello</h1>')).then(done)
	})

	it('should async unmount', (done) => {
		let container = document.createElement('div')
		let refs = new Promise((resolve) => resolve())

		render(class {
			componentWillUnmount() {
				return refs
			}
			render() {
				return h('h1', 'Hello')
			}
		}, container)
		unmountComponentAtNode(container)

		assert.html(container, '<h1>Hello</h1>')
		refs.then(() => assert.html(container, '')).then(done)
	})

	it('should render defaultProps(object)', () => {
		let container = document.createElement('div')
		class A {
			render() {
				return this.props.children
			}
		}
		A.defaultProps = {children: 1}

		render(A, container)
		assert.html(container, '1')
	})

	it('should render defaultProps(function)', () => {
		let container = document.createElement('div')
		class A {
			static defaultProps() {
				return {children: 2}
			}
			render() {
				return this.props.children
			}
		}

		render(A, container)
		assert.html(container, '2')
	})

	it('should update component ref', () => {
		let container = document.createElement('div')
		let stack = []
		let refs = null

		class A {
			componentWillMount() {
				refs = this
			}
			render() {
				return 'Hello'
			}
		}

		render(h(A, {ref: (value) => stack.push(value)}), container)
		render(h(A, {ref: (value) => stack.push(value)}), container)
		assert.html(container, 'Hello')
		assert.include(stack, null)
		assert.include(stack, refs)
	})

	it('should not update component ref', () => {
		let container = document.createElement('div')
		let stack = []
		let refs = (value) => stack.push(value)

		class A {
			render() {
				return 'Hello'
			}
		}

		render(h(A, {ref: refs}), container)
		render(h(A, {ref: refs}), container)
		assert.html(container, 'Hello')
		assert.lengthOf(stack, 1)
	})

	it('should pass multiple children to component', () => {
		let container = document.createElement('div')
		let refs = null

		render(h(class {
			render() {
				refs = this.props.children
			}
		}, 1, 2, [3, 4]), container)

		assert.lengthOf(refs, 3)
	})

	it('should render a generator(iterator)', () => {
		let container = document.createElement('div')

		render(class {
			*render() {
				yield 1
				yield 2
				yield 3
			}
		}, container)

		assert.html(container, '123')
	})

	it('should render a generator(function)', () => {
		let container = document.createElement('div')

		render(h('div', function *render() {yield 1}), container)

		assert.html(container, '<div>1</div>')
	})

	it('should setState in constructor', (done) => {
		let container = document.createElement('div')

		render(class {
			constructor() {
				this.setState({id: 1})
			}
			render () {
				return this.state.id
			}
		}, container)

		nextTick(() => {
			assert.html(container, '1')
			done()
		})
	})

	it('should forceUpdate in constructor', (done) => {
		let container = document.createElement('div')
		let counter = 0

		render(class {
			constructor() {
				counter++
				this.forceUpdate()
			}
			render () {
				return counter
			}
		}, container)

		nextTick(() => {
			assert.html(container, '1')
			done()
		})
	})

	it('should setState in componentWillMount', () => {
		let container = document.createElement('div')

		render(class {
			componentWillMount() {
				this.setState({id: 1})
			}
			render () {
				return this.state.id
			}
		}, container)

		assert.html(container, '1')
	})

	it('should not setState null', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			getInitialState() {
				return {
					id: 1
				}
			}
			componentDidMount() {
				this.setState(null)
			}
			render () {
				stack.push(1)
				return this.state.id
			}
		}, container)

		nextTick(() => {
			assert.lengthOf(stack, 1)
			assert.html(container, '1')
			done()
		})
	})

	it('should not implicit setState null', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidMount() {
				return null
			}
			render () {
				stack.push(1)
				return this.state.id
			}
		}, container)

		nextTick(() => {
			assert.lengthOf(stack, 1)
			assert.html(container, '')
			done()
		})
	})

	it('should trigger an implicit setState from an event', () => {
		let container = document.createElement('div')
		let refs = null

		render(class {
			handleEvent(e) {
				return {id: 1}
			}
			componentDidMount(node) {
				refs = node
			}
			render() {
				return h('button', {onClick: this.handleEvent}, this.state.id)
			}
		}, container)

		refs.dispatchEvent(new Event('click'))
		assert.html(container, '<button>1</button>')
	})

	it('should setState(function)', () => {
		let container = document.createElement('div')
		let stack = []
		let refs = null

		render(class {
			handleEvent(e) {
				this.setState((state) => {
					stack.push(state === this.state)

					return {id: 1}
				})
			}
			componentDidMount(node) {
				refs = node
			}
			render() {
				return h('button', {onClick: this.handleEvent}, this.state.id)
			}
		}, container)

		refs.dispatchEvent(new Event('click'))
		assert.html(container, '<button>1</button>')
		assert.deepEqual(stack, [true])
	})

	it('should update a promise element', (done) => {
		let container = document.createElement('div')
		let A = class {
			render({children}) {
				return children
			}
		}

		render(h(A, Promise.resolve(h('div', 1))), container)
		render(h(A, Promise.resolve(h('div', 2))), container)

		nextTick(() => {
			assert.html(container, '<div>2</div>')
			done()
		})
	})

	it('should ensure an update from componentWillUpdate update is resolved', (done) => {
		let container = document.createElement('div')
		let stack = []
		let counter = 0
		let A = class {
			componentDidCatch(err) {
				err.preventDefault()
			}
			componentWillUpdate() {
				if (counter++ > 0) {
					nextTick(() => {
						assert.html(container, '3')
						assert.deepEqual(stack, [1, 2, '2', 3])
						done()
					})
				} else {
					render(h(A, 2), container)
					stack.push(container.innerHTML)
				}
			}
			render({children}, {name}) {
				stack.push(children)
				return children
			}
		}

		render(h(A, 1), container)
		render(h(A, 3), container)
	})

	it('should ensure a pending update from componentDidUpdate update is resolved', (done) => {
		let container = document.createElement('div')
		let stack = []
		let counter = 0
		let A = class {
			componentDidCatch(err) {
				err.preventDefault()
			}
			componentDidUpdate() {
				if (counter++ > 0) {
					assert.html(container, '2')
					assert.lengthOf(stack, 3)
					done()
				} else {
					render(h(A, 2), container)
				}
			}
			render({children}, {name}) {
				stack.push(1)
				return children
			}
		}

		render(h(A, 1), container)
		render(h(A, 1), container)
	})

	it('should should remove a component from a list of host elements', () => {
		let container = document.createElement('div')
		let A = () => h('h1', 'A')

		render(
			h('div',
				h(A, {key: 'A'}),
				h('div', {key: 'B'}, 'B')
			),
			container
		)

		render(
			h('div',
				h('div', {key: 'B'}, 'B')
			),
			container
		)

		assert.html(container, `
			<div>
				<div>B</div>
			</div>
		`)
	})

	it('should replace async mount before resolve', (done) => {
		let container = document.createElement('div')
		let refs = Promise.resolve(h('h1', 'Hello'))

		render(class {
			render() {
				return refs
			}
		}, container)
		render(h('div'), container)

		assert.html(container, '<div></div>')
		refs.then(() => assert.html(container, '<div></div>')).then(done)
	})

	it('should call setState(..., callback)', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidMount() {
				this.setState({}, () => {
					stack.push(true)
				})
			}
			render() {
				return 1
			}
		}, container)

		nextTick(() => {
			assert.html(container, '1')
			assert.lengthOf(stack, 1)
			done()
		})
	})

	it('should call forceUpdate(callback)', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidMount() {
				this.forceUpdate(() => {
					stack.push(true)
				})
			}
			render() {
				return 1
			}
		}, container)

		nextTick(() => {
			assert.html(container, '1')
			assert.lengthOf(stack, 1)
			done()
		})
	})

	it('should not call setState(..., callback)', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidMount() {
				this.setState({}, 'should not throw')
			}
			render() {
				return 1
			}
		}, container)

		nextTick(() => {
			assert.html(container, '1')
			assert.lengthOf(stack, 0)
			done()
		})
	})

	it('should pass node argument to componentDidMount', () => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidMount(node) {
				stack.push(node.innerHTML === '<span></span>')
			}
			render() {
				return h('h1', h('span'))
			}
		}, container)

		assert.include(stack, true)
	})

	it('should pass node argument to componentWillUnmount', () => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentWillUnmount(node) {
				stack.push(node.innerHTML === '<span></span>')
			}
			render() {
				return h('h1', h('span'))
			}
		}, container)

		unmountComponentAtNode(container)
		assert.include(stack, true)
	})

	it('should setState synchronously from componentWillMount', () => {
		let container = document.createElement('div')
		let stack = []

		let A = (props, {x}) => {
			stack.push(true)
			return h('h1', 'Hello, ', x)
		}

		A.componentWillMount = () => ({x: 'World'})
		render(h(A), container)

		assert.html(container, '<h1>Hello, World</h1>')
		assert.lengthOf(stack, 1)
	})

	it('should call componentDidMount synchronously', () => {
		let container = document.createElement('div')
		let stack = []

		let A = (props, {x}) => {
			stack.push(true)
			return h('h1', 'Hello, ', x)
		}

		A.componentDidMount = () => ({x: 'World'})

		render(h(A), container)

		assert.html(container, '<h1>Hello, World</h1>')
		assert.lengthOf(stack, 2)
	})

	it('should update state from componentWillReceiveProps synchronously', () => {
		let container = document.createElement('div')
		let stack = []

		class A {
			getInitialState() {
				return {
					name: 'Empty'
				}
			}
			componentWillReceiveProps() {
				stack.push('componentWillReceiveProps')
				this.setState({name: 'World'})
			}
			render() {
				stack.push(this.state.name)
				return h('h1', 'Hello ', this.state.name)
			}
		}

		render(A, container)
		assert.html(container, '<h1>Hello Empty</h1>')

		render(A, container)
		assert.html(container, '<h1>Hello World</h1>')

		assert.lengthOf(stack, 3)
		assert.deepEqual(stack, [
			'Empty',
			'componentWillReceiveProps',
			'World'
		])
	})

	it('should async import a "default" component module', (done) => {
		let container = document.createElement('div')
		let stack = []
		let queue = null

		// tests that it successfully desugars
		// import('./file.js') --> import('./file.js').then((module) => module.default)
		// assuming file.js exports a default export
		let importShim = (url) => {
			if (url === null)
				return h('h1', 'null')

			return queue = new Promise((resolve, reject) => {
				switch (url) {
					case 'string':
						return void resolve('string')
					case 'number':
						return void resolve(1)
					case 'element':
						return void resolve(h('h1', 'element'))
					case 'component':
						return void resolve(() => h('h1', 'component'))
					case 'module':
						return void resolve({
							default: () => h('h1', 'module')
						})
				}
			})
		}

		let A = class {
			componentDidMount() {
				stack.push(container.innerHTML)
			}
			componentDidUpdate() {
				queue.then(() => stack.push(container.innerHTML))
			}
			render({type}) {
				return importShim(type)
			}
		}

		render(h(A, {type: null}), container)
		render(h(A, {type: 'string'}), container)
		render(h(A, {type: 'number'}), container)
		render(h(A, {type: 'element'}), container)
		render(h(A, {type: 'component'}), container)
		render(h(A, {type: 'module'}), container)

		assert.notEqual(queue, null)
		queue.then(() => {
			assert.deepEqual(stack, [
				'<h1>null</h1>',
				'string',
				'1',
				'<h1>element</h1>',
				'<h1>component</h1>',
				'<h1>module</h1>'
			])
		}).then(done).catch(done)
	})

	it('should allow dynamic mutation of render method', () => {
		assert.instanceOf(Component.prototype.render, Function)
		assert.deepInclude(Object.getOwnPropertyDescriptor(Component.prototype, 'render'), {
			configurable: true,
			enumerable: false,
			writable: false,
			value: Component.prototype.render
		})
	})
})
