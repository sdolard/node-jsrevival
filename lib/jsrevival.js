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
emptyfn = function(){},

/**
* @class
* @public
* @params [{object}] config
* @params [{string}] config.JSLintFilename
* @params [{object}] config.JSLintOption
* @params [{boolean}]config.recursive. Default to false. Only valid for directories.
* @params [{boolean}] config.stopOnFirstError. Default to false.
* @event ready({string} JSLINT edition)
* @event lint({array} errors, {string} filepath)
* @event end
* @event error({Error} err) 
*/
JSRevival = function(config) {
	EventEmitter.call(this);
	
	config = config || {};
	
	this.JSLintFilename = config.JSLintFilename || JSRevival.defaultJSLintFile;
	this.JSLintOption = config.JSLintOption || JSRevival.defaultJSLintOption;
	this.recursive = config.recursive || false;
	this.stopOnFirstError = config.stopOnFirstError || false;
	
	this._JSLINT = undefined;
	this._dirs = [];
	this._files = [];
	this._timeoutId = -1;
	this._loadJSLintFilename();
};
util.inherits(JSRevival, EventEmitter);


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
			me._checkTimeout();
	});
};


/**
* @private
*/
JSRevival.prototype._checkTimeout = function() {
	if (this._timeoutId !== -1){
		return;
	}
	if (this._dirs.length > 0) {
		this._timeoutId = setTimeout(JSRevival._readDir, 0, this);
		return;
	}
	if (this._files.length > 0) {
		this._timeoutId = setTimeout(JSRevival._lint, 0, this);
		return;
	}
};


/**
* @static
* @private
*/
JSRevival._lint = function(me) {
	var file = me._files.shift();
	
	fs.readFile(file, 'utf8', function (err, data) {
			if (err) {
				return me._eexception(err);
			}
			me.log("Linting %s...", file);
			try {
				me._JSLINT(data, me.JSLintOption);
			} catch(e) {
				me.log('Message: %s, line: %s, char: %s', e.message, e.charactere, e.line);
			}
			
			me.emit('lint', me._JSLINT.errors, file);
			
			if (me._JSLINT.errors.length > 0 && me.stopOnFirstError) {
				me._dirs = [];
				me._files = [];
			}
			
			// Next ?
			me._timeoutId = -1;
			if (me._dirs.length === 0 && me._files.length === 0) {
				me.emit('end');
			} else {
				me._checkTimeout();
			}
	});
};


/**
* @static
* @private
*/
JSRevival._readDir = function(me) {	
	var dir = me._dirs.shift();	
	me.log("Reading dir: %s", dir);
	
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
					if (file.match(JSRevival._jsFileReg)) { // only js file
						me._files.push(filepath);
					}
				} else if (stats.isDirectory() && me.recursive) { // dir
					if (!file.match(JSRevival._hiddenDirReg)) {
						me._dirs.push(filepath);
					}
				}
			}
			me._timeoutId = -1;
			me._checkTimeout();
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
JSRevival.defaultJSLintFile = __dirname + '/jslint.js';

