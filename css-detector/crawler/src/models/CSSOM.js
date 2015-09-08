'use strict';

function CSSOM (rawContent) {
	this.tree = {
		"nodes": [],
		"type": "root",
		"after": "''",
		"lastEach": 1,
		"indexes": {}
	};

	if (rawContent.length > 0) {
		console.log('Has rawContent, posting CSSOM');
		var res = casper.POST('/postcss', { rawContent: rawContent });

		this.tree = res;
	}
}

CSSOM.prototype.each = function (callback) {
	if (this.tree) {
		this.tree.nodes.forEach(callback);
	}
	else {
		console.log('this.tree.nodes doesnt exist');
	}
};

/**
 * Recursively iterate through the children, calling callback on each node
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
CSSOM.prototype.eachInside = function (filter, callback) {
	function eachInside (filter, node, callback) {
		// LOL DUPLICATE CODE I KNOW
		if (filter && (node.type !== filter.type || node.name !== filter.name)) {
			if (node.nodes) {
				node.nodes.forEach(function (childNode) {
					eachInside(filter, childNode, callback);
				});
			}
			return;
		}

		callback(node);
		if (node.nodes) {
			node.nodes.forEach(function (childNode) {
				eachInside(filter, childNode, callback);
			});
		}
	}

	this.each(function (childNode) {
		eachInside(filter, childNode, callback);
	});
};

/**
 * Recursively iterate through the atrules, calling callback on each node
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
CSSOM.prototype.eachAtRule = function (filter, callback) {
	this.eachInside({ type: 'atrule', name: filter }, callback);
};

CSSOM.prototype.eachRule = function (callback) {
	this.eachInside({ type: 'rule' }, callback);
};

CSSOM.prototype.getSelectors = function () {
	var selectors = {};

	this.eachInside(null, function (rule) {
		// console.log('checking: ' + rule.type);
		if (rule.selectorList) {
			// console.log('selectorList: ' + rule.selectorList);
			rule.selectorList.forEach(function (selector) {
				selectors[selector] = [];
			});
		}
	});

	return selectors;
};

module.exports = CSSOM;
