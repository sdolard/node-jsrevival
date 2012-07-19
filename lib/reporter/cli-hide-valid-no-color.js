var

cli = require ('./cli-no-color');

exports.create = function () {
	return cli.create({
			colorize: false,
			hideValid: true
	});
};
