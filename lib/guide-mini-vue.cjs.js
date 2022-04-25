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

function createComponentInstance(vnode, parent) {
    console.log("create", parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
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
    // console.log(instance)
    const { setup } = Component;
    if (setup) {
        // 设置当前实例对象
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        // 由于 getCurrentInstance 函数都是在setup函数内部调用
        // 因此调用完成做一个清空操作
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function / Object
    // 有可能是函数类型的
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
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol("Fragment");
const Textt = Symbol("Text");
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
    // children 是标签里的内容 还是 数组 (数组里可能是 Element/Stateful_Component)
    if (typeof children === "string") {
        vnode.shapeFlags |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* ARRAY_CHILDREN */;
    }
    // 是组件类型 继续判断 children 
    if (vnode.shapeFlags & 2 /* STATEFUL_COMPONENT */) {
        // 如果是 有状态组件
        if (typeof children === "object") {
            // children 是对象 那么添加 Slot标签
            vnode.shapeFlags |= 16 /* SLOT_CHILDREN */;
        }
    }
    // 返回虚拟节点
    return vnode;
}
// 判断是 Element 标签 
// 还是 组件 包含 render 和 setup
function getShapeFlags(type) {
    return typeof type === "string" ? 1 /* Element */ : 2 /* STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Textt, {}, text);
}

function render(vnode, container) {
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
            processText(vnode, container);
            break;
        default:
            if (shapeFlags & 1 /* Element */) {
                // 处理 element 
                processElement(vnode, container, parentComponent);
            }
            else if (shapeFlags & 2 /* STATEFUL_COMPONENT */) {
                // 处理组件
                processComponent(vnode, container, parentComponent);
            }
    }
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent);
}
// 处理 element 流程
function processElement(vnode, container, parentComponent) {
    // init / update
    mountElement(vnode, container, parentComponent);
}
function mountElement(vnode, container, parentComponent) {
    const el = (vnode.el = document.createElement(vnode.type));
    // string array
    const { children, shapeFlags } = vnode;
    if (shapeFlags & 4 /* TEXT_CHILDREN */) {
        // text children
        el.textContent = children;
    }
    else if (shapeFlags & 8 /* ARRAY_CHILDREN */) {
        // array children
        mountChildren(vnode, el, parentComponent);
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
function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
        patch(v, container, parentComponent);
    });
}
// 处理组件部分流程
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
function mountComponent(initialVnode, container, parentComponent) {
    const instance = createComponentInstance(initialVnode, parentComponent);
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
    patch(subTree, container, instance);
    // element 处理完成
    initialVnode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // component -> vnode
            // 基于虚拟节点操作
            // 转换为虚拟节点 vnode
            debugger;
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
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function provide(key, value) {
    // 存
    // key value
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provide;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            else
                return defaultValue;
        }
    }
}

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.renderSlots = renderSlots;
