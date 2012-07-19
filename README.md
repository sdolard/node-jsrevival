# node-jsrevival [![Build Status](https://secure.travis-ci.org/sdolard/node-jsrevival.png?branch=master)](http://travis-ci.org/sdolard/node-jsrevival)
A javascript lib and cli linter using JSLint


* http://nodejs.org

## Installation with npm 
### Installing npm (node package manager: http://npmjs.org/)

```
curl http://npmjs.org/install.sh || sh	
```

### Installing jsrevival

```
[sudo] npm install [-g] jsrevival
```


## Usage
### CLI
```
jsrevival [-j jslint_file] [-o jslint_options_file] [-s] [–m] [–v] [-R] [–q] [-p prefef] [-r reporterName] [–h] files directories ... 
jsrevival: a JSLint cli.
Options:
  j: jslint file (overload default)
  o: jslint option (overload default). Ex: -o "unparam: true, vars: false..."
  m: display jslint default option
  v: verbose mode
  R: run recursively on directories
  s: stop on first file error
  q: quiet. Ex: to use jsrevival in shell script
  p: predefined names, which will be used to declare global variables. Ex: -p "foo, bar"
  h: display this help
  r: reporter (default: cli)
     reporter list:
      - cli
      - cli-hide-valid
      - cli-no-color
      - cli-hide-valid-no-color

```

### Lib: basic 
```javascript
var
jsrevival = require('../lib/jsrevival'),
linter = jsrevival.create();

linter.on('ready', function() {
		linter.lint(__dirname + '/../test/Rtest/test.js');
});

linter.on('lint', function (errors, filename) {
		console.log("filename: %s, error count: %d", filename, errors.length);
});

```

### Examples
* examples/basic.js
* bin/jsrevival.js


### Reporters
* cli-colored (default)
* cli



## Exports 

### JSRevival class 
```
/**
* @class
* @public
* @params [{object}] config
* @params [{string}] config.JSLintFilename
* @params [{object}] config.JSLintOption
* @params [{boolean}]config.recursive. Default to false. Only valid for directories.
* @params [{boolean}] config.stopOnFirstError. Default to false.
* @event ready({string} JSLINT edition) // class has load jslint.js > lint method can be called there
* @event lint({array} errors, {string} filepath) // lint what ever you want
* @event end // there is no more things to lint
* @event error({Error} err) 
*/
```

### JSRevival.lint method
```
/**
* method
* @param {string} toLint: a file, a directory
*/
```


## License
### jsrevival
node-jsrevival is licensed under the MIT license.

### JSLint
Copyright (c) 2002 Douglas Crockford  (www.JSLint.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

The Software shall be used for Good, not Evil.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
