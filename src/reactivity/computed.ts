import {ReactiveEffect} from "./effect"

class ComputedRefImpl {
    private _getter: any;
    private _value: any;
    private _effect: any;
    private _dirty: boolean = true;
    constructor(getter) {
        this._getter = getter

        this._effect = new ReactiveEffect(getter, ()=>{
            if(!this._dirty) {
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

export function computed(getter) {
    return new ComputedRefImpl(getter);
}