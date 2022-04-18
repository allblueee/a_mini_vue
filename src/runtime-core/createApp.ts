import { render } from "./render";
import { createVNode } from "./vnode";

export function createApp (rootComponent){
    return {
        mount(rootContainer){
            // component -> vnode
            // 基于虚拟节点操作
            // 转换为虚拟节点 vnode
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    }

}
