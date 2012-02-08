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
* @params [{function}] callback()
*/
JSRevival = function(a, b) {
	EventEmitter.call(this);
	
	var 
	config = {},
	callback = emptyfn;
	
	if (arguments.length === 1) {	
		if (typeof a==='function') {
			callback = a || emptyfn;
		} else {
			config = a || {};
		}
	}
	else if(arguments.length === 2) {	
		config = a || {};
		callback = b || emptyfn;
	}	
	
	this.JSLintFilename = config.JSLintFilename || JSRevival.defaultJSLintFile;
	
	this.JSLintOption = config.JSLintOption || JSRevival.defaultJSLintOption;
	
	this._JSLINT = undefined;
	
	this.setJSLintFilename(this.JSLintFilename, callback);
	
};
util.inherits(JSRevival, EventEmitter);


/**
* Set jslint file
* @public
* @params {string} jslint filename
* @params {function} callback
*/
JSRevival.prototype.setJSLintFilename = function(JSLintFilename, callback) {
	var 
	me = this,
	stat,
	data,
	sandbox = {};
	
	callback = callback || emptyfn;
	
	this.once('ready', callback);
	
	// Checking stat
	fs.stat(JSLintFilename, function(err, stats) {   
			if (err) {
				return me._eexception(err);
			}
			
			if (!stats.isFile()) {
				return me._eexception({
						code: 'EINVALIDJSLINTFILENAME',
						message: util.format('JSLintFilename is not a file: %s', filname)
				});
			}
			
			// Loading file
			data = fs.readFile(JSLintFilename, function(err, data){
					//debugger;
					vm.runInNewContext(data, sandbox);
					me._JSLINT = sandbox.JSLINT;
					if (typeof me._JSLINT !== 'function'){
						return me._eexception({
								code: 'EINVALIDJSLINTFILE',
								message: 'An error occured when trying to load JSLINT function.'
						});
					}
					me.emit('ready');
			});
	});
};

/**
* @param {string} config.filename
* @param {string} [config.code]
* @param {object} [config.JSLintOptions]
* @param {string} [config.jslintFile]
*/
JSRevival.prototype.lint = function(config, callback) {
	var 
	me = this;
	
	config = config || {};
	callback = callback || emptyfn;
	
	if (!config.filename) {
		return this._eexception({
				code: 'EEMPTYFILENAME',
				message: 'filename property is empty'
		});
	}
	this._loadCodeFromFile(config.filename, function(code) {
			me._JSLINT(code, me.JSLintOption);
			callback( me._JSLINT.errors, config.filename);
	});
};



JSRevival.prototype._loadCodeFromFile = function(filename, callback) {
	var 
	me = this;
	callback = callback || emptyfn;
	
	fs.stat(filename, function(err, stats){
			if (err) {
				return me._eexception(err);
			}
			
			if (!stats.isFile()) {
				me._exception({
						code: 'ENOTAFILE',
						message: util.format('filename is not a file: %s', filename)
				});
			}
			
			
			fs.readFile(filename, 'utf8', function (err, data) {
					if (err) {
						return me._eexception(err);
					}
					callback(data);
			});
	});
};


/**
* @private
* @param {object.string} code
*/
JSRevival.prototype._formatCode = function(code) {
	if (code === undefined || code.length === 0) {
		return this._eexception({
				code: 'ENOTHINGTOLINT',
				message: 'There is nothing to lint.'
		});
	}
	return code;
	//var formatedCode = code.
	//replace(/'/ig, "\\'").
	//replace(/\\n/ig, "\\\\n").
	//replace(/\-/ig, "\\-").
	//replace(/\[/ig, "\\[");
	//formatedCode = util.format("['%s']", formatedCode.replace(/\n/ig, "', '"));
	//return formatedCode;
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
	v = parseInt((new Date()).getTime(), 10) + ' verbose JSRevival ' + path.basename(this.filePath) +'# ';
	args[0] = args[0].replace('\n', '\n' + v);
	args[0] = v.concat(args[0]);
	console.error.apply(console, args);
};


/**
* @private
*/
JSRevival.prototype._eexception = function(exception) {
	var 
	error = new Error(exception.message);
	error.code = exception.code;
	this.emit('error', error);
	if (this.verbose && typeof error.stack === 'string') {
		console.log(error.stack);
	}
};

/**
*@private
*/
JSRevival.prototype._eemit = function(event, b, c){
	switch(arguments.length) {
	case 2:
		this.emit(event, b);
		break;
	case 3:
		this.emit(event, b, c);
		break;
	default:
		throw new Error('JSRevival.prototype._eemit: argument(s) missing');
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


/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) {
	return new JSRevival(config);
};
exports.defaultJSLintOption = JSRevival.defaultJSLintOption;

