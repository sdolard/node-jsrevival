var
JSRevival = require('../lib/jsrevival'),
linter = JSRevival.create();
linter.on('ready', function() {
		linter.lint({
				filename: __dirname + '/file-0.js'
		});
});
linter.on('error', function(err) {
		console.log(err);
});

