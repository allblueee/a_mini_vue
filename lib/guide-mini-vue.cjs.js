'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

const targetMap = new Map();
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else
            effect.run();
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive") {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly") {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set: function (target, key, value) {
        console.warn(`key:${key} set 失败，因为 readonly`);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function createReactiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target: ${raw} 必须是一个对象`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

function emit(instance, event, ...args) {
    console.log("event", event);
    // 在父组件的 instance.props 中找是否有 event 这个事件名
    const { props } = instance;
    // event -> 首字母大小
    // add-foo -> addFoo
    debugger;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler & handler(...args);
}

// 单一职责
function initProps(instance, rawprops) {
    // attrs ?
    instance.props = rawprops || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 从 setupstate 获取值
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    // instance.slots = Array.isArray(children) ? children : [children]
    const { vnode } = instance;
    if (vnode.shapeFlags & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotsValue(value(props));
    }
}
function normalizeSlotsValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { }
    };
    // bind 让用户不需要传递 instance
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    console.log(instance);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function / Object
    if (typeof setupResult === "object") {
        // setupState
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    // 1.patch
    patch(vnode, container);
}
function patch(vnode, container) {
    // ShapeFlags 判断 vnode类型
    // 判断 vnode 是不是一个 element？
    // 区分 element 和 component 
    // console.log(typeof vnode.type)
    const { shapeFlags } = vnode;
    if (shapeFlags & 1 /* Element */) {
        // 处理 element 
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 处理组件
        processComponent(vnode, container);
    }
}
// 处理 element 流程
function processElement(vnode, container) {
    // init / update
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    // string array
    const { children, shapeFlags } = vnode;
    if (shapeFlags & 4 /* TEXT_CHILDREN */) {
        // text children
        el.textContent = children;
    }
    else if (shapeFlags & 8 /* ARRAY_CHILDREN */) {
        // array children
        mountChildren(vnode, el);
    }
    // props 
    const { props } = vnode;
    for (const key in props) {
        // console.log(key)
        const val = props[key];
        // 格式 on + Event name 
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const evenet = key.slice(2).toLowerCase();
            el.addEventListener(evenet, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
// 处理组件部分流程
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
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

function createVNode(type, props, children) {
    // 可选 因此添加问号
    // 创建虚拟节点
    const vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlags(type),
        el: null
    };
    if (typeof children === "string") {
        vnode.shapeFlags |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* ARRAY_CHILDREN */;
    }
    // 组件类型 + children object
    if (vnode.shapeFlags & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlags |= 16 /* SLOT_CHILDREN */;
        }
    }
    // 返回虚拟节点
    return vnode;
}
function getShapeFlags(type) {
    return typeof type === "string" ? 1 /* Element */ : 2 /* STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // component -> vnode
            // 基于虚拟节点操作
            // 转换为虚拟节点 vnode
            // debugger;
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode("div", {}, slot(props));
        }
    }
}

exports.createApp = createApp;
exports.h = h;
exports.renderSlots = renderSlots;
