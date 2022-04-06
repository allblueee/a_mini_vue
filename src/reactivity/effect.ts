class ReactiveEffect {
    private _fn: any;
    constructor(fn, public scheduler?) {
        this._fn = fn;
    }
    run() {
        activeEffect = this;
        return this._fn();
    }
}

const targetMap = new Map()

export function track(target, key) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if (!dep) {
        dep = new Set(); 
        depsMap.set(key, dep);
    }
    dep.add(activeEffect)

}
let activeEffect;
export function effect(fn, options: any = {}) {
    const scheduler = options.scheduler;
    const _effect = new ReactiveEffect(fn, scheduler);
    _effect.run();
    // 修改函数的 this指向为 ReactiveEffect 实例
    return _effect.run.bind(_effect)
}

export function trigger(target, key) {
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    for (const effect of dep) {
        if(effect.scheduler){
            effect.scheduler();
        }
        else
        effect.run();
    }
}