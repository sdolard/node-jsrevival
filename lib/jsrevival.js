var 
vm = require('vm'),
fs = require('fs'),
jslint = fs.readFileSync(__dirname + '/jslint.js', 'utf-8'),
sandbox = {
	result: undefined
},
i = 0,
error,
options = '{ white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true }',
code = 'toto = "';

code.replace("'", "\\'");
code = "[ '" + code.replace("\n", "', '") + "' ]";

vm.runInNewContext(jslint + ' var result = JSLINT(' + code + ',' + options + ' );', sandbox);
//console.log(sandbox);

if (!sandbox.result) {
//	debugger;
	for (i = 0; i < sandbox.JSLINT.errors.length; i++) {
		error = sandbox.JSLINT.errors[i];
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
				console.log(error.reason);
			} else {console.log('%s line %d(%d): %s "%s"', error.id, error.line, error.character, 
					error.reason, error.evidence);
			}
		}
	}
}
