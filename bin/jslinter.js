//#!/usr/bin/env node
var
path = require('path'), 
util = require('util'),
vm = require('vm'),
getopt = require('posix-getopt'), // contrib
jsrevival = require('../lib/jsrevival'),

i = 0,
toLint = [],
quiet = false,
optParser,
opt,
jslint_file = '',
jslint_options = '',
verbose = false,
recursive = false,
stopOnFirstError = false,
linter,

errorCount = 0,
errorFileCount = 0,
fileCount = 0;


/**
* Display help
*/
function displayHelp() {
	console.log('jslinter [-j jslint_file] [-o jslint_options_file] [–m] [–v] [-R] [–q] [-s] [-u] [-p prefef] [–h] files directories ... ');
	console.log('jslinter: a JSLint cli.');
	console.log('Options:');
	console.log('  j: jslint file (overload default)');
	console.log('  o: jslint option (overload default). Ex: -o "unparam: true, vars: false..."');
	console.log('  m: display jslint default option');
	console.log('  v: verbose mode');
	console.log('  R: run recursively on directories');
	console.log('  q: quiet. Ex: to use jslinter in shell script');	
	console.log('  s: stop on first error');		
	console.log('  u: update jslint online.'); // https://raw.github.com/douglascrockford/JSLint/master/jslint.js
	console.log('  p: predefined names, which will be used to declare global variables');// predef, 
	// can be an array of names, which will be used to declare global variables,
	// or an object whose keys are used as global names, with a boolean value
	// that determines if they are assignable.
	console.log('  h: display this help');
}

// Args number test
if (process.argv.length <= 2) {
	displayHelp();
	process.exit(1);
}

// tmp toLint array 
for(i = 2; i < process.argv.length; i++) {
	toLint.push(process.argv[i]);
}


// Log
function _log() {
	if (quiet) {
		return;
	}
	console.log.apply(console, arguments);
}

// Error log
function _error() {
	if (quiet) {
		return;
	}
	console.error.apply(console, arguments);
}


function displayDefaultOption () {
	var prop; 
	_log('JSLint default options:');
	for (prop in jsrevival.defaultJSLintOption){
		if (jsrevival.defaultJSLintOption.hasOwnProperty(prop)) {
			_log('  %s: %s # %s', prop, jsrevival.defaultJSLintOption[prop], jsrevival.defaultJSLintOptionMsg[prop]);
		}
	}
}



// Command line options
optParser = new getopt.BasicParser(':hRvmqsj:o:', process.argv);
while ((opt = optParser.getopt()) !== undefined && !opt.error) {
	switch(opt.option) {
	case 'j': //  jslint file
		toLint.shift();
		toLint.shift();
		jslint_file = opt.optarg;
		break;
		
	case 'o': // jslint_options_file
		toLint.shift();
		toLint.shift();
		jslint_options = '{'+opt.optarg+'}';
		break;
		
	case 'v': // verbose
		toLint.shift();
		verbose = true;
		break;
		
	case 'h': // help
		toLint.shift();
		displayHelp();
		process.exit();
		break;
		
	case 'm': // display default options
		toLint.shift();
		displayDefaultOption();
		process.exit();
		break;
		
	case 'q': // quiet
		toLint.shift();
		quiet = true;
		break;
		
	case 'R': // directory recursive parsing
		toLint.shift();
		recursive = true;
		break;
		
	case 's': // stop on first error
		toLint.shift();
		_log('Stop on first error enabled');
		stopOnFirstError = true;
		break;

	case 'u': // update jslint online
		toLint.shift();
		stopOnFirstError = true;
		break;
		
	default:
		_error('Invalid or incomplete option');
		displayHelp();
		process.exit(1);	
	}
}


// Nothing to lint
if (toLint.length === 0) {
	_log('Nothing to lint.');
	process.exit(1);
}

// Verbose mode
if(verbose) {
	_log('Verbose mode enabled');
}


// Linter ctor
linter = jsrevival.create({
		recursive: recursive,
		stopOnFirstError: stopOnFirstError,
		JSLintFilename: jslint_file,
		verbose: verbose
});

// Default option overload
// Must be done after jsrevival ctor
if (stopOnFirstError) {
	linter.JSLintOption.maxerr = 1;
}
if (jslint_options !== ''){
	var 
	sandbox = {
		result: undefined
	},
	prop;
	
	try {
		vm.runInNewContext('result = '+ jslint_options , sandbox, 'tmp.txt');
	} catch(e) {
		_error('!Aborting: jslint option format is not valid.');
		process.exit(1);
	}
	_log('JSLint default options overload:');
	for(prop in sandbox.result){
		if (sandbox.result.hasOwnProperty(prop)) {
			if (!linter.JSLintOption.hasOwnProperty(prop)) {
				_error("  ! unknown property: %s", prop);
				process.exit(1);
			} else if (linter.JSLintOption[prop] !== sandbox.result[prop]) {
				_log("  %s: %s", prop, sandbox.result[prop]);
				linter.JSLintOption[prop] = sandbox.result[prop];
			} else {
				_log("  %s: %s is already default value", prop, 
					sandbox.result[prop]);
			}
		}
	}
}


linter.on('ready', function(edition) {
		_log('JSLINT edition: %s', edition);
		for (i = 0; i < toLint.length; i++) {
			linter.lint(toLint[i]);
		}
});

linter.on('lint', function onLint(errors, filename) {	
		_log('Running jslint on %s...', filename);
		
		var
		msg = path.basename(filename) + '> ';
		
		if (errors.length > 0) {
			//debugger;
			for (i = 0; i < errors.length; i++) {
				error = errors[i];
				//  {
				//      line      : The line (relative to 0) at which the lint was found
				//      character : The character (relative to 0) at which the lint was found
				//      reason    : The problem
				//      evidence  : The text line in which the problem occurred
				//      raw       : The raw message before the details were inserted
				//      a         : The first detail
				//      b         : The second detail
				//      c         : The third detail
				//      d         : The fourth detail
				//  }
				if (error !== null) {
					errorCount++;
					if (error.id === undefined) {
						_log(util.format('%s%s', 
							msg, 
							error.reason));
					} else {
						evidence = error.evidence;
						_log(util.format('%s%s line %d(%d): %s "%s"', 
							msg,
							error.id, 
							error.line, 
							error.character, 
							error.reason, 
							error.evidence));
					}
				}
			}
			errorFileCount++;
			_log("%s KO", filename);
			
		} else {
			// No error
			_log("%s OK", filename);
		}
		fileCount++;
});

linter.on('end', function() {
		if (errorCount > 0) {
			_log('%d error%s on %d/%d file%s', errorCount, errorCount > 1 ? 's' : '', errorFileCount, fileCount, fileCount > 1 ? 's' : '');
			process.exit(1);
		} else {
			if (fileCount > 1) {
				_log('All file%s(%s) OK', fileCount > 1 ? 's' : '', fileCount);
			}
		}
		
});

linter.on('error', function(err) {
		if (err) {
			_error("%s (%s)", err.message, err.code);
			process.exit(1);
		}
		
});
