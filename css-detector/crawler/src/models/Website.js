function Website (url, websiteId) {
	this.url = url;
	this.id = websiteId;

	if (!websiteId) {
		console.log('Creating websiteId');
		var res = casper.POST('/websites', { url: url.full() });
		this.id = res.id;
	}
}

module.exports = Website;
