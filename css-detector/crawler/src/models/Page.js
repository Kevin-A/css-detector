function Page (website, url, id) {
	this.website = website;
	this.url = url;
	this.activeSheets = [];

	if (!id) {
		this.createId();
	}
	else {
		this.id = id;
	}
}

Page.prototype.createId = function createId () {
	var res = casper.POST('/websites/' + this.website.id + '/pages', {
		url: JSON.stringify([this.url.full()])
	});

	this.id = res[0].id;
};

Page.prototype.visited = function visited() {
	casper.POST('/websites/' + this.website.id + '/pages/' + this.id + '/visit', {});
};

module.exports = Page;
