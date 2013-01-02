/*
Copyright © 2012 by Sebastien Dolard (sdolard@gmail.com)


Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*/

// https://github.com/douglascrockford/JSLint

var
vm = require('vm'),
fs = require('fs'),
util = require('util'),
path = require('path'),
EventEmitter = require('events').EventEmitter,
rp = require('runnablepool'),

/**
* @class
* @public
* @params [{object}] config
* @params [{string}] config.JSLintFilename
* @params [{object}] config.JSLintOption
* @params [{boolean}]config.recursive. Default to false. Only valid for directories.
* @params [{boolean}] config.stopOnFirstError. Default to false.
* @event ready({string} JSLINT edition) // class has load jslint.js > lint method can be called there
* @event lint({array} errors, {string} filepath) // lint what eve you whant
* @event end // there is no more things to lint
* @event error({Error} err) 
*/
JSRevival =  (function () {
		var
		REGEX_JS_FILE = /.+\.js$/ig,
		REGEX_HIDDEN_DIR = /^\..+/ig,
		DEFAULT_JSLINT_FILE = __dirname + '/../contrib/jslint.js';
		
		
		function JSRevival(config) {
			EventEmitter.call(this);
			
			config = config || {};
			
			this.JSLintFilename = config.JSLintFilename || DEFAULT_JSLINT_FILE;
			this.JSLintOption = config.JSLintOption || JSRevival.defaultJSLintOption;
			this.recursive = config.recursive || false;
			this.stopOnFirstError = config.stopOnFirstError || false;
			
			this._firstErrorReceived = false;
			this._JSLINT = undefined;
			this._dirs = [];
			this._files = [];
			
			this._runnablePool = new rp.RunnablePool({
					verbose: false,
					modulePath: __dirname + '/linter.js',
					args: [this.JSLintFilename]
			});
			this._runnablePool.on('result', this._onRPoolResult.bind(this));
			this._runnablePool.on('end', this._onRPoolEnd.bind(this));
			
			this._loadJSLintFilename();
		}
		util.inherits(JSRevival, EventEmitter);
		
		
		/**
		* @private
		*/
		JSRevival.prototype._onRPoolResult = function(pid, err, result) {
			if (err) {
				if (err.stack) {
					return console.log(util.format('pid %d > %s', pid, err.stack));
				}
				return console.log(util.format('pid: %d > Error : ', pid, err.message));
			}
			
			if (this.stopOnFirstError) {
				if (!this._firstErrorReceived) { // cos of multi cpu
					this.emit('lint', result.errors, result.file);
				}
			} else {
				this.emit('lint', result.errors, result.file);
			}
			
			if (result.errors.length > 0 && this.stopOnFirstError) {
				this._firstErrorReceived = true;
				this._runnablePool.abort();
				this._dirs = [];
				this._files = [];
			}

			if (this._dirs.length > 0 || this._files.length > 0) {
				this._next();
			}
		};
		
		/**
		* @private
		*/
		JSRevival.prototype._onRPoolEnd = function(runnables) {
			this.emit('end');
		};
		
		/**
		* Set jslint file
		* @public
		* @params {string} jslint filename
		* @params {function} callback
		*/
		JSRevival.prototype._loadJSLintFilename = function() {
			var 
			me = this,
			sandbox = {};
			
			// Checking stat
			fs.stat(this.JSLintFilename, function(err, stats) {   
					if (err) {
						return me._eexception(err);
					}
					
					if (!stats.isFile()) {
						return me._eexception({
								code: 'EINVALIDJSLINTFILENAME',
								message: util.format('JSLintFilename is not a file: %s', me.JSLintFilename)
						});
					}
					
					// Loading file
					fs.readFile(me.JSLintFilename, function(err, data){
							//debugger;
							vm.runInNewContext(data, sandbox);
							me._JSLINT = sandbox.JSLINT;
							if (typeof me._JSLINT !== 'function'){
								return me._eexception({
										code: 'EINVALIDJSLINTFILE',
										message: 'An error occured when trying to load JSLINT function.'
								});
							}
							me.emit('ready', me._JSLINT.edition);
					});
			});
		};
		
		/**
		* @param {string} toLint: a file, a directory 
		*/
		JSRevival.prototype.lint = function(toLint) {
			var
			me = this;
			if (!toLint) {
				return this._eexception({
						code: 'ENOTHINGTOLINT',
						message: 'toLint property is empty'
				});
			}
			
			// we state toLint: file or directory ?
			fs.stat(toLint, function(err, stats){
					if (err) {
						return me._eexception(err);
					}
					
					if (stats.isDirectory()) {
						me._dirs.push(toLint);
					} else if (stats.isFile()) {
						me._files.push(toLint);
					} else {
						me._eexception({
								code: 'EINVALIDENT',
								message: util.format('"%s" is not a file neither a directory', toLint)
						});
					}	
					me._next();
			});
		};
		
		
		/**
		* @private
		*/
		JSRevival.prototype._next = function() {
			if (this._dirs.length > 0) {
				this._readDir();
				return;
			}
			
			if (this._files.length > 0) {
				this._lint();
				return;
			}
		};
		
		
		/**
		* @static
		* @private
		*/
		JSRevival.prototype._lint = function() {
			var file;
			while (this._files.length > 0) {	
				file = this._files.shift();
				this._runnablePool.run({
						file: file,
						JSLintOption: this.JSLintOption
				});
			}
		};

		
		/**
		* @static
		* @private
		*/
		JSRevival.prototype._readDir = function() {	
			var 
			me = this,
			dir = this._dirs.shift();	
			
			this.log("Reading dir: %s", dir);
			
			fs.readdir(dir, function(err, files){
					var 
					i = 0,
					file = '',
					filepath = '',
					stats;
					files.sort(); // Fix for test cf Travis CI.
					for (i = 0; i < files.length; i++) {
						file = files[i];
						filepath = path.join(dir, file);
						stats = fs.statSync(filepath);
						
						if (stats.isFile()) { // Files
							if (file.match(REGEX_JS_FILE)) { // only js file
								me._files.push(filepath);
							}
						} else if (stats.isDirectory() && me.recursive) { // dir
							if (!file.match(REGEX_HIDDEN_DIR)) {
								me._dirs.push(filepath);
							}
						}
					}
					me._next();
			});
		};
		
		
		
		/** 
		* Log only if verbose is positive
		* @public
		* @method
		*/
		JSRevival.prototype.log = function() {
			if (!this.verbose) {
				return;
			}
			var 
			args = arguments,
			v = parseInt((new Date()).getTime(), 10) + ' verbose JSRevival # ';
			args[0] = args[0].replace('\n', '\n' + v);
			args[0] = v.concat(args[0]);
			console.error.apply(console, args);
		};
		
		
		/**
		* @private
		*/
		JSRevival.prototype._eexception = function(exception) {
			var error = new Error(exception.message);
			
			error.code = exception.code;
			this.emit('error', error);
			if (this.verbose && typeof error.stack === 'string') {
				console.log(error.stack);
			}
		};
		
	
		
		/**
		* @static
		*/
		JSRevival.defaultJSLintOption = {
			anon      : true,
			bitwise   : true,
			browser   : true,
			'continue': true,
			css       : true,
			debug     : true,
			devel     : true,
			eqeq      : true,
			es5       : true,
			evil      : true,
			forin     : true,
			fragment  : true,
			indent    : 10,
			maxerr    : 1000,
			maxlen    : 256,
			newcap    : true,
			node      : true,
			nomen     : true,
			on        : true,
			passfail  : true,
			plusplus  : true,
			properties: true,
			regexp    : true,
			rhino     : true,
			undef     : true,
			unparam   : true,
			sloppy    : true,
			stupid    : true,
			sub       : true,
			todo      : true,
			vars      : true,
			white     : true,
			windows   : true

		};
		
		JSRevival.defaultJSLintOptionMsg = {
			anon      : 'if the space may be omitted in anonymous function declarations',
			bitwise   : 'if bitwise operators should be allowed',
			browser   : 'if the standard browser globals should be predefined',
			'continue': 'if the continuation statement should be tolerated',
			css       : 'if CSS workarounds should be tolerated',
			debug     : 'if debugger statements should be allowed',
			devel     : 'if logging should be allowed (console, alert, etc.)',
			eqeq      : 'if == should be allowed',
			es5       : 'if ES5 syntax should be allowed',
			evil      : 'if eval should be allowed',
			forin     : 'if for in statements need not filter',
			fragment  : 'if HTML fragments should be allowed',
			indent    : 'the indentation factor',
			maxerr    : 'the maximum number of errors to allow',
			maxlen    : 'the maximum length of a source line',
			newcap    : 'if constructor names capitalization is ignored',
			node      : 'if Node.js globals should be predefined',
			nomen     : 'if names may have dangling _',
			on        : 'if HTML event handlers should be allowed',
			passfail  : 'if the scan should stop on first error',
			plusplus  : 'if increment/decrement should be allowed',
			properties: 'if all property names must be declared with /*properties*/',
			regexp    : 'if the . should be allowed in regexp literals',
			rhino     : 'if the Rhino environment globals should be predefined',
			undef     : 'if variables can be declared out of order',
			unparam   : 'if unused parameters should be tolerated',
			sloppy    : 'if the \'use strict\'; pragma is optional',
			stupid    : 'if really stupid practices are tolerated',
			sub       : 'if all forms of subscript notation are tolerated',
			todo      : 'if TODO comments are tolerated',
			vars      : 'if multiple var statements per function should be allowed',
			white     : 'if sloppy whitespace is tolerated',
			windows   : 'if MS Windows-specific globals should be predefined'
		};
		
		return JSRevival;
}());

/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) {
	return new JSRevival(config);
};
exports.defaultJSLintOption = JSRevival.defaultJSLintOption;
exports.defaultJSLintOptionMsg = JSRevival.defaultJSLintOptionMsg;
