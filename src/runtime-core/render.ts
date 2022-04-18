import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
    // 1.patch
    patch(vnode, container);

}

function patch(vnode, container) {
    // 判断 vnode 是不是一个 element？
    // 区分 element 和 component 
    if (typeof vnode.type === "string") {
        // 处理 element 
        processElement(vnode, container);

    } else if (isObject(vnode.type)) {
        // 处理组件
        processComponent(vnode, container);

    }
}


// 处理 element 流程
function processElement(vnode: any, container: any) {
    // init / update
    mountElement(vnode, container);
}
function mountElement(vnode: any, container: any) {
    const el = document.createElement(vnode.type)
 
    // string array
    const { children } = vnode;

    if (typeof children === "string") {
        el.textContent = children;
    } else if (Array.isArray(children)) {
        mountChildren(vnode, el)
    }
    // props 
    const { props } = vnode
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }

    container.append(el);

    document.body.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    })
}


// 处理组件部分流程
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



