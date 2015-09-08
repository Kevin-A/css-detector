"use strict";

function createId(form) {
	var res = casper.POST('/websites/' + form.website.id + '/forms', {
		pageId: form.page.id,
		src: form.src,
		html: form.innerHTML,
		selector: form.selector,
		url: form.page.url.full()
	});

	return res.id;
}

function Form (website, page, i, args) {
	this.website = website;
	this.page = page;
	this.selector = args.selector;
	this.innerHTML = args.innerHTML;

	this.src = '/data/' + website.id + '/forms/' + page.id + '/' + i + '.png';

	this.id = createId(this);

	casper.captureSelector(dataFolder + '/' + website.id + '/forms/' + page.id + '/' + i + '.png', args.selector);
}



module.exports = Form;
