import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js';

window.self = null;
export const App = {
    // <template>
    // render
    name: "App",
    render() {
        window.self = this
        return h("div", {}, [h("div", {}, "App"), h(Foo, {
            // 组件 emit on+Event
            onAdd(a,b){
                console.log("onAdd",a,b)
            },
            onAddFoo(a,b){
                console.log("onAddFoo",a,b)
            }
        })])
    },

    setup() {
        // composition API
        return {}
    }
}