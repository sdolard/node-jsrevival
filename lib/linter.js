var
vm = require('vm'),
util = require('util'),
fs = require('fs'),

// contrib
rp = require('runnablepool'),

Linter = (function () {
		
		function Linter () { // ctor
			this.verbose = false;
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
			var data = fs.readFile(file, 'utf8');
			this.log(util.format("Linting %s...", file));
			try {
				this._JSLINT(data, JSLintOption);
			} catch(e) {
				this.log(util.format('Message: %s, line: %s, char: %s', e.message, e.charactere, e.line));
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
})(),

linter = new Linter();



