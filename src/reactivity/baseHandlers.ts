import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive } from "./reactive";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true)

function createGetter(isReadonly = false) {
    return function get(target, key) {
        if(key === "__v_isReactive") {
            return !isReadonly;
        }
        const res = Reflect.get(target, key);

        if(isObject(res)){
            return reactive(res)
        }

        if (!isReadonly) {
            track(target, key);
        }
        return res;
    }
}

function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);

        trigger(target, key);
        return res;
    }
}


export const mutableHandlers = {
    get,
    set
}

export const readonlyHandlers = {
    get: readonlyGet,
    set: function (target, key, value) {
    console.warn(`key:${key} set 失败，因为 readonly`)
        return true;
    }
}