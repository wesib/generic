import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { externalModules } from '@run-z/rollup-helpers';
import path from 'path';
import flatDts from 'rollup-plugin-flat-dts';
import sourcemaps from 'rollup-plugin-sourcemaps';
import ts from 'rollup-plugin-typescript2';
import typescript from 'typescript';

export default {
  input: {
    'wesib.generic': './src/index.ts',
    'wesib.styp': './src/styp/index.ts',
  },
  plugins: [
    commonjs(),
    ts({
      typescript,
      tsconfig: 'tsconfig.main.json',
      cacheRoot: 'target/.rts2_cache',
      useTsconfigDeclarationDir: true,
    }),
    nodeResolve(),
    sourcemaps(),
  ],
  external: externalModules(),
  treeshake: {
    moduleSideEffects: false,
  },
  manualChunks(id) {
    if (id.startsWith(path.resolve('src', 'styp') + path.sep)) {
      return 'wesib.styp';
    }
    if (id.startsWith(path.resolve('src', 'theme') + path.sep)) {
      return 'wesib.styp';
    }
    return 'wesib.generic';
  },
  output: [
    {
      format: 'cjs',
      sourcemap: true,
      dir: './dist',
      entryFileNames: '[name].cjs',
      chunkFileNames: '_[name].cjs',
      hoistTransitiveImports: false,
    },
    {
      format: 'esm',
      sourcemap: true,
      dir: '.',
      entryFileNames: 'dist/[name].js',
      chunkFileNames: 'dist/_[name].js',
      hoistTransitiveImports: false,
      plugins: [
        flatDts({
          tsconfig: 'tsconfig.main.json',
          lib: true,
          compilerOptions: {
            declarationMap: true,
          },
          entries: {
            styp: {
              file: 'styp/index.d.ts',
            },
            theme: {
              as: 'styp',
              file: 'styp/index.d.ts',
            },
          },
          internal: ['**/impl/**', '**/*.impl'],
        }),
      ],
    },
  ],
};
