import { externalModules } from '@proc7ts/rollup-helpers';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import path from 'path';
import sourcemaps from 'rollup-plugin-sourcemaps';
import ts from 'rollup-plugin-typescript2';
import typescript from 'typescript';

export default {
  input: {
    'wesib.generic': './src/index.ts',
    'wesib.input': './src/input/index.ts',
    'wesib.styp': './src/styp/main.ts',
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
    if (id.startsWith(path.join(__dirname, 'src', 'styp') + path.sep)) {
      return 'wesib.styp';
    }
    if (id.startsWith(path.join(__dirname, 'src', 'theme') + path.sep)) {
      return 'wesib.styp';
    }
    if (id.startsWith(path.join(__dirname, 'src', 'input') + path.sep)) {
      return 'wesib.input';
    }
    return 'wesib.generic';
  },
  output: [
    {
      format: 'cjs',
      sourcemap: true,
      dir: './dist',
      entryFileNames: '[name].cjs',
      chunkFileNames: `_[name].cjs`,
      hoistTransitiveImports: false,
    },
    {
      format: 'esm',
      sourcemap: true,
      dir: './dist',
      entryFileNames: '[name].js',
      chunkFileNames: `_[name].js`,
      hoistTransitiveImports: false,
    },
  ],
};
