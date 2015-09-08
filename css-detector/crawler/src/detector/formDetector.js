var Form = require('../models/form');


exports.detect = function detect(website, page) {
	var forms = findForms();

	for (var i = 0; i < forms.length; i++) {
		var args = forms[i];
		var form = new Form(website, page, i, args);
	}
};

function findForms() {
	return casper.evaluate(function () {
		return Array.prototype.map.call(__utils__.findAll('form'), function(e) {
			// console.log('Found form with an id: ' + e.getAttribute('id'));
			var id = "";
			if (e.getAttribute('id')) {
				id = '#' + e.getAttribute('id');
			}
			else {
				id = getDOMPath(e);
			}
			return {
				selector: id,
				innerHTML: e.innerHTML
			};
		});
	});
}
