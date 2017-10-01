var requireTest = require.context('./test', true, /\.test\.js$/);
var files = requireTest.keys();
// run each of them
files.forEach((file) => {
    return requireTest(file);
});
