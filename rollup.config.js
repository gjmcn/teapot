import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from "rollup-plugin-terser";

export default {
    input: 'src/index.js',
    treeshake: false,
    output: {
        file: "dist/teapot.min.js",
        format: 'es', 
        exports: 'named'
    },
    plugins: [
        nodeResolve(),
        terser({"compress": {"arrows": false}})
    ]
};