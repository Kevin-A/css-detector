var spawn = require('child_process').spawn;
var Mediator = require('./mediator');

function CrawlTask (url, websiteId, pageLimit) {
	this.url = url;
	this.websiteId = websiteId;
	this.pageLimit = pageLimit;
}

CrawlTask.prototype.crawl = function () {
	var arguments = ['index.js', '--disk-cache=no' , '--web-security=no', '--ignore-ssl-errors=true', '--ssl-protocol=any', '--url=' + this.url.href, '--id=' + this.websiteId];

	if (this.pageLimit > 0) {
		arguments.push('--pageLimit=' + this.pageLimit);
	}

	var crawler = spawn('casperjs',
		arguments,
		{
			cwd: '../crawler/'
		}
	);

	crawler.stdout.on('data', function (data) {
		var lines = ('' + data).split('\n');
		for (var i = 0; i < lines.length; i++) {
			if (lines[i]) {
				console.log(lines[i]);
			}
		};
	});

	crawler.stderr.on('data', function (data) {
	});

	crawler.on('close', function (code) {
	});
}

module.exports = CrawlTask;
