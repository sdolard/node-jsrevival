var

cli = require ('./cli-no-color');

exports.create = function () {
	return cli.create({
			colorize: true,
			hideValid: true
	});
};
