var
assert = require('assert'),
JSRevival = require('../lib/jsrevival'),
EREADY = 0,
EERROR= 0,
linter = JSRevival.create();
linter.on('ready', function() {
	EREADY++;	
});
linter.on('error', function(err) {
		EERROR++;
});

process.on('exit', function () {
		// Event
		assert.strictEqual(EREADY, 1, 'EREADY');
		assert.strictEqual(EERROR, 0, 'EERROR');
});
