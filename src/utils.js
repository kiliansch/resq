import deepEqual from 'fast-deep-equal'

const { isArray } = Array
const { keys } = Object

// One liner helper functions
function typeIsFunction(type) {
    return typeof type === 'function'
}

export function getElementType(type) {
    return typeIsFunction(type) ? type.name : type
}

export function isFragmentInstance(element) {
    return (element.children.length > 1)
}

function findStateNode (element) {
    return (element.stateNode instanceof HTMLElement) ? element.stateNode : null
}


function isNativeObject(obj) {
    return (typeof obj === 'object' && !isArray(obj))
}

export function verifyIfArrays(arr1, arr2) {
    if (!isArray(arr1) || !isArray(arr2)) {
        return false
    }

    return arr1.some(r => arr2.includes(r))
}

/**
  * @name match
  * @param macther Object - this is the object that will be looped
  * @param verify Object - this is the object to match against
  * @return boolean
  */
export function match(matcher = {}, verify = {}) {
    let results = []

    if (!keys(matcher).length && !keys(verify).length) {
        return true
    }

    if (!keys(matcher).length) {
        return true
    }

    for (let k in matcher) {
        if (verify.hasOwnProperty(k)) {
            if (isNativeObject(matcher[k]) && isNativeObject(verify[k])) {
                results = results.concat(match(matcher[k], verify[k]))
            }

            if (matcher[k] === verify[k] || verifyIfArrays(matcher[k], verify[k])) {
                results.push(verify)
            }
        }
    }

    return !!(results.filter(el => el).length)
}

/**
 * @name removeChildrenFromProps
 * @parameter Object | String
 * @return Object | String
 * @description Remove the `children` property from the props since they will be available
 *              in the node
 */
export function removeChildrenFromProps(props) {
    // if the props is a string, we can assume that it's just the text inside a html element
    if (!props || typeof props === 'string') {
        return props
    }

    const returnProps = {}

    for(let key in props) {
        // remove children prop since it'll be an array in the RESQNode instance
        if (key !== 'children') {
            returnProps[key] = props[key]
        }
    }

    return returnProps
}

/**
 * @name getElementState
 * @parameter Object
 * @return Object
 * @description Class components store the state in `memoizedState`, but functional components
 *              using hooks store them in `memoizedState.baseState`
 */

export function getElementState(elementState) {
    if (!elementState) {
        return {}
    }

    const { baseState } = elementState

    if (baseState) {
        return baseState
    }

    return elementState
}

/**
 * @name buildNodeTree
 * @parameter Object
 * @return Object
 * @description Build a node tree based on React virtual dom
 * @example
    {
      name: 'MyComponent',
      props: { hello: 'world' },
      children: [],
      state: { init: true },
      isFragment: false,
    }
 */
export function buildNodeTree(element) {
    let tree = { children: [] }
    let elementCopy = Object.assign({}, element)
    if (!element) {
        return tree
    }

    tree.name = getElementType(elementCopy.type)
    tree.node = findStateNode(elementCopy)
    tree.props = removeChildrenFromProps(elementCopy.memoizedProps)
    tree.state = getElementState(elementCopy.memoizedState)


    if (elementCopy.child) {
        tree.children.push(elementCopy.child)

        let child = elementCopy.child

        while (child.sibling) {
            tree.children.push(child.sibling)
            child = child.sibling
        }
    }

    tree.children = tree.children.map(child => buildNodeTree(child))

    if (typeIsFunction(elementCopy.type)) {
        tree.isFragment = isFragmentInstance(tree)
    }
    return tree
}

/**
 * @name findInTree
 * @parameter Object
 * @parameter Function
 * @parameter Boolean - default false
 * @return Array<Object>
 * @description Iterate over the tree parameter and return matches from the passed function
 */

export function findInTree(tree, searchFn, selectFirst = false) {
    let returnArray = []
    let stack = tree

    while (stack.length || (selectFirst && !returnArray.length)) {
        const node = stack.shift()

        if(node.children && node.children.length) {
            for(let child of node.children) {
                if (searchFn(child)) {
                    returnArray.push(child)
                }

                stack.push(child)
            }
        }
    }

    return returnArray
}

/**
 * @name findSelectorInTree
 * @parameter Array<String>
 * @parameter Object
 * @parmater Boolean - default false
 * @optional @parameter Function
 * @return Object
 * @description Base iterator function for the library. Iterates over selectors and searches
 *              node tree
 */
export function findSelectorInTree(selectors, tree, selectFirst = false, searchFn) {
    let treeArray = [tree]

    selectors.forEach((selector) => {
        treeArray = findInTree(treeArray, child => {
            if (searchFn && typeof searchFn === 'function') {
                return searchFn(child)
            }

            return child.name === selector
        }, selectFirst)
    })

    return treeArray
}

/**
 * @name filterNodesBy
 * @parameter Array<Object>
 * @parameter String
 * @parameter Object
 * @return Array<Objects>
 * @description Filter nodes by deep matching the node[key] to the obj
 */
export function filterNodesBy(nodes, key, obj, exact = false) {
    const filtered = []

    const iterator = el => {
        if (
            (exact && deepEqual(obj, el[key])) ||
            (!exact && match(obj, el[key]))
        ) {
            filtered.push(el)
        }
    }

    nodes.forEach(iterator)

    return filtered
}
