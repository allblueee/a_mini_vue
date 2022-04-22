import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js';

window.self = null;
export const App = {
    // <template>
    // render
    name: "App",
    render() {
        const app = h("div", {}, "App");
        const foo = h(
            Foo,
            {},
            {
                header: ({ age }) => h("p", {}, "header" + age),
                footer: () => h("p", {}, "footer")
            })
        // const foo = h(Foo, {}, [h("p", {}, "456")])
        return h("div", {}, [app, foo])
    },

    setup() {
        // composition API
        return {}
    }
}