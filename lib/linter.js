var
vm = require('vm'),
util = require('util'),
fs = require('fs'),

// contrib
rp = require('runnablepool'),

Linter = (function () {
		
		function Linter () { // ctor
			this.verbose = true;
			this.JSLintFilename = process.argv[2];
			this.log(util.format('this.JSLintFilename: %s', this.JSLintFilename));
			this.loadJSLintFilename();
			rp.Runnable.call(this);
		}
		util.inherits(Linter, rp.Runnable);
		
		Linter.prototype.loadJSLintFilename = function() {
			var 
			sandbox = {};
			
			vm.runInNewContext(fs.readFileSync(this.JSLintFilename), sandbox);
			this._JSLINT = sandbox.JSLINT;
			
		};
		
		Linter.prototype.lint = function(file, JSLintOption, callback) {
			var me = this;
			fs.readFile(file, 'utf8', function (err, data) {
					if (err) {
						throw err;
					}
					me.log(util.format("Linting %s...", file));
					
					try {
						me._JSLINT(data, JSLintOption);
					} catch(e) {
						me.log(util.format('Message: %s, line: %s, char: %s', e.message, e.charactere, e.line));
					}
					
					callback({
							errors: me._JSLINT.errors, 
							file: file
					});
			});
		};
		
		Linter.prototype.run = function(config, callback){
			this.log(util.format('run: config: %s', util.inspect(config, true, 100)));
 			this.lint(config.file, config.JSLintOption, callback);
		};
		
		return Linter;
})(),

linter = new Linter();



