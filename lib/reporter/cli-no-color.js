var
path = require('path'),
util = require('util'),
ansi = require('ansi'),
cursor = ansi(process.stdout);

function CliReporter (config) {
	config = config || {};
	this.colorize = config.colorize;
	this.hideValid = config.hideValid;
}

CliReporter.prototype = {
	/**
	* @param {String} edition
	*/
	onReady: function() {
		this.fileCount = 0;
		this.errorCount = 0;
		this.errorFileCount = 0;
	},

	/**
	* @param {Object} errors
	* @param {String} filename
	*/
	onLint: function(errors, filename) {
		var
		i,
		relativeFilename = path.relative(process.cwd(), filename),
		msg = path.basename(filename) + '> ',
		error;


		if (errors.length > 0) {
			this.color(relativeFilename);
			this.color(' KO\n', 'red');

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
					this.errorCount++;
					if (error.id === undefined) {
						this.color(
							util.format('%s%s\n',
								msg,
								error.reason
							),
							'red'
						);
					} else {
						this.color(
							util.format('%s%s line %d(%d): %s "%s"\n',
								msg,
								error.id,
								error.line,
								error.character,
								error.reason,
								error.evidence
							),
							'red'
						);
					}
				}
			}
			this.errorFileCount++;
		} else {
			// No error
			if (!this.hideValid) {
				this.color(relativeFilename);
				this.color(' OK\n', 'green');
			}
		}
		this.fileCount++;
	},

	onEnd: function() {
		if (this.errorCount > 0) {
			this.color(
				util.format('%d error%s on %d/%d file%s\n',
					this.errorCount,
					this.errorCount > 1 ? 's' : '',
					this.errorFileCount,
					this.fileCount,
					this.fileCount > 1 ? 's' : ''
				),
				'red'
			);
			process.exit(1);
		} else {
			if (this.fileCount > 1) {
				this.color(
					util.format('All file%s(%s) OK\n',
						this.fileCount > 1 ? 's' : '',
						this.fileCount
					),
					'green'
				);
			}
		}
	},

	color: function(s, color) {
		color = color || 'white';
		if (this.colorize){
			cursor[color]()
				.write(s)
				.reset();
			return;
		}
		cursor.write(s);
	}
};

exports.create = function (config) {
	return new CliReporter(config);
};
