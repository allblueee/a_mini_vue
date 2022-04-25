import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { }
    };
    // bind 让用户不需要传递 instance
    component.emit = emit.bind(null, component) as any;

    return component;
}

export function setupComponent(instance) {
    initProps(instance, instance.vnode.props)
    initSlots(instance, instance.vnode.children)

    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
    // console.log(instance)
    const { setup } = Component;

    if (setup) {
        // 设置当前实例对象
        setCurrentInstance(instance)

        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        // 由于 getCurrentInstance 函数都是在setup函数内部调用
        // 因此调用完成做一个清空操作

        setCurrentInstance(null)
        
        handleSetupResult(instance, setupResult);
    }
}

function handleSetupResult(instance, setupResult: any) {
    // function / Object
    // 有可能是函数类型的
    if (typeof setupResult === "object") {
        // setupState
        instance.setupState = setupResult;
    }

    finishComponentSetup(instance);
}


function finishComponentSetup(instance: any) {
    const Component = instance.type;

    if (Component.render) {
        instance.render = Component.render;
    }
}

let currentInstance = null

export function getCurrentInstance() {
    return currentInstance
}

export function setCurrentInstance(instance) {
    currentInstance = instance
}