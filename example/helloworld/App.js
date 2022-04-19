import { h } from '../../lib/guide-mini-vue.esm.js'

window.self = null;
export const App = {
    // <template>
    // render
    render() {
        window.self = this;
        return h(
            "div",
            {
                id: "root",
                class: ["red", "hard"]
            },
            // "string"
            "hi, " + this.msg
            // Array
            // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "allblueee")]
        );
    },

    setup() {
        // composition API
        return {
            msg: "allbllueee"
        }
    }
}