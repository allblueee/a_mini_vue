import { h, createTextVNode } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js';

window.self = null;
export const App = {
    // <template>
    // render
    name: "App",
    render() {
        const foo = h(
            Foo,
            {},
            {
                // element 必须指定标签
                // text 无标签
                header: ({ age }) => [
                    h("p", {}, "header" + age),
                    createTextVNode("你好allblueee")
                ],
                footer: () => h("p", {}, "footer")
            })
        // const foo = h(Foo, {}, [h("p", {}, "456")])
        return h("div", {}, [foo])
    },

    setup() {
        // composition API
        return {}
    }
}