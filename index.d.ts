declare module 'resq' {
    interface RESQTreeNode {
        name: string | undefined
        children: Array<RESQTreeNode>
        props: any
        state: any
        node: HTMLElement
    }

    function resq$(
        selector: string,
        options: { timeout: string, rootElSelector: string }
    ): Promise<RESQ>

    function resq$$ (
        selector: string,
        options: { timeout: string, rootElSelector: string }
    ): Promise<RESQ>

    class RESQNodes extends Array {
        constructor(nodes: Array<RESQTreeNode>)
        public byProps<P extends {}>(props: P): RESQNodes
        public byState<S extends {}>(props: S): RESQNodes
    }

    class RESQNode extends Object {
        constructor(item: RESQTreeNode, nodes: Array<RESQTreeNode>)
        public byProps<P extends {}>(props: P): RESQNode
        public byState<S extends {}>(props: S): RESQNode
    }

    class RESQ {
        private selectors: Array<string>
        private rootComponent: HTMLElement
        private tree: RESQTreeNode
        private nodes?: Array<RESQTreeNode>

        constructor(selector: string, root: HTMLElement)
        public find: () => RESQNode
        public findAll: () => RESQNodes
    }
}
