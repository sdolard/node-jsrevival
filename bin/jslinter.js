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
quiet = false,
i = 0,
errorCount = 0,
onLintCallCount=0;


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

function log() {
	if (quiet) {
		return;
	}
	console.log.apply(console, arguments);
}

function error() {
	if (quiet) {
		return;
	}
	console.error.apply(console, arguments);
}


function displayDefaultOption () {
	var prop; 
	log('JSLint default options:');
	for (prop in jsrevival.defaultJSLintOption){
		if (jsrevival.defaultJSLintOption.hasOwnProperty(prop)) {
			log('  %s: %s', prop, jsrevival.defaultJSLintOption[prop]);
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
optParser = new getopt.BasicParser(':hvmqj:o:', process.argv);
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
		
	case 'q': // quiet
		files.shift();
		quiet = true;
		break;
		
	case '?':
		error('Invalid or incomplete option');
		files.shift();
		break;
		
		
	default:
		error('Invalid or incomplete option');
		displayHelp();
		process.exit(1);
		
	}
}

if (files.length === 0) {
	log('Nothing to lint.');
	process.exit(1);
}

if(verbose) {
	linter.verbose = true;
	log('verbose mode enabled');
}

function onLint(errors, filename) {	
	onLintCallCount++;
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
				errorCount++;
				if (error.id === undefined) {
					log(util.format('%s%s', 
						msg, 
						error.reason));
				} else {
					evidence = error.evidence;
					log(util.format('%s%s line %d(%d): %s "%s"', 
						msg,
						error.id, 
						error.line, 
						error.character, 
						error.reason, 
						error.evidence));
				}
			}
		}
		log("%s KO", filename);
		
	} else {
		// No error
		log("%s OK", filename);
	}
	
	if (onLintCallCount === files.length) {
		if (errorCount > 0) {
			process.exit(1);
		}
	}
}

linter = jsrevival.create();

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
		error('!Aborting: jslint option format is not valid.');
		process.exit(1);
    }
	log('JSLint default options overload:');
	for(prop in sandbox.result){
		if (sandbox.result.hasOwnProperty(prop)) {
			if (!linter.JSLintOption.hasOwnProperty(prop)) {
				error("  ! unknown property: %s", prop);
				process.exit(1);
			} else if (linter.JSLintOption[prop] !== sandbox.result[prop]) {
				log("  %s: %s", prop, sandbox.result[prop]);
				linter.JSLintOption[prop] = sandbox.result[prop];
			} else {
				log("  %s: %s is already default value", prop, 
					sandbox.result[prop]);
			}
		}
	}
}

linter.on('ready', function() {
		
		for (i = 0; i < files.length; i++) {
			log('Running jslint on %s...', files[i]);
			linter.lint({
					filename: files[i]
			}, onLint);
		}
});

linter.on('end', function() {
		// TODO
});

linter.on('error', function(err) {
		if (err) {
			error("%s (%s)", err.message, err.code);
			process.exit(1);
		}
		
});
