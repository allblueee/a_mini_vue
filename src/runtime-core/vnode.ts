import { ShapeFlags } from "../shared/ShapeFlags";


export function createVNode(type, props?, children?) {
    // 可选 因此添加问号
    // 创建虚拟节点
    const vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlags(type),
        el: null
    };
    if(typeof children === "string"){
        vnode.shapeFlags  |= ShapeFlags.TEXT_CHILDREN
    }
    else if(Array.isArray(children)){
        vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN
    }
    // 返回虚拟节点
    return vnode;
}

function getShapeFlags(type) {
    return typeof type === "string" ? ShapeFlags.Element : ShapeFlags.STATEFUL_COMPONENT
}