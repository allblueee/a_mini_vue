import { NodeTypes } from "./ast";

export function transform(root, options) {
    const context = createTransformerContext(root,options);
    // 1. 遍历 dfs
    traverseNode(root,context);
    // 2. 修改 text content
}
function createTransformerContext(root: any, options: any) {
    const context ={
        root,
        nodeTransforms: options.nodeTransforms || [],
    }
    return context;
}

function traverseNode(node: any, context) {

    const nodeTransforms = context.nodeTransforms;
    for(let i = 0; i < nodeTransforms.length; i++){
        const nodeTransform = nodeTransforms[i];
        nodeTransform(node)
    }
    tranverseChildren(node, context);
}

function tranverseChildren(node: any, context: any) {
    const children = node.children;
    if (children) {
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            traverseNode(node, context);
        }
    }
}

