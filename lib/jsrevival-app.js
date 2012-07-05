var
// node
path = require('path'), 
util = require('util'),
vm = require('vm'),

// contrib
getopt = require('posix-getopt'), 
colors = require('colors'), 

// lib
jsrevival = require('../lib/jsrevival'),

// gvar
jsRevivalApp,

JsRevivalApp = function(){
    var
    i;
    
    // Args number test
    if (process.argv.length <= 2) {
        JsRevivalApp.displayHelp();
        process.exit(1);
    }
    
    this.jslint_file = '';
    this.jslint_options = '';
    this.verbose = false;
    this.quiet = false;
    this.recursive = false; 
    this.stopOnFirstError = false;
    
    
    // tmp toLint array 
    this.toLint = [];
    for(i = 2; i < process.argv.length; i++) {
        this.toLint.push(process.argv[i]);
    }
    
    this.getProcessParams();
    this.run();
};

/**
* Display help
*/
JsRevivalApp.displayHelp = function() {
    console.log('jsrevival [-j jslint_file] [-o jslint_options_file] [-s] [–m] [–v] [-R] [–q] [-p prefef] [–h] files directories ... ');
    console.log('jsrevival: a JSLint cli.');
    console.log('Options:');
    console.log('  j: jslint file (overload default)');
    console.log('  o: jslint option (overload default). Ex: -o "unparam: true, vars: false..."');
    console.log('  m: display jslint default option');
    console.log('  v: verbose mode');
    console.log('  R: run recursively on directories');
    console.log('  s: stop on first file error');
    console.log('  q: quiet. Ex: to use jsrevival in shell script');    
    // can be an array of names, which will be used to declare global variables,
    // or an object whose keys are used as global names, with a boolean value
    // that determines if they are assignable.
    console.log('  p: predefined names, which will be used to declare global variables. Ex: -p "foo, bar"');// predef, 
    console.log('  h: display this help');
};


// Log
JsRevivalApp.prototype._log = function() {
    if (this.quiet){
        return;
    }
    console.log.apply(console, arguments);
};

// Error log
JsRevivalApp.prototype._error = function() {
    if (this.quiet) {
        return;
    }
    console.error.apply(console, arguments);
};


JsRevivalApp.prototype.displayDefaultOption = function() {
    var prop; 
    this._log('JSLint default options:');
    for (prop in jsrevival.defaultJSLintOption){
        if (jsrevival.defaultJSLintOption.hasOwnProperty(prop)) {
            this._log('  %s: %s # %s', prop, jsrevival.defaultJSLintOption[prop], jsrevival.defaultJSLintOptionMsg[prop]);
        }
    }
};


JsRevivalApp.prototype.getProcessParams = function() {
    var 
    optParser,
    opt;
    
    // Command line options
    optParser = new getopt.BasicParser(':hRvmqsj:p:o:', process.argv);
    while ((opt = optParser.getopt()) !== undefined && !opt.error) {
        switch(opt.option) {
        case 'j': //  jslint file
            this.toLint.shift();
            this.toLint.shift();
            this.jslint_file = opt.optarg;
            break;
            
        case 'o': // jslint_options_file
            this.toLint.shift();
            this.toLint.shift();
            if (this.jslint_options.length !== 0) {
                this.jslint_options += ',';
            }
            this.jslint_options += opt.optarg;
            break;
            
        case 'p': // predefined names
            this.toLint.shift();
            this.toLint.shift();
            if (this.jslint_options.length !== 0) {
                this.jslint_options += ',';
            }
            this.jslint_options += "predef: ['" + opt.optarg.split(',').join("','") + "']";
            break;
            
        case 'v': // verbose
            this.toLint.shift();
            this.verbose = true;
            break;
            
        case 'h': // help
            this.toLint.shift();
            JsRevivalApp.displayHelp();
            process.exit();
            break;
            
        case 'm': // display default options
            this.toLint.shift();
            this.displayDefaultOption();
            process.exit();
            break;
            
        case 'q': // quiet
            this.toLint.shift();
            this.quiet = true;
            break;
            
        case 'R': // directory recursive parsing
            this.toLint.shift();
            this.recursive = true;
            break;
            
        case 's': // stop on first error
            this.toLint.shift();
            this._log('Stop on first file error enabled');
            this.stopOnFirstError = true;
            break;
            
        default:
            this._error('Invalid or incomplete option');
            JsRevivalApp.displayHelp();
            process.exit(1);    
        }
    }
    
    // Verbose mode
    if(this.verbose) {
        this._log('Verbose mode enabled');
    }
};


