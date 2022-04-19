

export function createVNode(type, props?, children?) {
    // 可选 因此添加问号
    // 创建虚拟节点
    const vnode = {
        type,
        props,
        children,
        el: null
    };
    // 返回虚拟节点
    return vnode;
}