import { createRenderer } from '../runtime-core'

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    // 格式 on + Event name 
    const isOn = (key: string) => /^on[A-Z]/.test(key)
    if (isOn(key)) {
        const evenet = key.slice(2).toLowerCase();
        el.addEventListener(evenet, val)
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el,parent) { 
    parent.append(el)
}

const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert
})

export function createApp(...args) {
    return renderer.createApp(...args)
}

export * from '../runtime-core'
