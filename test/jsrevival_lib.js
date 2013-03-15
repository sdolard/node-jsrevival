var
assert = require('assert'),
jsrevival = require('../lib/jsrevival');

describe('jsrevival lib', function(){
	describe ('a jsrevival instance', function() {
		it ('should call `ready` event with jslint edition param', function(done){
			var linter = jsrevival.create();
			linter.on('ready', function (edition) {
				var s = String(edition);
				assert.strictEqual(s.length > 0, true);
				done();
			});
		});

		it ('should call `end` event when it `finished`', function(done){
			var linter = jsrevival.create();
			linter.on('ready', function (edition) {
				linter.lint(__dirname + '/Rtest/test.js');
			});
			linter.on('end', function () {
				done();
			});
		});
	});
});
