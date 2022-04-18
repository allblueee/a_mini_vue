import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'
// rollup 支持 esm 语法
export default {
    input:"./src/index.ts",
    output:[
        // 打包两种模块规范
        // 1.cjs
        // 2.esm
        {
            format: "cjs",
            file: pkg.main
        },
        {
            format: "es",
            file: pkg.module
        }
    ],
    plugins:[
        // rollup/plugin-typescript
        typescript()
    ],
}