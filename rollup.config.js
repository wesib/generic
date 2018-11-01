import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import { uglify } from 'rollup-plugin-uglify';

function makeConfig(baseConfig, ...configs) {
  return configs.reduce(
      (prev, config) => ({
        ...prev,
        ...config,
        plugins: config.plugins ? [ ...prev.plugins, ...config.plugins ] : prev.plugins,
        output: { ...prev.output, ...config.output },
      }),
      baseConfig);
}

const uglifyConfig = {
  plugins: [
    uglify({
      compress: {
        typeofs: false,
      },
      output: {
        ascii_only: true,
      },
    }),
  ]
};

const terserConfig = {
  plugins: [
    terser({
      module: true,
      keep_classnames: true,
    }),
  ],
};

function baseConfig(tsconfig) {
  return {
    plugins: [
      commonjs(),
      typescript({
        typescript: require('typescript'),
        tsconfig: tsconfig,
        cacheRoot: 'target/.rts2_cache',
        useTsconfigDeclarationDir: true,
      }),
      nodeResolve({
        jsnext: true,
        main: false,
        preferBuiltins: false,
      }),
      sourcemaps(),
    ],
    input: './src/index.ts',
    output: {
      format: 'umd',
      sourcemap: true,
      name: 'wesib.generic',
      globals: {
        '@wesib/wesib': 'wesib',
      }
    },
  };
}

const umdConfig = makeConfig(
    baseConfig('tsconfig.umd.json'),
    {
      external: [
        '@wesib/wesib',
        'a-iterable',
      ],
      output: {
        file: './dist/wesib.generic.umd.js',
      },
    },
    uglifyConfig);

const esm5Config = makeConfig(
    baseConfig('tsconfig.esm5.json'),
    {
      external: [
        '@wesib/wesib',
        'a-iterable',
        'tslib',
      ],
      output: {
        format: 'es',
        file: './dist/wesib.generic.esm5.js',
      },
    },
    terserConfig);

const esm2015Config = makeConfig(
    baseConfig('tsconfig.esm2015.json'),
    {
      external: [
        '@wesib/wesib',
        'a-iterable',
        'tslib',
      ],
      output: {
        format: 'es',
        file: './dist/wesib.generic.esm2015.js',
      },
    },
    terserConfig);

export default [
  umdConfig,
  esm5Config,
  esm2015Config,
]