/**
* @static
*/
// 2012-01-25
//     anon       true, if the space may be omitted in anonymous function declarations
//     bitwise    true, if bitwise operators should be allowed
//     browser    true, if the standard browser globals should be predefined
//     cap        true, if upper case HTML should be allowed
//     confusion  true, if types can be used inconsistently
//     'continue' true, if the continuation statement should be tolerated
//     css        true, if CSS workarounds should be tolerated
//     debug      true, if debugger statements should be allowed
//     devel      true, if logging should be allowed (console, alert, etc.)
//     eqeq       true, if == should be allowed
//     es5        true, if ES5 syntax should be allowed
//     evil       true, if eval should be allowed
//     forin      true, if for in statements need not filter
//     fragment   true, if HTML fragments should be allowed
//     indent     the indentation factor
//     maxerr     the maximum number of errors to allow
//     maxlen     the maximum length of a source line
//     newcap     true, if constructor names capitalization is ignored
//     node       true, if Node.js globals should be predefined
//     nomen      true, if names may have dangling _
//     on         true, if HTML event handlers should be allowed
//     passfail   true, if the scan should stop on first error
//     plusplus   true, if increment/decrement should be allowed
//     properties true, if all property names must be declared with /*properties*/
//     regexp     true, if the . should be allowed in regexp literals
//     rhino      true, if the Rhino environment globals should be predefined
//     undef      true, if variables can be declared out of order
//     unparam    true, if unused parameters should be tolerated
//     sloppy     true, if the 'use strict'; pragma is optional
//     sub        true, if all forms of subscript notation are tolerated
//     vars       true, if multiple var statements per function should be allowed
//     white      true, if sloppy whitespace is tolerated
//     widget     true  if the Yahoo Widgets globals should be predefined
//     windows    true, if MS Windows-specific globals should be predefined
JSRevival.defaultJSLintOption = {
	anon      : true,
	bitwise   : true,
	browser   : true,
	cap       : true,
	confusion : true,
	'continue': true,
	css       : true,
	debug     : true,
	devel     : true,
	eqeq      : true,
	es5       : true,
	evil      : true,
	forin     : true,
	fragment  : true,
	indent    :   10,
	maxerr    : 1000,
	maxlen    :  256,
	newcap    : true,
	node      : true,
	nomen     : true,
	on        : true,
	passfail  : true,
	plusplus  : true,
	properties: true, // default true
	regexp    : true,
	rhino     : true,
	undef     : true,
	unparam   : true,
	sloppy    : true,
	sub       : true,
	vars      : true,
	white     : true,
	widget    : true,
	windows   : true
};

JSRevival.defaultJSLintOptionMsg = {
	anon: 'if the space may be omitted in anonymous function declarations',
	bitwise: 'if bitwise operators should be allowed',
	browser: 'if the standard browser globals should be predefined',
	cap: 'if upper case HTML should be allowed',
	confusion: 'if types can be used inconsistently',
	'continue': 'if the continuation statement should be tolerated',
	css: 'if CSS workarounds should be tolerated',
	debug: 'if debugger statements should be allowed',
	devel: 'if logging should be allowed (console, alert, etc.)',
	eqeq: 'if == should be allowed',
	es5: 'if ES5 syntax should be allowed',
	evil: 'if eval should be allowed',
	forin: 'if for in statements need not filter',
	fragment: 'if HTML fragments should be allowed',
	indent: 'the indentation factor',
	maxerr: 'the maximum number of errors to allow',
	maxlen: 'the maximum length of a source line',
	newcap: 'if constructor names capitalization is ignored',
	node: 'if Node.js globals should be predefined',
	nomen: 'if names may have dangling _',
	on: 'if HTML event handlers should be allowed',
	passfail: 'if the scan should stop on first error',
	plusplus: 'if increment/decrement should be allowed',
	properties: 'if all property names must be declared with /*properties*/',
	regexp: 'if the . should be allowed in regexp literals',
	rhino: 'if the Rhino environment globals should be predefined',
	undef: 'if variables can be declared out of order',
	unparam: 'if unused parameters should be tolerated',
	sloppy: 'if the "use strict"; pragma is optional',
	sub: 'if all forms of subscript notation are tolerated',
	vars: 'if multiple var statements per function should be allowed',
	white: 'if sloppy whitespace is tolerated',
	widget: 'if the Yahoo Widgets globals should be predefined',
	windows: 'if MS Windows-specific globals should be predefined'
};

JSRevival._jsFileReg = /.+\.js$/ig;
JSRevival._hiddenDirReg = /^\..+/ig;


/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) {
	return new JSRevival(config);
};
exports.defaultJSLintOption = JSRevival.defaultJSLintOption;
exports.defaultJSLintOptionMsg = JSRevival.defaultJSLintOptionMsg;
