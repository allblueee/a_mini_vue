import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
    // 1.patch
    patch(vnode, container);

}

function patch(vnode, container) {
    // 判断 vnode 是不是一个 element？
    // 区分 element 和 component 
    console.log(typeof vnode.type)
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
    const el = (vnode.el = document.createElement(vnode.type))

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
    setupRenderEffect(instance, vnode, container);
}

function setupRenderEffect(instance: any, vnode, container) {
    const { proxy } = instance;
    // 代理 实例上的 setupState 中的属性 这里是 msg
    const subTree = instance.render.call(proxy);
    patch(subTree, container);

    // element 处理完成
    vnode.el = subTree.el;
}
