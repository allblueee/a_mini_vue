import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
    };
    return component;
}

export function setupComponent(instance) {
    // initProps()
    // initSlots()

    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
    console.log(instance)
    const { setup } = Component;

    if (setup) {
        const setupResult = setup();

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

