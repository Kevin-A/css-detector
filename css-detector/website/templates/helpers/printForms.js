module.exports = function (forms) {
	var html = "";
	forms.forEach(function (form) {
		html += '<h3>' + form.selector + '</h3>';
		var url = "/websites/" + form.WebsiteId + "/pages/" + form.PageId + "/forms/" + form.id;
		html += '<form method="POST" action="' + url + '">';
		html += '<input type="hidden" value="' + form.selector + '" name="selector"/>';

		// $('<img>').attr('src', data.src).appendTo('#forms');
		html += form.html;

		html += '</form>';
		html += '<hr>';
	});
	return html;
};
