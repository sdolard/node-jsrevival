//#!/usr/bin/env node
var
path = require('path'), 
util = require('util'),
vm = require('vm'),
getopt = require('posix-getopt'), // contrib
jsrevival = require('../lib/jsrevival'),
verbose = false,
jslint_file,
jslint_options = '',
toLint = [],
quiet = false,
i = 0,
errorCount = 0,
onLintCallCount = 0,
recursive = false;


/**
* Display help
*/
function displayHelp() {
	console.log('jslinter [-j jslint_file] [-o jslint_options_file] [-R] [–v] [–h] [–m] [–q] files directories ... ');
	console.log('jslinter: a JSLint cli.');
	console.log('Options:');
	console.log('  j: jslint file (overload default).');
	console.log('  o: jslint option (overload default). Ex: -o "{ unparam: true }"');
	console.log('  m: display jslint default option');
	console.log('  v: verbose mode');
	console.log('  R: run recursively on directories');
	console.log('  q: quiet');	
	console.log('  h: display this help');
}

function _log() {
	if (quiet) {
		return;
	}
	console.log.apply(console, arguments);
}

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
			_log('  %s: %s', prop, jsrevival.defaultJSLintOption[prop]);
		}
	}
}


// Args number test
if (process.argv.length <= 2) {
	displayHelp();
}


// tmp toLint array 
for(i = 2; i < process.argv.length; i++) {
	toLint.push(process.argv[i]);
}


/**
* Command line options
*/
optParser = new getopt.BasicParser(':hRvmqj:o:', process.argv);
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
		jslint_options = opt.optarg;
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
		
	case '?':
		_error('Invalid or incomplete option');
		toLint.shift();
		break;
		
		
	default:
		_error('Invalid or incomplete option');
		displayHelp();
		process.exit(1);
		
	}
}

if (toLint.length === 0) {
	_log('Nothing to lint.');
	process.exit(1);
}


function onLint(errors, filename) {	
	onLintCallCount++;
	var
	msg= '';
	//if (toLint.length > 1) {
		msg = path.basename(filename) + '> ';
	//}
	
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
		_log("%s KO", filename);
		
	} else {
		// No error
		_log("%s OK", filename);
	}
	
	// TODO, this do not wirk with -R and directories
	if (onLintCallCount === toLint.length) {
		if (errorCount > 0) {
			process.exit(1);
		}
	}
}

linter = jsrevival.create();

if(verbose) {
	linter.verbose = true;
	_log('verbose mode enabled');
}

// Default option overload
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

linter.on('ready', function() {
		for (i = 0; i < toLint.length; i++) {
			_log('Running jslint on %s...', toLint[i]);
			linter.lint({
					toLint: toLint[i],
					recursive: recursive
			}, onLint);
		}
});

linter.on('end', function() {
		// TODO
});

linter.on('error', function(err) {
		if (err) {
			_error("%s (%s)", err.message, err.code);
			process.exit(1);
		}
		
});
