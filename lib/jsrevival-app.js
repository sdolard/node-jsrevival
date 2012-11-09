var
// node
vm = require('vm'),
fs = require('fs'),

// contrib
getopt = require('posix-getopt'), 
jsonlint = require('jsonlint'),

// lib
jsrevival = require('../lib/jsrevival'),

JsRevivalApp = (function() {

	function JsRevivalApp (){
		var i;

		// Args number test
		if (process.argv.length <= 2) {
			JsRevivalApp.displayHelp();
			process.exit(1);
		}

		this.jslint_file = '';
		this.jslint_options = '';
		this.jslint_config_file = '';
		this.verbose = false;
		this.quiet = false;
		this.recursive = false; 
		this.stopOnFirstError = false;
		this.reporterName = 'cli'; // default reporter


		// tmp toLint array 
		this.toLint = [];
		for(i = 2; i < process.argv.length; i++) {
			this.toLint.push(process.argv[i]);
		}

		this.getProcessParams();
		this.run();
	}

	/**
	* Display help
	* @static
	*/
	JsRevivalApp.displayHelp = function() {
		console.log('jsrevival [-j jslint_file] [ [ [-o jslint_options] [-p prefef] ] || [–c jslint_config_file] ] [-s] [–m] [–v] [-R] [–q]  [ [-r reporterName] || [-e] ] [–h] files directories ... ');
		console.log('jsrevival: a JSLint cli.');
		console.log('Options:');
		console.log('  j: jslint file (overload default)');
		console.log('  o: jslint option (overload default). Ex: -o "unparam: true, vars: false..."');
		console.log('  p: predefined names, which will be used to declare global variables. Ex: -p "foo, bar"');// predef, 
		console.log('  c: jslint config file (JSON expected)');
		console.log('  m: display jslint default option');
		console.log('  v: verbose mode');
		console.log('  R: run recursively on directories');
		console.log('  s: stop on first file error');
		console.log('  q: quiet. Ex: to use jsrevival in shell script');    
		// can be an array of names, which will be used to declare global variables,
		// or an object whose keys are used as global names, with a boolean value
		// that determines if they are assignable.
		console.log('  e: read reporter config from JSREVIVAL_REPORTER user variable environment (stronger than -r option)');
		console.log('  h: display this help');
		console.log('  r: reporter (default: cli)');
		console.log('     reporter list:');
		console.log('      - cli');
		console.log('      - cli-hide-valid');
		console.log('      - cli-no-color');
		console.log('      - cli-hide-valid-no-color');
		console.log('      - sublime-text');
	};


	JsRevivalApp.prototype = {
		// Log
		_verbose: function() {
			if (!this.verbose) {
				return;
			}
			console.log.apply(console, arguments);
		},
		
		// Error log
		_error: function() {
			if (this.quiet) {
				return;
			}
			console.error.apply(console, arguments);
		},
		
		
		displayDefaultOption: function() {
			var prop; 
			console.log('JSLint default options:');
			for (prop in jsrevival.defaultJSLintOption){
				if (jsrevival.defaultJSLintOption.hasOwnProperty(prop)) {
					console.log('  %s: %s # %s', prop, jsrevival.defaultJSLintOption[prop], jsrevival.defaultJSLintOptionMsg[prop]);
				}
			}
		},
		
		
		getProcessParams: function() {
			var 
			optParser,
			opt, 
			displayHelp = false,
			displayDefaultOption = false,
			data,
			config,
			cliReporter = '',
			envReporter = '';

			// Command line options
			optParser = new getopt.BasicParser(':heRvmqsj:p:o:r:c:', process.argv);
			while ((opt = optParser.getopt()) !== undefined && !opt.error) {
				switch(opt.option) 
				{
				case 'j': //  jslint file
				this.toLint.shift();
				this.toLint.shift();
				this.jslint_file = opt.optarg;
				break;

				case 'o': // jslint_options
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

				case 'c': // jslint_config_file
				this.toLint.shift();
				this.toLint.shift();
				this.jslint_config_file += opt.optarg;
				break;

				case 'v': // verbose
				this.toLint.shift();
				this.verbose = true;
				break;

				case 'h': // help
				this.toLint.shift();
				displayHelp = true;
				break;

				case 'm': // display default options
				this.toLint.shift();
				displayDefaultOption = true;
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
				this.stopOnFirstError = true;
				break;

				case 'r': // reporter
				this.toLint.shift();
				this.toLint.shift();                
				cliReporter = opt.optarg;
				break;

				case 'e': // reporter
				this.toLint.shift();
				if (process.env.JSREVIVAL_REPORTER) {
					envReporter = process.env.JSREVIVAL_REPORTER;
				}
				break;

				default:
				this._error('Invalid or incomplete option');
				JsRevivalApp.displayHelp();
				return process.exit(1); 
			}
		}

		if(displayHelp) {
			JsRevivalApp.displayHelp();
			return process.exit();
		}

		if(displayDefaultOption) {
			this.displayDefaultOption();
			return process.exit();
		}

			// Verbose mode
			this._verbose('Verbose mode enabled');
			// Reporter
			if (cliReporter !== '') {
				this.reporterName = cliReporter;
			}
			if (envReporter !== '' ) {
				this._verbose('Reading reporter from user environment: ', envReporter);
				this.reporterName = envReporter;
			}
			if (!this.reporterName) {
				this._error('Reporter name is undefined!');
				return process.exit(1);
			}
			
			// nothing to lint
			if (this.toLint.length === 0) {
				this._error('Nothing to lint!');
				return process.exit(1);
			}
			

			// reporter        
			try {
				this.reporter = require('./reporter/' + this.reporterName);
			} catch(e) {
				this._error('Reporter not found: '+ this.reporterName);
				return process.exit(1);
			}
			this.reporter = this.reporter.create();
			this._verbose('Reporter: ', this.reporterName);
			
			
			if (this.stopOnFirstError) {
				this._verbose('Stop on first file error enabled');
			}
			
			if(this.jslint_config_file !== '') {
				this._verbose('Reading jslint config from: ', this.jslint_config_file);
				try {
					data = fs.readFileSync(this.jslint_config_file, 'utf-8');
				} catch(err) {
					if (err.code === 'ENOENT') {
						this._error('jslint_config_file not found! ('+ this.jslint_config_file + ')');
					} else {
						this._error(err);
					}
					return process.exit(1);
				}

				try {
					config = jsonlint.parse(data);
				} catch (err2) {
					this._error(err2);
					return process.exit(1);
				}
				this.jslint_options =  'options = ' + data;

			} else  if (this.jslint_options !== ''){
				this._verbose('Reading jslint config from command line');
				// Set from -o and -p option
				this.jslint_options = 'options = {' + this.jslint_options + '}';
			}
		},
		
		run: function() {
			// Linter ctor
			var 
			me = this,
			linter = jsrevival.create({
				recursive: this.recursive,
				stopOnFirstError: this.stopOnFirstError,
				JSLintFilename: this.jslint_file,
				verbose: this.verbose
			}),
			sandbox = {},
			prop;
			
			if (this.jslint_options !== ''){
				try {
					vm.runInNewContext(this.jslint_options , sandbox, 'tmp.txt');
				} catch(e) {
					this._verbose('jslint_options: %s', this.jslint_options);
					this._error('!Aborting: jslint option format is not valid.');
					process.exit(1);
				}

				this._verbose('JSLint default options overload:');
				for(prop in sandbox.options){
					if (sandbox.options.hasOwnProperty(prop)) {
						if (!linter.JSLintOption.hasOwnProperty(prop) && prop !== "predef") {
							this._error("  ! unknown property: %s", prop);
							process.exit(1);
						} else if (linter.JSLintOption[prop] !== sandbox.options[prop]) {
							this._verbose("  %s: %s", prop, sandbox.options[prop]);
							linter.JSLintOption[prop] = sandbox.options[prop];
						} else {
							if(this.verbose) {
								this._verbose("  %s: %s is already default value", prop, 
									sandbox.options[prop]);
							}
						}
					}
				}
			}
			
			linter.on('ready', function(edition) {
				var i;
				me._verbose('JSLINT edition: %s', edition);
				if (!me.quiet) {
					me.reporter.onReady(edition);
				}

				for (i = 0; i < me.toLint.length; i++) {
					linter.lint(me.toLint[i]);
				}
			});
			
			linter.on('lint', function onLint(errors, filename) {   
				if (!me.quiet) {
					me.reporter.onLint(errors, filename);
				}
			});
			
			linter.on('end', function() {
				if (!me.quiet) {
					me.reporter.onEnd();
				}
			});
			
			linter.on('error', function(err) {
				if (err) {
					me._error("%s (%s)", err.message, err.code);
					process.exit(1);
				} else {
					throw new Error('New error without err');
				}
			});
		}
	};

	return JsRevivalApp;
}()),

jsRevivalApp = new JsRevivalApp();

