'use strict';

function StyleRule (selector, id) {
	this.selector = selector;
	this.id = id;
	this.pages = [];
}

StyleRule.prototype.addPage = function(page) {
	this.pages.push(page);
};

module.exports = StyleRule;
