var

cli = require ('./cli');

exports.create = function () {
	return cli.create({
			colorize: true
	});
};
