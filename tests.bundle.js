const requireTest = require.context('./test', true, /\.test\.js$/);
for (let file of requireTest.keys()) {
  requireTest(file);
}
