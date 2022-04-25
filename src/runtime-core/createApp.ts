import { createVNode } from "./vnode";

export function createAppAPI(render) {

    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // component -> vnode
                // 基于虚拟节点操作
                // 转换为虚拟节点 vnode
                // debugger;
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        }

    }

}
