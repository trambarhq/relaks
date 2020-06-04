import Babel from 'rollup-plugin-babel';

export default [
  'react',
  'preact',
].map((name) => {
  return {
    input: `src/${name}.mjs`,
    output: {
      file: `./${name}.js`,
      format: 'umd',
      name: 'Relaks',
      exports: 'named',
      globals: {
        react: 'React',
        preact: 'Preact',
      }
    },
    plugins: [
      Babel({
        presets: [
          '@babel/env',
        ],
      }),
    ],
    external: [ 'react', 'preact' ],
  };
});
