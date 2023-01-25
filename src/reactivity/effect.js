//effect.js
export let activeEffect
// effect(fn, options)
// 注册副作用函数
const effectStack = [] // 支持嵌套
export function effect(fn, options = {}) {
    // 封装一个effectFn用于扩展功能
    const effectFn = () => {
        activeEffect = effectFn
        effectStack.push(effectFn)
        fn()
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
    }
    effectFn.options = options // 增加选项以备trigger时使用
    effectFn()
}

// WeakMap: key支持对象
const targetMap = new WeakMap()

// track(targe, key)
// 跟踪副作用函数
export function track(target, key) {
    if (activeEffect) {
        let depsMap = targetMap.get(target)

        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()))
        }

        let deps = depsMap.get(key)
        if (!deps) {
            // fn作为value不重复
            depsMap.set(key, (deps = new Set()))
        }

        deps.add(activeEffect)
    }
}

// trigger(target, key)
// 触发响应式函数: scheduler()异步调用, dep() 同步调用
export function trigger(target, key) {
    const depsMap = targetMap.get(target)

    if (depsMap) {
        const deps = depsMap.get(key)

        //增加scheduler判断
        deps && deps.forEach(dep => {
            if (dep.options.scheduler) {
                dep.options.scheduler(dep)
            } else {
                dep()
            }
        })
    }
}