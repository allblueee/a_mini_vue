import { hasChanged } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";

class RefImpl {
    private _value: any;
    public dep;
    constructor(value) {
        this._value = value
        this.dep = new Set()
    }

    get value() {
        // 收集依赖到 dep
        trackRefValue(this)
        return this._value
    }

    set value(newValue) {
        if (hasChanged(newValue, this._value)) {
            this._value = newValue
            // 触发依赖
            triggerEffects(this.dep)
        }
    }
}

export function ref(value) {
    return new RefImpl(value)
}

function trackRefValue(ref){
    if (isTracking()) {
        trackEffects(ref.dep)
    }
}