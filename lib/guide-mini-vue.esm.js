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
        vnode.shapeFlags |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 是组件类型 继续判断 children 
    if (vnode.shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        // 如果是 有状态组件
        if (typeof children === "object") {
            // children 是对象 那么添加 Slot标签
            vnode.shapeFlags |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    // 返回虚拟节点
    return vnode;
}
// 判断是 Element 标签 
// 还是 组件 包含 render 和 setup
function getShapeFlags(type) {
    return typeof type === "string" ? 1 /* ShapeFlags.Element */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Textt, {}, text);
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

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasChanged = (val, newvalue) => {
    return !Object.is(val, newvalue);
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

let activeEffect;
let shouldtrack;
const targetMap = new Map();
function effect(fn, options = {}) {
    // scheduler 
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // options
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    // 有可能会丢失 _fn()
    runner.effect = _effect;
    // 修改函数的 this指向为 ReactiveEffect 实例
    return runner;
}
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        // 更准确的来说 在被绑定函数内部，一定会通过get触发我们的响应式对象。
        // 只有 effect 函数内部调用 run函数，通过_fn函数内部get触发响应式对象，才可以进行依赖收集
        shouldtrack = true;
        activeEffect = this;
        const result = this._fn();
        shouldtrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function isTracking() {
    return shouldtrack && activeEffect !== undefined;
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
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
function stop(runner) {
    runner.effect.stop();
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
        if (!isReadonly) {
            track(target, key);
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
function isReactive(value) {
    // 如果 value 不是一个 proxy 代理对象 那么不会触发 get方法进行判断
    // 属性上没有 "__v_isReactive" 则值为 undefined。通过两次 ! 进行判断
    return !!value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function isReadonly(value) {
    return !!value["__v_isReadonly" /* ReactiveFlags.IS_READONLY */];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function createReactiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target: ${raw} 必须是一个对象`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

function ref(value) {
    return new RefImpl(value);
}
// ref 是单值类型
// proxy 只针对对象进行代理，不能代理原始值
// 因此用 对象包裹 ref
class RefImpl {
    constructor(value) {
        this._v_isRef = true;
        this._rawvalue = value;
        this._value = convert(value);
        // value 是对象 则用 reactive 包裹
        // 如 {count:1}是value值
        this.dep = new Set();
    }
    get value() {
        // 收集依赖到 dep
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawvalue)) {
            this._rawvalue = newValue;
            // 触发依赖
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
// 根据 value 类型 判断是否需要响应式
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function isRef(ref) {
    return !!ref._v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                // value 不是 isRef 类型。
                // 但仍然要保持这个属性是 Ref 类型。因此改变 value 的值
                return (target[key].value = value);
            }
            else {
                // 如果属性不是 Ref 或者 要赋值的是 Ref 类型，那么直接赋值就好
                return Reflect.set(target, key, value);
                // return target[key] = value
            }
        }
    });
}

class ComputedRefImpl {
    constructor(getter) {
        this._dirty = true;
        this._getter = getter;
        this._effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true;
            }
        });
    }
    get value() {
        if (this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
            // 在取值时，进行 computed 函数调用，从而触发依赖值的 get，然后进行 track 跟踪
            // 在 set 依赖值时，进行 trigger，调用 schdule ，改变 dirty 从而在下次 get时更新值
            // 是否会重复收集依赖？
            // 收集时，会检查重复？
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedRefImpl(getter);
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
    if (vnode.shapeFlags & 16 /* ShapeFlags.SLOT_CHILDREN */) {
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
        isMounted: false,
        subTree: {},
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
        instance.setupState = proxyRefs(setupResult);
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

function createAppAPI(render) {
    return function createApp(rootComponent) {
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
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options;
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
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlags & 1 /* ShapeFlags.Element */) {
                    // 处理 element 
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(n1, n2, container, parentComponent);
                }
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2, container, parentComponent);
    }
    // 处理 element 流程
    function processElement(n1, n2, container, parentComponent) {
        // init / update
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchELement(n1, n2);
        }
    }
    function patchELement(n1, n2, container) {
        console.log("patchElement");
        console.log("n1", n1, "n2", n2);
        // props
        // children
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps);
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            // if (oldProps !== {}) {
            //     This condition will always return 'true' since JavaScript compares objects by reference, not value.
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        // string array
        const { children, shapeFlags } = vnode;
        if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // text children
            el.textContent = children;
        }
        else if (shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // array children
            mountChildren(vnode, el, parentComponent);
        }
        // props 
        const { props } = vnode;
        for (const key in props) {
            // console.log(key)
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // container.append(el);
        hostInsert(el, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    }
    // 处理组件部分流程
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container) {
        // 更新逻辑的核心
        // 依赖变化，则重新执行 render 函数 + patch
        // 怎么收集的依赖呢？ 在 render 函数中访问了很多响应式对象啊
        effect(() => {
            if (!instance.isMounted) {
                console.log("init");
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
            }
            else {
                console.log("update");
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                // 更新旧节点，为当前节点，为下一次更新做铺垫
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    // 格式 on + Event name 
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const evenet = key.slice(2).toLowerCase();
        el.addEventListener(evenet, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null)
            el.removeAttribute(key);
        else
            el.setAttribute(key, nextVal);
    }
}
function insert(el, parent) {
    parent.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { ReactiveEffect, computed, createApp, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, provide, proxyRefs, reactive, readonly, ref, renderSlots, shallowReadonly, stop, unRef };
