import { isObject } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
    // 1.patch
    patch(vnode, container);

}

function patch(vnode, container) {
    // ShapeFlags 判断 vnode类型
    // 判断 vnode 是不是一个 element？
    // 区分 element 和 component 
    // console.log(typeof vnode.type)
    const { shapeFlags } = vnode;
    if (shapeFlags & ShapeFlags.Element) {
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
    const { children, shapeFlags } = vnode;

    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
        // text children
        el.textContent = children;
    } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // array children
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
function mountComponent(initialVnode: any, container) {
    const instance = createComponentInstance(initialVnode);

    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}

function setupRenderEffect(instance: any, initialVnode, container) {
    const { proxy } = instance;
    // 代理 实例上的 setupState 中的属性 这里是 msg
    // 又是 this 指向的理解，函数内 this 的指向调用他的对象/函数的 this
    // this 链的继承？
    // 在 proxy 这里调用 h函数时，由于 proxy 已经处理好了 setup 中的数据，因此可以用 this.msg 拿到
    // 在 h函数里调用 this.$el 也是如此代理的方式
    const subTree = instance.render.call(proxy);
    patch(subTree, container);

    // element 处理完成
    initialVnode.el = subTree.el;
}