var vows = require('vows'),
assert = require('assert'),
jsrevival = require('../lib/jsrevival'),
EEND_COUNT = 0;

exports.suite1 = vows.describe('jsrevival lib').addBatch({
		'When creating a jsrevival instance': {
            topic: function () {
            	var linter = jsrevival.create(); 
            	linter.on('ready', this.callback);
            	linter.on('end', this.callback);
            	return linter;
            },
            '`ready` event should be called with jslint edition param': function (linter, edition) {
            	var s = String(edition);
            	assert.strictEqual(s.length > 0, true);
            }, 
            '`end` event should be called': function (linter) {
            	EEND_COUNT++;
            }
        }
}).addBatch({
'After that': {
	topic: function () {
		return EEND_COUNT;
	},
	'`end` event should has been be called only one time': function (topic) {
		assert.strictEqual(topic, 1);
	}
}
});
