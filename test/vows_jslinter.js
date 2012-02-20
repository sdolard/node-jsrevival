// division-by-zero-test.js
var vows = require('vows'),
assert = require('assert'),
exec = require('child_process').exec;

function run_jslinter(option, callback) {
	exec('node ' + __dirname + '/../bin/jslinter.js ' + option, callback);
}

// Create a Test Suite
vows.describe('jslinter option').addBatch({
		'When passing no option': {
            topic: function () {
            	run_jslinter('', this.callback);
            },
            'help should be displayed to stdout': function (error, stdout, stderr) {
            	var ref = [
            		'jslinter [-j jslint_file] [-o jslint_options_file] [–m] [–v] [-R] [–q] [-s] [-u] [-p prefef] [–h] files directories ... ',
            		'jslinter: a JSLint cli.',
            		'Options:',
            		'  j: jslint file (overload default)',
            		'  o: jslint option (overload default). Ex: -o "unparam: true, vars: false..."',
            		'  m: display jslint default option',
            		'  v: verbose mode',
            		'  R: run recursively on directories',
            		'  q: quiet. Ex: to use jslinter in shell script',
            		'  s: stop on first error',
            		'  u: update jslint online.',
            		'  p: predefined names, which will be used to declare global variables',
            		'  h: display this help',
            		'' // This last line is required
            	].join('\n');
            	
            	assert.strictEqual(error.code, 1);
            	assert.strictEqual(stdout, ref);
            	assert.strictEqual(stderr, '');
            }
        },
        'When passing -m option': {
            topic: function () {
            	run_jslinter('-m', this.callback);
            },
            'option should be displayed to stdout': function (error, stdout, stderr) {
            	var ref = [
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
            	].join('\n');
            	
            	assert.strictEqual(error, null);
            	assert.strictEqual(stdout, ref);
            	assert.strictEqual(stderr, '');
            }
        }
        
}).run(); // Run it

