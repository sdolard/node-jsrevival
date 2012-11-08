var 
vows = require('vows'),
assert = require('assert'),
util = require('util'),
exec = require('child_process').exec,
path = require('path'),
JSLINT_VERSION = '2012-09-27',
help = [
	'jsrevival [-j jslint_file] [ [ [-o jslint_options] [-p prefef] ] || [–c jslint_config_file] ] [-s] [–m] [–v] [-R] [–q]  [ [-r reporterName] || [-e] ] [–h] files directories ... ',
	'jsrevival: a JSLint cli.',
	'Options:',
	'  j: jslint file (overload default)',
	'  o: jslint option (overload default). Ex: -o "unparam: true, vars: false..."',
	'  p: predefined names, which will be used to declare global variables. Ex: -p "foo, bar"',
	'  c: jslint config file (JSON expected)',
	'  m: display jslint default option',
	'  v: verbose mode',
	'  R: run recursively on directories',
	'  s: stop on first file error',
	'  q: quiet. Ex: to use jsrevival in shell script',
	'  e: read reporter config from JSREVIVAL_REPORTER user variable environment (stronger than -r option)',
	'  h: display this help',
	'  r: reporter (default: cli)',
	'     reporter list:',
	'      - cli',
	'      - cli-hide-valid',
	'      - cli-no-color',
	'      - cli-hide-valid-no-color',
	'      - sublime-text',
    '' // This last line is required
].join('\n'),
jslintDefaultOption = [
	'JSLint default options:',
	'  anon: true # if the space may be omitted in anonymous function declarations',
	'  bitwise: true # if bitwise operators should be allowed',
	'  browser: true # if the standard browser globals should be predefined',
	'  cap: true # if upper case HTML should be allowed',
	'  continue: true # if the continuation statement should be tolerated',
	'  css: true # if CSS workarounds should be tolerated',
	'  debug: true # if debugger statements should be allowed',
	'  devel: true # if logging should be allowed (console, alert, etc.)',
	'  eqeq: true # if == should be allowed',
	'  es5: true # if ES5 syntax should be allowed',
	'  evil: true # if eval should be allowed',
	'  forin: true # if for in statements need not filter',
	'  fragment: true # if HTML fragments should be allowed',
	'  indent: 10 # the indentation factor',
	'  maxerr: 1000 # the maximum number of errors to allow',
	'  maxlen: 256 # the maximum length of a source line',
	'  newcap: true # if constructor names capitalization is ignored',
	'  node: true # if Node.js globals should be predefined',
	'  nomen: true # if names may have dangling _',
	'  on: true # if HTML event handlers should be allowed',
	'  passfail: true # if the scan should stop on first error',
	'  plusplus: true # if increment/decrement should be allowed',
	'  properties: true # if all property names must be declared with /*properties*/',
	'  regexp: true # if the . should be allowed in regexp literals',
	'  rhino: true # if the Rhino environment globals should be predefined',
	'  undef: true # if variables can be declared out of order',
	'  unparam: true # if unused parameters should be tolerated',
	'  sloppy: true # if the \'use strict\'; pragma is optional',
	'  stupid: true # if really stupid practices are tolerated',
	'  sub: true # if all forms of subscript notation are tolerated',
	'  todo: true # if TODO comments are tolerated',
	'  vars: true # if multiple var statements per function should be allowed',
	'  white: true # if sloppy whitespace is tolerated',
	'  windows: true # if MS Windows-specific globals should be predefined',
	
    '' // This last line is required
].join('\n'),
jslintJOption = [
	'Reporter:  cli-no-color',
	'Reading jslint config from command line',
    'JSLint default options overload:',
    '  properties: false',
    'JSLINT edition: 2012-01-25',
    util.format('%s OK', path.relative(process.cwd(), __dirname +'/vows_jsrevival_bin.js')),
    '' // This last line is required
].join('\n'),
jslintDirectoryR = [
	'Reporter:  cli-no-color',
    'JSLINT edition: 2012-01-25',
    util.format('%s OK', path.relative(process.cwd(),  __dirname + '/Rtest/test.js')),
    util.format('%s KO', path.relative(process.cwd(),  __dirname + '/Rtest/A/testA.js')),
    'testA.js> (error) line 1(6): Expected \';\' and instead saw \'(end)\'. "a = 1"',
    'testA.js> Stopping. (100% scanned).',
    util.format('%s KO', path.relative(process.cwd(),  __dirname + '/Rtest/B/testB.js')),
    'testB.js> (error) line 1(6): Expected \';\' and instead saw \'(end)\'. "b = 2"',
    'testB.js> Stopping. (100% scanned).',
    '4 errors on 2/3 files',
    '' // This last line is required
],
jslintDirectory = [
	'Reporter:  cli-no-color',
    'JSLINT edition: 2012-01-25',
    util.format('%s OK', path.relative(process.cwd(), __dirname +'/Rtest/test.js')),
    '' // This last line is required
].join('\n'),
jslintOptionOverloadWarnings = [
	'Reporter:  cli-no-color',
	'Reading jslint config from command line',
    'JSLint default options overload:',
    '  properties: false',
    'JSLINT edition: 2012-01-25',
    util.format('%s OK', path.relative(process.cwd(), __dirname +'/vows_jsrevival_bin.js')),
    '' // This last line is required
].join('\n'),
jslintSOption = [
	'Reporter:  cli-no-color',
    'Stop on first file error enabled',
    'JSLINT edition: 2012-01-25',
     util.format('%s OK', path.relative(process.cwd(), __dirname +'/Rtest/test.js')),
     
     // A
     util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/A/testA.js')),
    'testA.js> (error) line 1(6): Expected \';\' and instead saw \'(end)\'. "a = 1"',
    'testA.js> Stopping. (100% scanned).',     
    
    // B
    util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/B/testB.js')),
    'testB.js> (error) line 1(6): Expected \';\' and instead saw \'(end)\'. "b = 2"',
    'testB.js> Stopping. (100% scanned).',
    
    // 2 possible end
    '2 errors on 1/2 files', 
    '2 errors on 1/1 file',
    '' // This last line is required
],
jslintPOption = [
	'Reporter:  cli-no-color',
	'Reading jslint config from command line',
    'JSLint default options overload:',
    '  undef: false',
    '  predef: b,c',
    'JSLINT edition: 2012-01-25',
    util.format('%s OK', path.relative(process.cwd(), __dirname +'/Rtest/test.js')),
    '' // This last line is required
].join('\n'),
jslintHideValid = [
	'Reporter:  cli-hide-valid-no-color',
    'Stop on first file error enabled',
    'JSLINT edition: 2012-01-25',
     // A
     util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/A/testA.js')),
    'testA.js> (error) line 1(6): Expected \';\' and instead saw \'(end)\'. "a = 1"',
    'testA.js> Stopping. (100% scanned).',     
    
    // B
    util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/B/testB.js')),
    'testB.js> (error) line 1(6): Expected \';\' and instead saw \'(end)\'. "b = 2"',
    'testB.js> Stopping. (100% scanned).',
    
    // 2 possible end
    '2 errors on 1/2 files',
    '2 errors on 1/1 file',
    '' // This last line is required
],
jslintSublimeText = [
	'Reporter:  sublime-text',
    'Stop on first file error enabled',
    'JSLINT edition: 2012-01-25',
    'test/Rtest/test.js OK',
     // A
    'testA.js# (error) l1:6> Expected \';\' and instead saw \'(end)\'. "a = 1"',
    'testA.js# Stopping. (100% scanned).',     
    
    // B
    'testB.js# (error) l1:6> Expected \';\' and instead saw \'(end)\'. "b = 2"',
    'testB.js# Stopping. (100% scanned).',
    
    // 2 possible end
    '2 errors on 1/2 files',
    '2 errors on 1/1 file',
    '' // This last line is required
],
jslintCOption = [
	'Reporter:  cli-hide-valid-no-color',
	'Reading jslint config from:  '+ path.relative(process.cwd(), __dirname + '/jslint_conf.json'), 
	'JSLint default options overload:',
	'  predef: foo,bar',
	'  properties: false',
	'  white: false',
	'JSLINT edition: ' + JSLINT_VERSION,
    '' // This last line is required
].join('\n'),
jslintCOptionInvalid = [
	'Reporter:  cli-hide-valid-no-color',
	'Reading jslint config from:  '+ path.relative(process.cwd(), __dirname + '/jslint_conf.json'), 
	'JSLint default options overload:',
	'  predef: foo,bar',
	'  properties: false',
	'  white: false',
	'JSLINT edition: '+ JSLINT_VERSION,
    '' // This last line is required
].join('\n');


