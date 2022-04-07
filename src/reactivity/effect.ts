import { extend } from "../shared";

class ReactiveEffect {
    private _fn: any;
    public scheduler: Function | undefined;
    deps = [];
    active = true;
    onStop?: () => void
    constructor(fn, scheduler?: Function) {
        this._fn = fn;
        this.scheduler = scheduler
    }
    run() {
        activeEffect = this;
        return this._fn();
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if(this.onStop){
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {

    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    });
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
    if (!!activeEffect) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep)
    }
}
let activeEffect;
export function effect(fn, options: any = {}) {
    // scheduler 
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // options
    Object.assign(_effect, options);
    extend(_effect, options)
    _effect.run();
    
    const runner: any = _effect.run.bind(_effect);
    // 有可能会丢失 _fn()
    runner.effect = _effect;
    // 修改函数的 this指向为 ReactiveEffect 实例
    return runner;
}

export function trigger(target, key) {
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else
            effect.run();
    }
}

export function stop(runner) {
    runner.effect.stop();
}