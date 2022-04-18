import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
    // 1.patch
    patch(vnode, container);

}

function patch(vnode, container) {
    // 判断 vnode 是不是一个 element？
    // 区分 element 和 component 

    // 处理 element 

    // 处理组件
    processComponent(vnode, container);
}

function processComponent(vnode: any, container: any) {
    mountComponent(vnode, container);
}
function mountComponent(vnode: any, container) {
    const instance = createComponentInstance(vnode);

    setupComponent(instance);
    setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container) {
    const subTree = instance.render();
    patch(subTree, container);
}