function run_jsrevival(option, callback) {
	//console.log('option: %s', option);
	
	var cmdLine= util.format('node %s %s',
		path.relative(process.cwd(), __dirname + '/../bin/jsrevival.js'),
		option);
	//console.error(cmdLine);
	exec(cmdLine, callback);
	return cmdLine;
}

exports.suite1 = vows.describe('jsrevival bin').
addBatch({
		'When passing no option': {
			topic: function () {
				run_jsrevival('', this.callback);
			},
			'help is displayed to stdout and exit code equal 1': function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stdout, help);
				assert.strictEqual(stderr, '');
			}
		},'When passing -h option': {
			topic: function () {
				run_jsrevival('-h ', this.callback);
			},
			'help is displayed to stdout': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, help);
				assert.strictEqual(stderr, '');
			}
		},
		'When passing -m option': {
			topic: function () {
				// We disable color for test
				run_jsrevival('-m ', this.callback);
			},
			'jslint default option is displayed to stdout': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintDefaultOption);
				assert.strictEqual(stderr, '');
			}
		},
		'When passing -j option': {
			topic: function () {
				run_jsrevival('-r cli-no-color -j ' + __dirname + '/jslint.js -o "properties: false" '+ __filename, this.callback);
			},
			'jsrevival use -j param jslint.js file': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintJOption);
				assert.strictEqual(stderr, '');
			}
		},
		'When passing a directory with -R option on erroneous files': {
			topic: function () {
				run_jsrevival(util.format('-r cli-no-color -j %s -R %s',
					path.relative(process.cwd(), __dirname + '/jslint.js'),
					path.relative(process.cwd(),  __dirname + '/Rtest')),
					this.callback);
			},
			'jsrevival read directories recursively': function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				var out = stdout.split('\n');
				out.forEach(function(line) {
						assert.include (jslintDirectoryR, line);
				});
				assert.strictEqual(stderr, '');
			}
		},
		'When passing a directory without -R option': {
			topic: function () {
				run_jsrevival('-r cli-no-color -j ' + __dirname + '/jslint.js ' + __dirname +'/Rtest', this.callback);
			},
			'jsrevival doesn`t read directories recursively': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintDirectory);
				assert.strictEqual(stderr, '');
			}
		},
		'When running jsrevival with -q option ': {
			topic: function () {
				run_jsrevival('-q -r cli-no-color -o "properties: false" '+ __filename, this.callback);
			},
			'nothing is written on stdout or stderr': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, '');
				assert.strictEqual(stderr, '');
			}
		},
		'When running jsrevival with -o option and overloading a param with another value than original': {
			topic: function () {
				run_jsrevival('-r cli-no-color -j ' + __dirname + '/jslint.js -o "properties: false, stupid: true" '+ __filename, this.callback);
			},
			'It warns': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintOptionOverloadWarnings);
				assert.strictEqual(stderr, '');
			}
		},
		'When running jsrevival with -p option': {
			topic: function () {
				run_jsrevival('-r cli-no-color -j ' + __dirname + '/jslint.js -o "undef: false" -p "b,c" '+ __dirname + '/Rtest', this.callback);
			},
			'predefined names, which will be used to declare global variables':function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintPOption);
				assert.strictEqual(stderr, '');
			}
		},
		'When running jsrevival with -s option': {
			topic: function () {
				run_jsrevival('-r cli-no-color -j ' + __dirname + '/jslint.js -R -s '+ __dirname + '/Rtest', this.callback);
			},
			'it stops on first file error': function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				//console.log('stdout: ', stdout); 
				var out = stdout.split('\n');
				out.forEach(function(line) {
						assert.include (jslintSOption, line);
				});
				assert.strictEqual(stderr, '');
			}
		},
		'When running jsrevival with an invalid reporter name': {
			topic: function () {
				run_jsrevival('-r øÇ¡«¶{‘“ë '+ __dirname + '/Rtest', this.callback);
			}, 
			'it stops ': function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stdout, '');
				assert.strictEqual(stderr, 'Reporter not found: øÇ¡«¶{‘“ë\n');
			}
		},
		'When running jsrevival with cli-hide-valid reporter': {
			topic: function () {
				run_jsrevival('-r cli-hide-valid-no-color -j ' + __dirname + '/jslint.js -R -s '+ __dirname + '/Rtest', this.callback);
			},
			'Output is valid': function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				var out = stdout.split('\n');
				out.forEach(function(line) {
						assert.include (jslintHideValid, line);
				});
				assert.strictEqual(stderr, '');
			}
		},
		'When running jsrevival with sublime-text': {
			topic: function () {
				run_jsrevival('-r sublime-text -j ' + __dirname + '/jslint.js -R -s '+ __dirname + '/Rtest', this.callback);
			},
			'Output is valid': function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				var out = stdout.split('\n');
				out.forEach(function(line) {
						assert.include (jslintSublimeText, line);
				});
				assert.strictEqual(stderr, '');
			}
		},
		'When running jsrevival -e option': {
			topic: function () {
				process.env.JSREVIVAL_REPORTER = 'cli-no-color';
				run_jsrevival(util.format('-e %s', path.relative(process.cwd(), __dirname +'/Rtest')), this.callback);
				
			},
			'Output is valid': function (error, stdout, stderr) {
				assert.strictEqual(stdout, [
						'Reading reporter from user environment:  cli-no-color\n',
						'Reporter:  cli-no-color\n',
						'JSLINT edition: '+ JSLINT_VERSION + '\n',
						util.format('%s/test.js OK\n', path.relative(process.cwd(), __dirname +'/Rtest'))
				].join('')
				);
				assert.strictEqual(stderr, '');
			}
		},
		'When running jsrevival -c option': {
			topic: function () {
				run_jsrevival(
					util.format('-r cli-hide-valid-no-color -c %s %s', 
						path.relative(process.cwd(), __dirname + '/jslint_conf.json'), 
						path.relative(process.cwd(), __dirname +'/Rtest')
						), 
					this.callback);
				
			},
			'Output is valid': function (error, stdout, stderr) {
				assert.strictEqual(stdout, jslintCOption);
				assert.strictEqual(stderr, '');
			}
		}
}).addBatch({
'When running jsrevival -r and -e option with no env var': {
	topic: function () {
		delete process.env.JSREVIVAL_REPORTER;
		run_jsrevival('-r cli-hide-valid-no-color -e ' + __dirname + '/Rtest', this.callback);
	},
	'It use -r option': function (error, stdout, stderr) {
		assert.strictEqual(stdout, 'Reporter:  cli-hide-valid-no-color\nJSLINT edition: '+ JSLINT_VERSION + '\n');
		assert.strictEqual(stderr, '');
	}
}
});
