import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js';

window.self = null;
export const App = {
    // <template>
    // render
    name:"App",
    render() {
        window.self = this
        return h(
            "div",
            {
                id: "root",
                class: ["red", "hard"],
                onClick() {
                    console.log("clicked");
                },
            },
            // "string"
            // "hi, " + this.ms
            // Array
            [h("p", { class: "red" }, "hi"),
            h("p", { class: "blue" }, this.msg),
            h(Foo, {
                count: 1
            })]
        );
    },

    setup() {
        // composition API
        return {
            msg: "allbllueee"
        }
    }
}