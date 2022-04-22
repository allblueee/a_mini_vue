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
    console.log(instance)
    const { setup } = Component;

    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });

        handleSetupResult(instance, setupResult);
    }
}

function handleSetupResult(instance, setupResult: any) {
    // function / Object

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

