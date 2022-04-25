import { isObject } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Textt } from "./vnode";

export function render(vnode, container) {
    // 1.patch
    patch(vnode, container, null);

}

function patch(vnode, container, parentComponent) {
    // ShapeFlags 判断 vnode类型
    // 判断 vnode 是不是一个 element？
    // 区分 element 和 component 
    const { type, shapeFlags } = vnode;

    // Fragment 只渲染 children
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        case Textt:
            processText(vnode, container)
            break;
        default:
            if (shapeFlags & ShapeFlags.Element) {
                // 处理 element 
                processElement(vnode, container, parentComponent);

            } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
                // 处理组件
                processComponent(vnode, container, parentComponent);

            }
    }
}

function processText(vnode: any, container: any) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    container.append(textNode)
}

function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode, container, parentComponent)
}


// 处理 element 流程
function processElement(vnode: any, container: any, parentComponent) {
    // init / update
    mountElement(vnode, container, parentComponent);
}
function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = document.createElement(vnode.type))

    // string array
    const { children, shapeFlags } = vnode;

    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
        // text children
        el.textContent = children;
    } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // array children
        mountChildren(vnode, el, parentComponent)
    }
    // props 
    const { props } = vnode
    for (const key in props) {
        // console.log(key)
        const val = props[key];
        // 格式 on + Event name 
        const isOn = (key: string) => /^on[A-Z]/.test(key)
        if (isOn(key)) {
            const evenet = key.slice(2).toLowerCase();
            el.addEventListener(evenet, val)
        }
        else {
            el.setAttribute(key, val);
        }
    }

    container.append(el);
}
function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
        patch(v, container, parentComponent);
    })
}


// 处理组件部分流程
function processComponent(vnode: any, container: any,parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
function mountComponent(initialVnode: any, container, parentComponent) {
    const instance = createComponentInstance(initialVnode, parentComponent);

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
    patch(subTree, container, instance);

    // element 处理完成
    initialVnode.el = subTree.el;
}

