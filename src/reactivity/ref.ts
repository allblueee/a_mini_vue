import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";


export function ref(value) {
    return new RefImpl(value)
}
// ref 是单值类型
// proxy 只针对对象进行代理，不能代理原始值
// 因此用 对象包裹 ref
class RefImpl {
    private _value: any;
    public dep;
    private _rawvalue: any;
    public _v_isRef = true;
    constructor(value) {
        this._rawvalue = value;
        this._value = convert(value)
        // value 是对象 则用 reactive 包裹
        // 如 {count:1}是value值
        this.dep = new Set()
    }

    get value() {
        // 收集依赖到 dep
        trackRefValue(this)
        return this._value
    }

    set value(newValue) {
        if (hasChanged(newValue, this._rawvalue)) {
            this._rawvalue = newValue
            // 触发依赖
            this._value = convert(newValue)
            triggerEffects(this.dep)
        }
    }
}

// 根据 value 类型 判断是否需要响应式
function convert(value) {
    return isObject(value) ? reactive(value) : value
}


function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep)
    }
}

export function isRef(ref) {
    return !!ref._v_isRef
}

export function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },

        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                // value 不是 isRef 类型。
                // 但仍然要保持这个属性是 Ref 类型。因此改变 value 的值
                return (target[key].value = value);
            } else {
                // 如果属性不是 Ref 或者 要赋值的是 Ref 类型，那么直接赋值就好
                return Reflect.set(target, key, value);
                // return target[key] = value
            }
        }
    })
}