//#!/usr/bin/env node
var
path = require('path'), 
util = require('util'),
getopt = require('posix-getopt'), // contrib
jsrevival = require('../lib/jsrevival'),
verbose = false,
jslint_file,
jslint_options_file,
files = [],
i = 0;


/**
* Display help
*/
function displayHelp() {
	console.log('jslinter [-j jslint_file] [-o jslint_options_file] [–v] [–h] [files ...] ');
	console.log('jslinter: a JSLint cli.');
	console.log('Options:');
	console.log('  j: jslint file (overload default)');
	console.log('  o: jslint option file (overload default)');
	console.log('  m: display jslint default option');
	console.log('  v: verbose mode');
	console.log('  h: display this help');
}

function displayDefaultOption () {
	var prop; 
	console.log('Default properties:');
	for (prop in jsrevival.defaultJSLintOption){
		console.log('  %s: %s', prop, jsrevival.defaultJSLintOption[prop]);
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
		jslint_options_file = opt.optarg;
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
		console.log('Invalid or incomplete option');
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
		msg = path.basename(filename) + ' ';
	}
		
	if (errors.length > 0) {
		debugger;
		for (i = 0; i < errors.length; i++) {
			error = errors[i];
			/*
			[id: (error)]
			line: 1
			character: 8
			
			[a: undefined]
			[b: undefined]
			[c: undefined]
			[d: undefined]
			[evidence: toto = "]
			[raw: Unclosed string.]
			reason: Unclosed string.
			*/
			if (error !== null) {
				if (error.id === undefined) {
					msg += error.reason;
				} else {
					evidence = error.evidence;
					msg += util.format('%s line %d(%d): %s "%s"', 
						error.id, 
						error.line, 
						error.character, 
						error.reason, 
						error.evidence);
				}
			}
			console.log(msg);
		}
		console.log("%s KO", filename);
		return;
	} 
	// No error
	console.log("%s OK", filename);
}

linter = jsrevival.create();
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
			console.log("%s (%s)", err.message, err.code);
			return;
		}
		
});
