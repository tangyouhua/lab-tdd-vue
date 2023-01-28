var Reactivity = (function (exports) {
    'use strict'

    //effect.js
    exports.activeEffect = void 0
    function effect(fn) {
        exports.activeEffect = fn
        fn()
    }

    const effects = []
    // reactive() returns obj proxy, and updates app while obj's value changes
    function reactive(obj) {
        return new Proxy(obj, {
            get(target, key) {
                effects.push(exports.activeEffect)
                return Reflect.get(target, key)
            },
            set(target, key, value) {
                const result = Reflect.set(target, key, value)
                effects.forEach(fn => fn())
                return result
            },
            deleteProperty(target, key) {
                const result = Reflect.deleteProperty(target, key)
                effects.forEach(fn => fn())
                return result
            }
        })
    }

    exports.effect = effect
    exports.reactive = reactive

    return exports
})({})