// require all modules ending in "_test" from the
// current directory and all subdirectories
const testContext = require.context('.', true, /\.test\.ts$/);

testContext.keys().forEach(testContext);
