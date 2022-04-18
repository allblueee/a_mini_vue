import {h} from '../../lib/guide-mini-vue.esm.js'


export const App = {
    // <template>
    // render
    render(){
        return h("div","hi, "+this.allblueee)
    },

    setup() {
        // composition API
        return {
            msg: "allbllueee"
        }
    }
}