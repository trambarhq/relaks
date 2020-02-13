const requireTest = require.context('./test', true, /\.test\.js$/);
const files = requireTest.keys();
// run each of them
files.forEach((file) => {
  return requireTest(file);
});
