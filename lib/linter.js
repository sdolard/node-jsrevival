var
vm = require('vm'),
util = require('util'),
fs = require('fs'),

// contrib
rp = require('runnablepool'),

Linter = (function () {
		var DEFAULT_JSLINT_FILE = __dirname + '/../contrib/jslint.js';

		function Linter () { // ctor
			rp.Runnable.call(this);

			this.verbose = false;
			//this.JSLintFilename = process.argv.length >= 2 ? process.argv[2] : DEFAULT_JSLINT_FILE;
			this.JSLintFilename = DEFAULT_JSLINT_FILE;
			this.log(util.format('this.JSLintFilename: %s', this.JSLintFilename));
			this.loadJSLintFilename();
		}
		util.inherits(Linter, rp.Runnable);

		Linter.prototype.loadJSLintFilename = function() {
			var sandbox = {};
			vm.runInNewContext(fs.readFileSync(this.JSLintFilename), sandbox);
			this._JSLINT = sandbox.JSLINT;
		};

		Linter.prototype.lint = function(file, JSLintOption, callback) {
			this.log(util.format("Linting %s...", file));
			var data = fs.readFileSync(file, 'utf8');
			try {
				this._JSLINT(data, JSLintOption);
			} catch(e) {
				this.log(util.format('Message: %s, line: %s, char: %s', e.message, e.line, e.charactere));
			}

			callback({
				errors: this._JSLINT.errors,
				file: file
			});
		};

		Linter.prototype.run = function(config, callback){
			this.log(util.format('run: config: %s', util.inspect(config, true, 100)));
			this.lint(config.file, config.JSLintOption, callback);
		};

		return Linter;
}()),

linter = new Linter();
/**
* TEST
*/
/*
var jsrevival = require('./jsrevival');
linter.lint(
	'/Users/sebastiend/dev/Perso/Node/node-scandir/test/test.js',
	//jsrevival.defaultJSLintOption,
	{
		passfail: false
	},
	function(result){
		console.log(result);
	}
);
*/
/**
* TEST END
*/


