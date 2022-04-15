import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
    private _value: any;
    public dep;
    private _rawvalue: any;
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

function convert(value) {
    return isObject(value)?reactive(value):value
}

export function ref(value) {
    return new RefImpl(value)
}

function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep)
    }
}