const Babel = require('rollup-plugin-babel');

module.exports = [
  'react',
  'preact',
].map((name) => {
  return {
    input: `src/${name}.mjs`,
    output: {
      file: `./${name}.mjs`,
      format: 'esm'
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
