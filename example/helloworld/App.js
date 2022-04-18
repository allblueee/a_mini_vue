import { h } from '../../lib/guide-mini-vue.esm.js'


export const App = {
    // <template>
    // render
    render() {
        return h(
            "div",
            {
                id: "root",
                class: ["red", "hard"]
            },
            // "string"
            // Array
            [h("p", {class:"red"},"hi"),h("p", {class:"blue"},"allblueee")]
        );
    },

    setup() {
        // composition API
        return {
            msg: "allbllueee"
        }
    }
}