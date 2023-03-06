import { ShapeFlags } from "../shared/ShapeFlags";

export const Fragment = Symbol("Fragment")
export const Textt = Symbol("Text")
export function createVNode(type, props?, children?) {
    // 可选 因此添加问号
    // 创建虚拟节点
    const vnode = {
        type,
        props,
        children,
        component: null,
        shapeFlags: getShapeFlags(type),
        el: null
    };
    // children 是标签里的内容 还是 数组 (数组里可能是 Element/Stateful_Component)
    if (typeof children === "string") {
        vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN
    }

    // 是组件类型 继续判断 children 
    if (vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
        // 如果是 有状态组件
        if (typeof children === "object") {
            // children 是对象 那么添加 Slot标签
            vnode.shapeFlags |= ShapeFlags.SLOT_CHILDREN
        }
    }
    // 返回虚拟节点
    return vnode;
}

// 判断是 Element 标签 
// 还是 组件 包含 render 和 setup
function getShapeFlags(type) {
    return typeof type === "string" ? ShapeFlags.Element : ShapeFlags.STATEFUL_COMPONENT
}

export function createTextVNode(text: string) {
    return createVNode(Textt, {}, text)
}