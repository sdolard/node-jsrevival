var
// node
vm = require('vm'),
fs = require('fs'),
util = require('util'),
path = require('path'),

// contrib
program = require('commander'),

// lib
jsrevival = require('../lib/jsrevival'),

JsRevivalApp = (function() {

	function JsRevivalApp (){
		this.jslint_file = '';
		this.jslint_options = '';
		this.jslint_config_file = '';
		this.verbose = false;
		this.quiet = false;
		this.recursive = false;
		this.stopOnFirstError = false;
		this.reporterName = 'cli'; // default reporter
		this.toLint = [];

		this.getProcessParams(function(){
			this.run();
		}.bind(this));
	}

	JsRevivalApp.getPackage = function() {
		return JSON.parse(fs.readFileSync(__dirname + '/../package.json'));
	};

	/**
	* Display help
	* @static
	*/
	JsRevivalApp.displayHelp = function() {
		program.outputHelp();
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


		getProcessParams: function(cb) {
			var envReporter = '', cleanPredef;

			function mapTrim(a) {
				return a.trim();
			}

			program
				.version(JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'))).version)
				.usage('[options] <file directory ...>')
				.option('-j, --jslint_file <file>', 'overload default')
				.option('-o, --jslint_options <options>', 'overload default. Ex: -o "unparam: false, vars: false"')
				.option('-m, --display_default_options', 'display jslint default options')
				.option('-p, --predefined_names <names>', 'which will be used to declare global variables. Ex: -p "foo, bar"')
				.option('-c, --jslint_config_file <file>', 'jslint config file (JSON expected)')
				.option('-q, --quiet', 'disable writing to std*. Ex: to use jsrevival in shell script')
				.option('-R, --recursive', 'run recursively on directories')
				.option('-r, --reporter <name>', 'cli (default), cli-hide-valid, cli-no-color, cli-hide-valid-no-color, sublime-text')
				.option('-s, --stop_on_first_error', 'stop on first file error')
				.option('-e, --reporter_from_env', 'read reporter config from JSREVIVAL_REPORTER user variable environment (stronger than -r option)')
				.option('-v, --verbose', 'enable verbose mode')
				.parse(process.argv);

				// Args number test
			if (process.argv.length <= 2) {
				JsRevivalApp.displayHelp();
				return process.exit(1);
			}

			if(program.display_default_options) {
				this.displayDefaultOption();
				setTimeout(process.exit, 20); // stdout out synch hach for mocha test
				return;
			}

			this.toLint = program.args;
			// nothing to lint
			if (this.toLint.length === 0) {
				this._error('Nothing to lint!');
				return process.exit(1);
			}

			if (program.jslint_file) {
				this.jslint_file = program.jslint_file;
			}
			if (program.jslint_options) {
				// Required for Windows batch
				this.jslint_options = program.jslint_options.replace(/^\"/, "").replace(/\"$/, "");

			}
			if (program.predefined_names) {
				if (this.jslint_options.length !== 0) {
					this.jslint_options += ', ';
				}
				cleanPredef = program.predefined_names.replace(/^\"/, "").replace(/\"$/, "");
				this.jslint_options += "predef: ['" + cleanPredef.split(',').map(mapTrim).join("','") + "']";
			}
			if (program.jslint_config_file) {
				this.jslint_config_file = program.jslint_config_file;
			}
			if (program.verbose) {
				this.verbose = program.verbose;
			}
			if (program.quiet) {
				this.quiet = program.quiet;
			}
			if (program.stop_on_first_error) {
				this.stopOnFirstError = program.stop_on_first_error;
			}
			if (program.reporter_from_env && process.env.JSREVIVAL_REPORTER) {
				envReporter = process.env.JSREVIVAL_REPORTER;
			}
			if (program.recursive) {
				this.recursive = true;
			}

			// Verbose mode
			this._verbose('Verbose mode enabled');

			this._verbose('jsrevival version: %s', JsRevivalApp.getPackage().version);

			// Reporter
			if (program.reporter) {
				this.reporterName = program.reporter;
			}
			if (envReporter !== '' ) {
				this._verbose('Reading reporter from user environment: ', envReporter);
				this.reporterName = envReporter;
			}
			if (!this.reporterName) {
				this._error('Reporter name is undefined!');
				return process.exit(1);
			}

			// reporter
			try {
				this.reporter = jsrevival.createReporter(this.reporterName);
			} catch(e) {
				if (e.code === 'MODULE_NOT_FOUND') {
					this._error('Reporter not found: '+ this.reporterName);
				} else {
					this._error(e);
				}
				setTimeout(process.exit.bind(this, 1), 20); // stdout out synch hach for mocha test
				return;
			}
			this._verbose('Reporter: ', this.reporterName);


			// stopOnFirstError
			if (this.stopOnFirstError) {
				this._verbose('Stop on first file error enabled');
			}

			// jslint_config_file
			if(this.jslint_config_file !== '') {
				this.lintConfigFile(cb);
			} else  if (this.jslint_options !== ''){
				this._verbose('Reading jslint config from command line');
				// Set from -o and -p option
				this.jslint_options = 'options = {' + this.jslint_options + '}';

				cb();
			} else {
				cb();
			}
		},

		lintConfigFile: function (cb) {
			// we use lib it self to test jslint_config_file

			var
			data,
			linter,
			reporter,
			errorCount = 0;

			this._verbose('Reading jslint config from: ', this.jslint_config_file);

			linter = jsrevival.create();

			linter.on('ready', function() {
				linter.lint(this.jslint_config_file);
			}.bind(this));

			// using cli-hide-valid-no-color reporter
			// reporter
			try {
				reporter = jsrevival.createReporter('cli-hide-valid-no-color');
			} catch(e) {
				if (e.code === 'MODULE_NOT_FOUND') {
					this._error('Reporter not found: '+ this.reporterName);
				} else {
					this._error(e);
				}
				setTimeout(process.exit.bind(this, 1), 20); // stdout out synch hach for mocha test
				return;
			}

			linter.on('lint', function(errors, filename) {
				errorCount = errors.length;
				reporter.onLint(errors, filename);
			});

			linter.on('end', function() {
				reporter.onEnd();
				if (errorCount === 0) {
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

					this.jslint_options =  'options = ' + data;

					cb();
				} else {
					this._error("jslint_config_file is not valid!");
					process.exit(1);
				}
			}.bind(this));

			linter.on('error', function(err) {
				if (err) {
					this._error("%s (%s)", err.message, err.code);
					process.exit(1);
				} else {
					throw new Error('New error without err');
				}
			}.bind(this));
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
					return process.exit(1);
				}

				this._verbose('JSLint default options overload:');
				for(prop in sandbox.options){
					if (sandbox.options.hasOwnProperty(prop)) {
						if (!linter.JSLintOption.hasOwnProperty(prop) && prop !== "predef") {
							this._error("  ! unknown property: %s", prop);
							return process.exit(1);
						}
						if (linter.JSLintOption[prop] !== sandbox.options[prop]) {
							this._verbose("  %s: %s", prop, sandbox.options[prop]);
							linter.JSLintOption[prop] = sandbox.options[prop];
						} else if(this.verbose) {
							this._verbose("  %s: %s is already default value", prop,
								sandbox.options[prop]);
						}
					}
				}
			}

			linter.on('ready', function(edition) {
				var i;
				me._verbose('JSLINT edition: %s', edition);
				if (!me.quiet) {
					if (me.reporter.onReady) {
						me.reporter.onReady(edition);
					}
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
					return process.exit(1);
				}
				throw new Error('New error without err');
			});
		}
	};

	return JsRevivalApp;
}()),

jsRevivalApp = new JsRevivalApp();

