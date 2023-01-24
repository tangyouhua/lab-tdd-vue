// reactive返回传入obj的代理对象，值更新时使app更新
export function reactive(obj) {
    return new Proxy(obj, {
        get(target, key) {
            const result = Reflect.get(target, key)
            return result
        },
        set(target, key, value) {
            const result = Reflect.set(target, key, value)
            return result
        },
        deleteProperty(target, key) {
            const result = Reflect.deleteProperty(target, key)
            return result
        }
    })
}