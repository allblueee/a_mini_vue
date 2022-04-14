import { extend } from "../shared";

let activeEffect;
let shouldtrack;
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

    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    });
    effect.deps.length = 0;
}

const targetMap = new Map()

export function track(target, key) {

    if (!isTracking()) return;
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
    if(dep.has(activeEffect)) return;
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}

function isTracking() {
    return shouldtrack && activeEffect !== undefined
}
export function effect(fn, options: any = {}) {
    // scheduler 
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // options
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