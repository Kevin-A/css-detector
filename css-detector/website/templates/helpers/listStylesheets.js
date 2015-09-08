module.exports = function (stylesheets, websiteId, type) {
	if (!stylesheets) {
		return '';
	}
	
	var html = "<ul>";
	stylesheets.forEach(function (sheet) {
		if (type === sheet.type) {
			html += '<li><a href="' + websiteId + '/stylesheets/' + sheet.id +'">' + sheet.sourceUrl + '</a></li>';
		}
	});
	html += '</ul>';
	return html;
};
