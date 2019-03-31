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

export function match(obj1, obj2) {
    let results = []

    if (!keys(obj1).length && !keys(obj2).length) {
        return true
    }

    for (let k in obj1) {
        if (obj2.hasOwnProperty(k)) {
            if (isNativeObject(obj1[k]) && isNativeObject(obj2[k])) {
                results = results.concat(match(obj1[k], obj2[k]))
            }

            if (obj1[k] === obj2[k] || verifyIfArrays(obj1[k], obj2[k])) {
                results.push(obj2)
            }
        }
    }

    return results.filter(el => el).length
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
    let elementCopy = { ...element }
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

    if (typeIsFunction(elementCopy.type) && isFragmentInstance(tree)) {
        const fragment = new DocumentFragment()

        tree.children.forEach(child => {
            if (!child.node) {
                child.children.forEach(grandChild => {
                    fragment.appendChild(grandChild.node.cloneNode())
                })
            } else {
                fragment.appendChild(child.node.cloneNode())
            }
        })

        tree.node = fragment
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
export function filterNodesBy(nodes, key, obj) {
    const filtered = []

    const iterator = el => {
        if (match(obj, el[key])) {
            filtered.push(el)
        }
    }

    nodes.forEach(iterator)

    return filtered
}
