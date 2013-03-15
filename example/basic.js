var
jsrevival = require('../lib/jsrevival'),
linter = jsrevival.create();

linter.on('ready', function() {
	//linter.lint(__dirname + '/../test/Rtest/test.js');
});

linter.on('lint', function (errors, filename) {
	console.log("filename: %s, error count: %d", filename, errors.length);
});


linter.on('end', function () {
	console.log("end");
});