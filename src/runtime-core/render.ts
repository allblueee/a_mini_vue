import { effect } from "../reactivity";
import { EMPTY_OBJ, isObject } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Textt } from "./vnode";

export function createRenderer(options) {

    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options
    function render(vnode, container) {
        patch(null, vnode, container, null);

    }
    // n1 -> old
    // n2 -> new
    function patch(n1, n2, container, parentComponent) {
        // ShapeFlags 判断 vnode类型
        // 判断 vnode 是不是一个 element？
        // 区分 element 和 component 
        const { type, shapeFlags } = n2;

        // Fragment 只渲染 children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Textt:
                processText(n1, n2, container)
                break;
            default:
                if (shapeFlags & ShapeFlags.Element) {
                    // 处理 element 
                    processElement(n1, n2, container, parentComponent);

                } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
                    // 处理组件
                    processComponent(n1, n2, container, parentComponent);

                }
        }
    }

    function processText(n1, n2: any, container: any) {
        const { children } = n2
        const textNode = (n2.el = document.createTextNode(children))
        container.append(textNode)
    }

    function processFragment(n1, n2: any, container: any, parentComponent) {
        mountChildren(n2, container, parentComponent)
    }


    // 处理 element 流程
    function processElement(n1, n2: any, container: any, parentComponent) {
        // init / update
        if (!n1) {
            mountElement(n2, container, parentComponent);
        } else {
            patchELement(n1, n2, container);
        }
    }
    function patchELement(n1, n2, container) {
        console.log("patchElement")
        console.log("n1", n1, "n2", n2)
        // props
        // children
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ; 
        const el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps)
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key]
                const nextProp = newProps[key]

                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp)
                }
            }
            // if (oldProps !== {}) {
            //     This condition will always return 'true' since JavaScript compares objects by reference, not value.
            if(oldProps !== EMPTY_OBJ){
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null)
                    }
                }
            }
        }
    }
    function mountElement(vnode: any, container: any, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type))

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

            hostPatchProp(el, key, null, val)
        }

        // container.append(el);
        hostInsert(el, container)
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((v) => {
            patch(null, v, container, parentComponent);
        })
    }


    // 处理组件部分流程
    function processComponent(n1, n2: any, container: any, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVnode: any, container, parentComponent) {
        const instance = createComponentInstance(initialVnode, parentComponent);

        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }

    function setupRenderEffect(instance: any, initialVnode, container) {
        // 更新逻辑的核心
        // 依赖变化，则重新执行 render 函数 + patch
        // 怎么收集的依赖呢？ 在 render 函数中访问了很多响应式对象啊
        effect(() => {
            if (!instance.isMounted) {
                console.log("init")
                const { proxy } = instance;
                // 代理 实例上的 setupState 中的属性 这里是 msg
                // 又是 this 指向的理解，函数内 this 的指向调用他的对象/函数的 this
                // this 链的继承？
                // 在 proxy 这里调用 h函数时，由于 proxy 已经处理好了 setup 中的数据，因此可以用 this.msg 拿到
                // 在 h函数里调用 this.$el 也是如此代理的方式
                // 存储旧节点 subTree
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);

                // element 处理完成
                initialVnode.el = subTree.el;
                // 初始化完成
                instance.isMounted = true;
            } else {
                console.log("update")
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;

                // 更新旧节点，为当前节点，为下一次更新做铺垫
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        })

    }
    return {
        createApp: createAppAPI(render)
    }
}