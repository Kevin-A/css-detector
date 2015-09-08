var Handlers = require('./handlers/handlers');
var Runner = require('./casper/runner');
var Config = require('./config');

var WebsiteHandler = require('./handlers/WebsiteHandler');
var LinkHandler = require('./handlers/linkHandler');
var PageHandler = require('./handlers/pageHandler');
var StylesheetHandler = require('./handlers/stylesheetHandler');
var LogHandler = require('./handlers/LogHandler');
var FormHandler = require('./handlers/FormHandler');
var TestHandler = require('./handlers/TestHandler');
var postcss = require('./handlers/postcss');
var StatusHandler = require('./handlers/statusHandler');

module.exports = [

	{ method: 'GET', path: '/tests', config: TestHandler.overview },
	{ method: 'POST', path: '/tests', config: TestHandler.run },
	{ method: 'GET', path: '/tests/{testName*}', config: TestHandler.test },

	{ method: 'GET', path: '/',	           config: Handlers.index },
	{ method: 'GET', path: '/{websiteId}',   config: Handlers.webpage },
	{ method: 'GET', path: '/{websiteId}/stylesheets/{stylesheetId}', config: Handlers.stylesheet },
	{ method: 'GET', path: '/{websiteId}/{rule}', config: Handlers.rule },

	{ method: 'POST', path: '/crawl', config: Runner.crawl },
	{ method: 'GET', path: '/status/{websiteId}', config: Runner.status },

	{ method: 'POST', path: '/websites', config: WebsiteHandler.create },

	{ method: 'POST', path: '/links', config: LinkHandler.create },
	{ method: 'POST', path: '/websites/{websiteId}/pages', config: PageHandler.create },
	{ method: 'POST', path: '/websites/{websiteId}/pages/{pageId}/visit', config: PageHandler.visit },

	{ method: 'POST', path: '/websites/{websiteId}/forms', config: FormHandler.create },
	{ method: 'POST', path: '/websites/{websiteId}/pages/{pageId}/forms/{formId}', config: FormHandler.fill },
	{ method: 'GET',  path: '/websites/{websiteId}/forms', config: FormHandler.getForms },
	{ method: 'POST', path: '/forms/{formId}', config: FormHandler.submit },

	{ method: 'POST', path: '/logs', config: LogHandler.create },
	{ method: 'POST', path: '/logs/{logId}/entries', config: LogHandler.createEntry },

	{ method: 'POST', path: '/websites/{websiteId}/stylesheets', config: StylesheetHandler.create },
	{ method: 'POST', path: '/websites/{websiteId}/ruleusages', config: StylesheetHandler.ruleUsage },

	{ method: 'POST', path: '/postcss', config: postcss.parse },

	{ method: 'POST', path: '/websites/{websiteId}/status', config: StatusHandler.update },

	{
		method: 'GET',
		path: '/public/{param*}',
		handler: {
			directory: {
				path: 'public',
				listing: 'true'
			}
		}
	},
	{
		method: 'GET',
		path: '/data/{param*}',
		handler: {
			directory: {
				path: Config.dataFolder
			}
		}
	}
];
