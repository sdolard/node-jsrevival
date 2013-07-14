var
assert = require('assert'),
util = require('util'),
fs = require('fs'),
exec = require('child_process').exec,
path = require('path'),
JSLINT_VERSION = '2013-07-02',
version = JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version;

/*jslint unparam: true*/
function run_jsrevival(option, callback, dump) {
	"use strict";
	//console.log('option: %s', option);

	var
	//childProcess,
	/*_error,
	_stdout = '',
	_stderr = '',*/
	cmdLine = util.format('node %s %s',
		path.relative(process.cwd(), __dirname + '/../bin/jsrevival'),
		option);
	if (dump) {
		console.error(cmdLine);
	}
	//childProcess = exec(cmdLine, callback);
	exec(cmdLine, callback);
	/*childProcess = exec(cmdLine, function(error, stdout, stderr) {
		_error = error;
		_stdout += stdout;
		_stderr += stderr;
	});
	childProcess.on('close', function(){
		callback(_error, _stdout, _stderr);
	});*/
	return cmdLine;
}

describe('jsrevival bin', function() {
	var help = [
			'',
			'  Usage: jsrevival [options] <file directory ...>',
			'',
			'  Options:',
			'',
			'    -h, --help                       output usage information',
			'    -V, --version                    output the version number',
			'    -j, --jslint_file <file>         overload default',
			'    -o, --jslint_options <options>   overload default. Ex: -o "unparam: false, vars: false"',
			'    -m, --display_default_options    display jslint default options',
			'    -p, --predefined_names <names>   which will be used to declare global variables. Ex: -p "foo, bar"',
			'    -c, --jslint_config_file <file>  jslint config file (JSON expected)',
			'    -q, --quiet                      disable writing to std*. Ex: to use jsrevival in shell script',
			'    -R, --recursive                  run recursively on directories',
			'    -r, --reporter <name>            cli (default), cli-hide-valid, cli-no-color, cli-hide-valid-no-color, sublime-text',
			'    -s, --stop_on_first_error        stop on first file error',
			'    -e, --reporter_from_env          read reporter config from JSREVIVAL_REPORTER user variable environment (stronger than -r option)',
			'    -v, --verbose                    enable verbose mode',
			'',
			'' // This last line is required
		].join('\n');

	describe('passing no option', function () {
		it('should displayed help to stdout and exit code equal 1', function (done) {
			run_jsrevival('', function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stdout, help);
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});

	describe('passing -h option', function () {
		it('should displayed help to stdout and exit normaly', function (done) {
			run_jsrevival('-h', function (error, stdout, stderr) {
				assert.strictEqual(error, null);
				assert.strictEqual(stdout, help);
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});

	describe('passing -m option', function () {
		it('should displayed jslint default option to stdout', function (done) {
			var jslintDefaultOption = [
				'JSLint default options:',
				'  ass: true # if assignment expressions should be allowed',
				'  bitwise: true # if bitwise operators should be allowed',
				'  browser: true # if the standard browser globals should be predefined',
				'  closure: true # if Google Closure idioms should be tolerated',
				'  continue: true # if the continuation statement should be tolerated',
				'  couch: true # no help',
				'  debug: true # if debugger statements should be allowed',
				'  devel: true # if logging should be allowed (console, alert, etc.)',
				'  eqeq: true # if == should be allowed',
				'  es5: true # if ES5 syntax should be allowed',
				'  evil: true # if eval should be allowed',
				'  forin: true # if for in statements need not filter',
				'  indent: 10 # the indentation factor',
				'  maxerr: 1000 # the maximum number of errors to allow',
				'  maxlen: 256 # the maximum length of a source line',
				'  newcap: true # if constructor names capitalization is ignored',
				'  node: true # if Node.js globals should be predefined',
				'  nomen: true # if names may have dangling _',
				'  passfail: true # if the scan should stop on first error',
				'  plusplus: true # if increment/decrement should be allowed',
				'  properties: true # if all property names must be declared with /*properties*/',
				'  regexp: true # if the . should be allowed in regexp literals',
				'  rhino: true # if the Rhino environment globals should be predefined',
				'  unparam: true # if unused parameters should be tolerated',
				'  sloppy: true # if the \'use strict\'; pragma is optional',
				'  stupid: true # if really stupid practices are tolerated',
				'  sub: true # if all forms of subscript notation are tolerated',
				'  todo: true # if TODO comments are tolerated',
				'  vars: true # if multiple var statements per function should be allowed',
				'  white: true # if sloppy whitespace is tolerated',
				'' // This last line is required
				].join('\n');
			run_jsrevival('-m', function (error, stdout, stderr) {
				assert.strictEqual(error, null);
				assert.strictEqual(stdout, jslintDefaultOption);
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});

	describe('passing -j option', function () {
		it('should use jslint.js file', function (done) {
			var jslintJOption = [
				util.format('%s OK', path.relative(process.cwd(), __dirname +'/jsrevival_bin.js')),
				'' // This last line is required
			].join('\n');

			run_jsrevival('-p "describe,it" -r cli-no-color -j ' +
				__dirname +
				'/../contrib/jslint_2013-05-01.js -o "properties: false" '+
				__filename,
				function (error, stdout, stderr) {
					assert.strictEqual(error, null);
					assert.strictEqual(stdout, jslintJOption);
					assert.strictEqual(stderr, '');
					done();
			});
		});
	});

	describe('passing a directory with -R option on erroneous files', function () {
		it('should read directories recursively', function (done) {
			var jslintDirectoryR = [
				// test.js
				util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/test.js')),
				'test.js> (error) line 1(9): \'b\' was used before it was defined. "var a = b;"',
				'test.js> Stopping. (100% scanned).',

				// A
				util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/A/testA.js')),
				'testA.js> (error) line 1(1): \'a\' was used before it was defined. "a = 1"',
				'testA.js> Stopping. (100% scanned).',

				// B
				util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/B/testB.js')),
				'testB.js> (error) line 1(1): \'b\' was used before it was defined. "b = 2"',
				'testB.js> Stopping. (100% scanned).',

				'6 errors on 3/3 files',
				'' // This last line is required
			];

			run_jsrevival(util.format('-r cli-no-color -j %s -R %s',
				path.relative(process.cwd(), __dirname + '/../contrib/jslint_2013-05-01.js'),
				path.relative(process.cwd(),  __dirname + '/Rtest')),
				function (error, stdout, stderr) {
					assert.strictEqual(error.code, 1);
					var out = stdout.split('\n');
					out.forEach(function(line) {
						assert(jslintDirectoryR.indexOf(line) !== -1);
					});
					assert.strictEqual(stderr, '');
					done();
			});
		});
	});

	describe('passing a directory without -R option', function () {
		it('should not read directories recursively', function (done) {
			var jslintDirectory = [
				util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/test.js')),
				'test.js> (error) line 1(9): \'b\' was used before it was defined. "var a = b;"',
				'test.js> Stopping. (100% scanned).',
				'2 errors on 1/1 file',
				'' // This last line is required
			].join('\n');

			run_jsrevival('-r cli-no-color -j ' + __dirname + '/../contrib/jslint_2013-05-01.js ' + __dirname +'/Rtest',
				function (error, stdout, stderr) {
					assert.strictEqual(error.code, 1);
					assert.strictEqual(stdout, jslintDirectory);
					assert.strictEqual(stderr, '');
					done();
			});
		});
	});

	describe('running jsrevival with -q option', function () {
		it('should write nothing to stdout or stderr', function (done) {
			run_jsrevival('-q -r cli-no-color -o "properties: false" '+ __filename, function (error, stdout, stderr) {
				assert.strictEqual(error, null);
				assert.strictEqual(stdout, '');
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});

	describe('running jsrevival with -o option and overloading a param with another value than original', function () {
		it('should not warns', function (done) {

			var jslintOptionOverloadWarnings = [
				util.format('%s OK', path.relative(process.cwd(), __dirname +'/jsrevival_bin.js')),
				'' // This last line is required
			].join('\n');

			run_jsrevival('-p "describe,it" -r cli-no-color -j ' + __dirname + '/../contrib/jslint_2013-05-01.js -o "properties: false, stupid: true" '+ __filename, function (error, stdout, stderr) {
				assert.strictEqual(error, null);
				assert.strictEqual(stdout, jslintOptionOverloadWarnings);
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});

	describe('running jsrevival with -p option', function () {
		it('should predefined names, which will be used to declare global variables', function (done) {
			var jslintPOption = [
				util.format('%s OK', path.relative(process.cwd(), __dirname +'/Rtest/test.js')),
				'' // This last line is required
			].join('\n');
			run_jsrevival('-r cli-no-color -j ' + __dirname + '/../contrib/jslint_2013-05-01.js -o "unparam: false" -p "b,c" '+ __dirname + '/Rtest', function (error, stdout, stderr) {
				assert.strictEqual(error, null);
				assert.strictEqual(stdout, jslintPOption);
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});

	describe('running jsrevival with -s option', function () {
		it('should stop on first file error', function (done) {
			run_jsrevival('-r cli-no-color -j ' + __dirname + '/../contrib/jslint_2013-05-01.js -R -s '+ __dirname + '/Rtest', function (error, stdout, stderr) {
				var jslintSOption = [
					util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/test.js')),
					'test.js> (error) line 1(9): \'b\' was used before it was defined. "var a = b;"',
					'test.js> Stopping. (100% scanned).',

					// A
					util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/A/testA.js')),
					'testA.js> (error) line 1(1): \'a\' was used before it was defined. "a = 1"',
					'testA.js> Stopping. (100% scanned).',

					// B
					util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/B/testB.js')),
					'testB.js> (error) line 1(6): \'b\' was used before it was defined. "b = 2"',
					'testB.js> Stopping. (100% scanned).',

					// 2 possible end
					'2 errors on 1/2 files',
					'2 errors on 1/1 file',
					'' // This last line is required
				],
				out = stdout.split('\n');
				out.forEach(function(line) {
					assert(jslintSOption.indexOf(line) !== -1);
				});
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});

	describe('running jsrevival with an invalid reporter name', function () {
		it('should stop', function (done) {
			run_jsrevival('-r øÇ¡«¶{‘“ë '+ __dirname + '/Rtest', function (error, stdout, stderr) {
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stdout, '');
				assert.strictEqual(stderr, 'Reporter not found: øÇ¡«¶{‘“ë\n');
				done();
			});
		});
	});

	describe('running jsrevival with cli-hide-valid reporter', function () {
		it('should have a valid output', function (done) {
			run_jsrevival('-r cli-hide-valid-no-color -j ' + __dirname + '/../contrib/jslint_2013-05-01.js -R -s '+ __dirname + '/Rtest', function (error, stdout, stderr) {
				var jslintHideValid = [

					util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/test.js')),
					'test.js> (error) line 1(9): \'b\' was used before it was defined. "var a = b;"',
					'test.js> Stopping. (100% scanned).',

					// A
					util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/A/testA.js')),
					'testA.js> (error) line 1(1): \'a\' was used before it was defined. "a = 1"',
					'testA.js> Stopping. (100% scanned).',

					// B
					util.format('%s KO', path.relative(process.cwd(), __dirname +'/Rtest/B/testB.js')),
					'testB.js> (error) line 1(6): \'b\' was used before it was defined. "b = 2"',
					'testB.js> Stopping. (100% scanned).',

					// 2 possible end
					'2 errors on 1/2 files',
					'2 errors on 1/1 file',
					'' // This last line is required
				],
				out = stdout.split('\n');
				out.forEach(function(line) {
					assert(jslintHideValid.indexOf(line) !== -1);
				});
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});

	describe('running jsrevival with sublime-text', function () {
		it('should have a valid output', function (done) {
			run_jsrevival('-r sublime-text -j ' + __dirname + '/../contrib/jslint_2013-05-01.js -R -s '+ __dirname + '/Rtest', function (error, stdout, stderr) {
				var
				jslintSublimeText = [
					'test.js# OK',
					 // A
					'testA.js# l1:6>(error) Expected \';\' and instead saw \'(end)\'. "a = 1"',
					'testA.js# Stopping. (100% scanned).',

					// B
					'testB.js# l1:6>(error) Expected \';\' and instead saw \'(end)\'. "b = 2"',
					'testB.js# Stopping. (100% scanned).',

					// 2 possible end
					'2 errors on 1/2 files',
					'2 errors on 1/1 file',
					'' // This last line is required
				],
				out = stdout.split('\n');
				out.forEach(function(line) {
					assert(jslintSublimeText, line);
				});
				assert.strictEqual(error.code, 1);
				assert.strictEqual(stderr, '');
				done();
			});

		});
	});

	describe('running jsrevival -e option', function () {
		it('should have a valid output', function (done) {
			process.env.JSREVIVAL_REPORTER = 'cli-no-color';
			run_jsrevival(util.format('-v -e %s', path.relative(process.cwd(), __dirname +'/Rtest')), function (error, stdout, stderr) {
				assert.strictEqual(stdout, [
						'Verbose mode enabled\n',
						'jsrevival version: ' + version + '\n' ,
						'Reading reporter from user environment:  cli-no-color\n',
						'Reporter:  cli-no-color\n',
						'JSLINT edition: '+ JSLINT_VERSION + '\n',
						'test/Rtest/test.js KO\n',
						'test.js> (error) line 1(9): \'b\' was used before it was defined. "var a = b;"\n',
						'test.js> Stopping. (100% scanned).\n',
						'2 errors on 1/1 file\n'
					].join('')
				);
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});

	describe('running jsrevival -c option', function () {
		it('should have a valid output', function (done) {
			run_jsrevival(
				util.format('-v -r cli-hide-valid-no-color -c %s %s',
					path.relative(process.cwd(), __dirname + '/jslint_conf.json'),
					path.relative(process.cwd(), __dirname +'/Rtest')
					),
				function (error, stdout, stderr) {
					var jslintCOption = [
						'Verbose mode enabled',
						'jsrevival version: ' + version,
						'Reporter:  cli-hide-valid-no-color',
						'Reading jslint config from:  '+ path.relative(process.cwd(), __dirname + '/jslint_conf.json'),
						'JSLint default options overload:',
						'  predef: foo,bar',
						'  ass: true is already default value',
						'  bitwise: true is already default value',
						'  browser: true is already default value',
						'  closure: true is already default value',
						'  continue: true is already default value',
						'  couch: true is already default value',
						'  debug: true is already default value',
						'  devel: true is already default value',
						'  eqeq: true is already default value',
						'  es5: true is already default value',
						'  evil: true is already default value',
						'  forin: true is already default value',
						'  indent: 10 is already default value',
						'  maxerr: 1000 is already default value',
						'  maxlen: 256 is already default value',
						'  newcap: true is already default value',
						'  node: true is already default value',
						'  nomen: true is already default value',
						'  passfail: true is already default value',
						'  plusplus: true is already default value',
						'  properties: true is already default value',
						'  regexp: true is already default value',
						'  rhino: true is already default value',
						'  unparam: true is already default value',
						'  sloppy: true is already default value',
						'  stupid: true is already default value',
						'  sub: true is already default value',
						'  todo: true is already default value',
						'  vars: true is already default value',
						'  white: true is already default value',
						'JSLINT edition: ' + JSLINT_VERSION,
						'test/Rtest/test.js KO',
						'test.js> (error) line 1(9): \'b\' was used before it was defined. "var a = b;"',
						'test.js> Stopping. (100% scanned).',
						'2 errors on 1/1 file',
						'' // This last line is required
					].join('\n');

					assert.strictEqual(stdout, jslintCOption);
					assert.strictEqual(stderr, '');
					done();
			});
		});
	});

	describe('running jsrevival -c option with an invalid jslint config file', function () {
		it('should have a valid output', function (done) {
			run_jsrevival(
				util.format('-v -r cli-hide-valid-no-color -c %s %s',
					path.relative(process.cwd(), __dirname + '/invalid_jslint_conf.json'),
					path.relative(process.cwd(), __dirname +'/Rtest')
					),
				function (error, stdout, stderr) {
					var jslintCOption = [
						'Verbose mode enabled',
						'jsrevival version: ' + version,
						'Reporter:  cli-hide-valid-no-color',
						'Reading jslint config from:  ' + path.relative(process.cwd(), __dirname + '/invalid_jslint_conf.json'),
						'test/invalid_jslint_conf.json KO',
						'invalid_jslint_conf.json> (error) line 17(2): Expected \'}\' to match \'{\' from line 1 and instead saw \'maxlen\'. "	"maxlen":  256,"',
						'invalid_jslint_conf.json> Stopping. (48% scanned).',
						''// This last line is required
					].join('\n');

					assert.strictEqual(stdout, jslintCOption);
					assert.strictEqual(stderr, 'jslint_config_file is not valid!\n');
					done();
			});
		});
	});

	describe('running jsrevival -r and -e option with no env var', function () {
		it('should use -r option', function (done) {
			delete process.env.JSREVIVAL_REPORTER;
			run_jsrevival('-v -r cli-hide-valid-no-color -e ' + __dirname + '/Rtest', function (error, stdout, stderr) {
				assert.strictEqual(stdout, [
						'Verbose mode enabled',
						'jsrevival version: ' + version,
						'Reporter:  cli-hide-valid-no-color',
						'JSLINT edition: '+ JSLINT_VERSION,
						'test/Rtest/test.js KO',
						'test.js> (error) line 1(9): \'b\' was used before it was defined. "var a = b;"',
						'test.js> Stopping. (100% scanned).',
						'2 errors on 1/1 file',
						''
					].join('\n'));
				assert.strictEqual(stderr, '');
				done();
			});
		});
	});
});
