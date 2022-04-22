import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
    setup(props) {
        // props 不可修改，readonly
        console.log(props)
    },
    render() {
        return h("div", {}, "foo: " + this.count)
    },
}