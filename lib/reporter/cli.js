var
path = require('path'),
colors = require('colors'),
util = require('util');

function CliReporter (config) {
	config = config || {};
	
	this.fileCount = 0;
    this.errorCount = 0;
    this.errorFileCount = 0;
    this.colorize = config.colorize;
}

CliReporter.prototype = {
	/**
	* @param {String} edition
	*/
	onReady: function(edition) {
		console.log('JSLINT edition: %s', edition);
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
		error, 
		evidence;
		
		//if(!me.quiet) {
		process.stdout.write(util.format('%s...', relativeFilename));
		//}
		if (errors.length > 0) {
			//if(!me.quiet) {
			process.stdout.write("\n");
			//}
			
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
						console.log(util.format(this.color('%s%s', 'red'), 
							msg, 
							error.reason));
					} else {
						evidence = error.evidence;
						console.log(util.format(this.color('%s%s line %d(%d): %s "%s"', 'red'), 
							msg,
							error.id, 
							error.line, 
							error.character, 
							error.reason, 
							error.evidence));
					}
				}
			}
			this.errorFileCount++;
			//me._log("%s KO", relativeFilename);
			
		} else {
			// No error
			//if(!me.quiet) {
			process.stdout.write(this.color(" OK\n", 'green'));
			//}
			
		}
		this.fileCount++;
	},
	
	onEnd: function() {
		if (this.errorCount > 0) {
			console.log(this.color('%d error%s on %d/%d file%s', 'red'), 
				this.errorCount, 
				this.errorCount > 1 ? 's' : '',
				this.errorFileCount, 
				this.fileCount, 
				this.fileCount > 1 ? 's' : '');
			process.exit(1);
		} else {
			if (this.fileCount > 1) {
				console.log(this.color('All file%s(%s) OK', 'green'), 
					this.fileCount > 1 ? 's' : '', 
					this.fileCount);
			}
		}
	},
	
	color: function(s, color) {
		if (this.colorize){
			return String(s)[color];
		}
		return s;
	}
};

exports.create = function (config) {
	return new CliReporter(config);
};
