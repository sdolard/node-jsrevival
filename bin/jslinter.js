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
files = [],
i = 0;


/**
* Display help
*/
function displayHelp() {
	console.log('jslinter [-j jslint_file] [-o jslint_options_file] [-R] [–v] [–h] [–m] [files directories ...] ');
	console.log('jslinter: a JSLint cli.');
	console.log('Options:');
	console.log('  j: jslint file (overload default).');
	console.log('  o: jslint option (overload default). Ex: -o "{ unparam: true }"');
	console.log('  m: display jslint default option');
	console.log('  v: verbose mode');
	console.log('  R: run recursively on directories');
	console.log('  h: display this help');
}


function displayDefaultOption () {
	var prop; 
	console.log('JSLint default options:');
	for (prop in jsrevival.defaultJSLintOption){
		if (jsrevival.defaultJSLintOption.hasOwnProperty(prop)) {
			console.log('  %s: %s', prop, jsrevival.defaultJSLintOption[prop]);
		}
	}
}


// Args number test
if (process.argv.length <= 2) {
	displayHelp();
}


// tmp files array 
for(i = 2; i < process.argv.length; i++) {
	files.push(process.argv[i]);
}


/**
* Command line options
*/
optParser = new getopt.BasicParser(':hvmj:o:', process.argv);
while ((opt = optParser.getopt()) !== undefined && !opt.error) {
	switch(opt.option) {
	case 'j': //  jslint file
		files.shift();
		files.shift();
		jslint_file = opt.optarg;
		break;
		
	case 'o': // jslint_options_file
		files.shift();
		files.shift();
		jslint_options = opt.optarg;
		break;
		
	case 'v': // verbose
		files.shift();
		verbose = true;
		break;
		
	case 'h': // help
		files.shift();
		displayHelp();
		process.exit();
		break;
		
	case 'm': // display default options
		files.shift();
		displayDefaultOption();
		process.exit();
		break;
		
	default:
		console.error('Invalid or incomplete option');
		displayHelp();
		process.exit();
		
	}
}


if(verbose) {
	linter.verbose = true;
	console.log('verbose mode enabled');
}

function onLint(errors, filename) {	
	var
	msg= '';
	if (files.length > 1) {
		msg = path.basename(filename) + '> ';
	}
	
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
				if (error.id === undefined) {
					console.log(util.format('%s%s', 
						msg, 
						error.reason));
				} else {
					evidence = error.evidence;
					console.log(util.format('%s%s line %d(%d): %s "%s"', 
						msg,
						error.id, 
						error.line, 
						error.character, 
						error.reason, 
						error.evidence));
				}
			}
		}
		console.log("%s KO", filename);
		return;
	} 
	// No error
	console.log("%s OK", filename);
}

linter = jsrevival.create();

// Default option overload
if (jslint_options !== ''){
	var 
	sandbox = {
		result: undefined
    },prop;
    
    try {
		vm.runInNewContext('result = '+ jslint_options , sandbox, 'tmp.txt');
    } catch(e) {
		console.error('!Aborting: jslint option format is not valid.');
		process.exit(1);
    }
	console.log('JSLint default options overload:');
	for(prop in sandbox.result){
		if (sandbox.result.hasOwnProperty(prop)) {
			if (!linter.JSLintOption.hasOwnProperty(prop)) {
				console.error("  ! unknown property: %s", prop);
				process.exit(1);
			} else if (linter.JSLintOption[prop] !== sandbox.result[prop]) {
				console.log("  %s: %s", prop, sandbox.result[prop]);
				linter.JSLintOption[prop] = sandbox.result[prop];
			} else {
				console.log("  %s: %s is already default value", prop, 
					sandbox.result[prop]);
			}
		}
	}
}

linter.on('ready', function() {
		for (i = 0; i < files.length; i++) {
			console.log('Running jslint on %s...', files[i]);
			linter.lint({
					filename: files[i]
			}, onLint);
		}
});
linter.on('error', function(err) {
		if (err) {
			console.error("%s (%s)", err.message, err.code);
			return;
		}
		
});