JsRevivalApp.prototype.run = function() {
    // Linter ctor
    var 
    me = this,
    fileCount = 0,
    errorCount = 0,
    errorFileCount = 0,
    linter = jsrevival.create({
            recursive: this.recursive,
            stopOnFirstError: this.stopOnFirstError,
            JSLintFilename: this.jslint_file,
            verbose: this.verbose
    }),
    sandbox = {
        result: undefined
    },
    prop;
    
    if (this.jslint_options !== ''){
        // Set from -o and -p option
        this.jslint_options = '{' + this.jslint_options + '}';
        
        try {
            vm.runInNewContext('result = '+ this.jslint_options , sandbox, 'tmp.txt');
        } catch(e) {
            this._log('jslint_options: %s', this.jslint_options);
            this._error('!Aborting: jslint option format is not valid.');
            process.exit(1);
        }
        
        this._log('JSLint default options overload:');
        for(prop in sandbox.result){
            if (sandbox.result.hasOwnProperty(prop)) {
                if (!linter.JSLintOption.hasOwnProperty(prop) && prop !== "predef") {
                    this._error("  ! unknown property: %s", prop);
                    process.exit(1);
                } else if (linter.JSLintOption[prop] !== sandbox.result[prop]) {
                    this._log("  %s: %s", prop, sandbox.result[prop]);
                    linter.JSLintOption[prop] = sandbox.result[prop];
                } else {
                    this._log("  %s: %s is already default value", prop, 
                        sandbox.result[prop]);
                }
            }
        }
    }
    
    
    linter.on('ready', function(edition) {
            var i;
            me._log('JSLINT edition: %s', edition);
            for (i = 0; i < me.toLint.length; i++) {
                linter.lint(me.toLint[i]);
            }
    });
    
    linter.on('lint', function onLint(errors, filename) {   
            var 
            i,
            relativeFilename = path.relative(process.cwd(), filename),
            msg = path.basename(filename) + '> ',
            error, 
            evidence;
            
            me._log('Running jslint on %s...', relativeFilename);
            
            
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
                            me._log(util.format('%s%s', 
                                msg, 
                                error.reason));
                        } else {
                            evidence = error.evidence;
                            me._log(util.format('%s%s line %d(%d): %s "%s"', 
                                msg,
                                error.id, 
                                error.line, 
                                error.character, 
                                error.reason, 
                                error.evidence));
                        }
                    }
                }
                errorFileCount++;
                me._log("%s KO", relativeFilename);
                
            } else {
                // No error
                me._log("%s OK", relativeFilename);
            }
            fileCount++;
    });
    
    linter.on('end', function() {
            if (errorCount > 0) {
                me._log('%d error%s on %d/%d file%s', errorCount, errorCount > 1 ? 's' : '', errorFileCount, fileCount, fileCount > 1 ? 's' : '');
                process.exit(1);
            } else {
                if (fileCount > 1) {
                    me._log('All file%s(%s) OK', fileCount > 1 ? 's' : '', fileCount);
                }
            }
            
    });
    
    linter.on('error', function(err) {
            if (err) {
                me._error("%s (%s)", err.message, err.code);
                process.exit(1);
            }
            
    });
};

jsRevivalApp  = new JsRevivalApp();


