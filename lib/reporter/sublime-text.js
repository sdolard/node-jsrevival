var
path = require('path'),
util = require('util');

function SublimeText (config) {
	config = config || {};

	this.fileCount = 0;
	this.errorCount = 0;
	this.errorFileCount = 0;
	this.colorize = false;
	this.hideValid = false;
}

SublimeText.prototype = {
	/**
	* @param {Object} errors
	* @param {String} filename
	*/
	onLint: function(errors, filename) {
		var
		i,
		fileBasename = path.basename(filename) + '#',
		error;


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
					this.errorCount++;
					if (error.id === undefined) {
						console.log(util.format('%s %s',
							fileBasename,
							error.reason
						));
					} else {
						console.log(util.format('%s l%d:%d>%s %s "%s"',
							fileBasename,
							error.line,
							error.character,
							error.id,
							error.reason,
							error.evidence
						));
					}
				}
			}
			this.errorFileCount++;
		} else {
			// No error
			if (!this.hideValid) {
				process.stdout.write(fileBasename);
				process.stdout.write(' OK\n');
			}
		}
		this.fileCount++;
	},

	onEnd: function() {
		process.exit(1);
	}
};

exports.create = function (config) {
	return new SublimeText(config);
};
