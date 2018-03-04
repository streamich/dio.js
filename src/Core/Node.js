var setNodeContent = getFactory('setContent', setDOMContent)
var setNodeText = getFactory('setText', setDOMText)
var setNodeEvent = getFactory('setEvent', setDOMEvent)
var setNodeProps = getFactory('setProps', setDOMProps)
var setNodeStyle = getFactory('setStyle', setDOMStyle)

var getNodeOwner = getFactory('getOwner', getDOMOwner)
var getNodeDocument = getFactory('getDocument', getDOMDocument)
var getNodeTarget = getFactory('getTarget', getDOMTarget)
var getNodeType = getFactory('getType', getDOMType)
var getNodeProps = getFactory('getProps', getDOMProps)
var getNodePortal = getFactory('getPortal', getDOMPortal)
var getNodeQuery = getFactory('getQuery', getDOMQuery)

var isValidNodeTarget = getFactory('isValidTarget', isValidDOMTarget)
var isValidNodeEvent = getFactory('isValidEvent', isValidDOMEvent)

var removeNodeChild = getFactory('removeChild', removeDOMChild)
var appendNodeChild = getFactory('appendChild', appendDOMChild)
var insertNodeBefore = getFactory('insertBefore', insertDOMBefore)

var createNodeText = getFactory('createText', createDOMText)
var createNodeEmpty = getFactory('createEmpty', createDOMEmpty)
var createNodeElement = getFactory('createElement', createDOMElement)
