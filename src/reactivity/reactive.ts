import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive",
}

export function reactive(raw) {
    return createActiveObject(raw, mutableHandlers)
}

export function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers)
}

export function isReactive(value) {
    // 如果 value 不是一个 proxy 代理对象 那么不会触发 get方法进行判断
    // 属性上没有 "__v_isReactive" 则值为 undefined。通过两次 ! 进行判断
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value) {
    return !value[ReactiveFlags.IS_REACTIVE]
}

function createActiveObject(raw: any, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}