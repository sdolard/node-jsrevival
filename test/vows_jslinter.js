var 
vows = require('vows'),
assert = require('assert'),
util = require('util'),
exec = require('child_process').exec,
help = [
	'jslinter [-j jslint_file] [-o jslint_options_file] [-s] [–m] [–v] [-R] [–q] [-p prefef] [–h] files directories ... ',
	'jslinter: a JSLint cli.',
	'Options:',
	'  j: jslint file (overload default)',
	'  o: jslint option (overload default). Ex: -o "unparam: true, vars: false..."',
	'  m: display jslint default option',
	'  v: verbose mode',
	'  R: run recursively on directories',
	'  s: stop on first file error',
	'  q: quiet. Ex: to use jslinter in shell script',
//	'  u: update jslint online',
	'  p: predefined names, which will be used to declare global variables. Ex: -p "foo, bar"',
	'  h: display this help',
	'' // This last line is required
].join('\n'),
jslintDefaultOption = [
	'JSLint default options:',
	'  anon: true # if the space may be omitted in anonymous function declarations',
	'  bitwise: true # if bitwise operators should be allowed',
	'  browser: true # if the standard browser globals should be predefined',
	'  cap: true # if upper case HTML should be allowed',
	'  confusion: true # if types can be used inconsistently',
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
	'  sloppy: true # if the "use strict"; pragma is optional',
	'  sub: true # if all forms of subscript notation are tolerated',
	'  vars: true # if multiple var statements per function should be allowed',
	'  white: true # if sloppy whitespace is tolerated',
	'  widget: true # if the Yahoo Widgets globals should be predefined',
	'  windows: true # if MS Windows-specific globals should be predefined',
	'' // This last line is required
].join('\n'),
jslintJOption = [
	'JSLint default options overload:',
	'  properties: false',
	'JSLINT edition: 2012-01-25',
	'Running jslint on ../test/vows_jslinter.js...',
	'../test/vows_jslinter.js OK',
	'' // This last line is required
].join('\n'),
jslintDirectoryR = [
	'JSLINT edition: 2012-01-25',
	'Running jslint on ../test/Rtest/test.js...',
	'../test/Rtest/test.js OK',
	'Running jslint on ../test/Rtest/A/testA.js...',
	'testA.js> (error) line 1(6): Expected \';\' and instead saw \'(end)\'. "a = 1"',
	'testA.js> Stopping.  (100% scanned).',
	'../test/Rtest/A/testA.js KO',
	'Running jslint on ../test/Rtest/B/testB.js...',
	'testB.js> (error) line 1(6): Expected \';\' and instead saw \'(end)\'. "b = 2"',
	'testB.js> Stopping.  (100% scanned).',
	'../test/Rtest/B/testB.js KO',
	'4 errors on 2/3 files',
	'' // This last line is required
].join('\n'),
jslintDirectory = [
	'JSLINT edition: 2012-01-25',
	'Running jslint on ../test/Rtest/test.js...',
	'../test/Rtest/test.js OK',
	'' // This last line is required
].join('\n'),
jslintOptionOverloadWarnings = [
	'JSLint default options overload:',
	'  properties: false',
	'  confusion: true is already default value',
	'JSLINT edition: 2012-01-25',
	'Running jslint on ../test/vows_jslinter.js...',
	'../test/vows_jslinter.js OK',
	'' // This last line is required
].join('\n'),
jslintSOption = [
	'Stop on first file error enabled',
	'JSLINT edition: 2012-01-25',
	'Running jslint on ../test/Rtest/test.js...',
	'../test/Rtest/test.js OK',
	'Running jslint on ../test/Rtest/A/testA.js...',
	'testA.js> (error) line 1(6): Expected \';\' and instead saw \'(end)\'. "a = 1"',
	'testA.js> Stopping.  (100% scanned).',
	'../test/Rtest/A/testA.js KO',
	'2 errors on 1/2 files',
	'' // This last line is required
].join('\n'),
jslintPOption = [
	'JSLint default options overload:',
	'  undef: false',
	'  predef: b,c',
	'JSLINT edition: 2012-01-25',
	'Running jslint on ../test/Rtest/test.js...',
	'../test/Rtest/test.js OK',
	'' // This last line is required
].join('\n');

function run_jslinter(option, callback) {
	//console.log('option: %s', option);
	exec('node ' + __dirname + '/../bin/jslinter.js ' + option, callback);
}


exports.suite1 = vows.describe('jslinter option').addBatch({
		'When passing no option': {
			topic: function () {
				run_jslinter('', this.callback);
			},
			'help is displayed to stdout and exit code equal 1': function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stdout, help);
				assert.strictEqual(stderr, '');
			}
		},'When passing -h option': {
			topic: function () {
				run_jslinter('-h', this.callback);
			},
			'help is displayed to stdout': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, help);
				assert.strictEqual(stderr, '');
			}
		},
		'When passing -m option': {
			topic: function () {
				run_jslinter('-m', this.callback);
			},
			'jslint default option is displayed to stdout': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintDefaultOption);
				assert.strictEqual(stderr, '');
			}
		},
		'When passing -j option': {
			topic: function () {
				run_jslinter('-j ' + __dirname + '/jslint.js -o "properties: false" '+ __filename, this.callback);
			},
			'jslinter use -j param jslint.js file': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintJOption);
				assert.strictEqual(stderr, '');
			}
		},
		'When passing a directory with -R option on erroneous files': {
			topic: function () {
				run_jslinter('-j ' + __dirname + '/jslint.js -R '+ __dirname +'/Rtest', this.callback);
			},
			'jslinter read directories recursively': function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stdout, jslintDirectoryR);
				assert.strictEqual(stderr, '');
			}
		},
		'When passing a directory without -R option': {
			topic: function () {
				run_jslinter('-j ' + __dirname + '/jslint.js ' + __dirname +'/Rtest', this.callback);
			},
			'jslinter doesn`t read directories recursively': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintDirectory);
				assert.strictEqual(stderr, '');
			}
		},
		'When running jslinter with -q option ': {
			topic: function () {
				run_jslinter('-q -o "properties: false" '+ __filename, this.callback);
			},
			'nothing is written on stdout or stderr': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, '');
				assert.strictEqual(stderr, '');
			}
		},
		'When running jslinter with -o option and overloading a param with it`s default value': {
			topic: function () {
				run_jslinter('-j ' + __dirname + '/jslint.js -o "properties: false, confusion: true" '+ __filename, this.callback);
			},
			'It warns': function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintOptionOverloadWarnings);
				assert.strictEqual(stderr, '');
			}
		}/*,
		'When running jslinter with -u option': {
			topic: function () {
				return "todo";
			},
			'TODO: it`s dl last jslint from github': function (topic) {
				
			}
		}*/,
		'When running jslinter with -p option': {
			topic: function () {
				run_jslinter('-j ' + __dirname + '/jslint.js -o "undef: false" -p "b,c" '+ __dirname + '/Rtest', this.callback);
			},
			'predefined names, which will be used to declare global variables':function (error, stdout, stderr) {
				assert.isNull(error);
				assert.strictEqual(stdout, jslintPOption);
				assert.strictEqual(stderr, '');
			}
		},
		'When running jslinter with -s option': {
			topic: function () {
				run_jslinter('-j ' + __dirname + '/jslint.js -R -s '+ __dirname + '/Rtest', this.callback);
				
			},
			'it stop on first file error': function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stdout, jslintSOption);
				assert.strictEqual(stderr, '');
			}
		}
		
});
