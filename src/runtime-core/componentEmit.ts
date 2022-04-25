import { camelize, toHandlerKey } from "../shared";

export function emit(instance, event, ...args) {
    console.log("event", event)

    // 在父组件的 instance.props 中找是否有 event 这个事件名
    const { props } = instance;
    // event -> 首字母大小
    // add-foo -> addFoo


    const handlerName = toHandlerKey(camelize(event))
    const handler = props[handlerName]
    handler & handler(...args)
}