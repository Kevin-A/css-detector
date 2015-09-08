var fs = require('fs');
var path = require('path');
var Config = require('../config');
var Database = require('../database/database');
var sequelize = Database.sequelize;
var Chainer = Database.Sequelize.QueryChainer;
var Website = Database.Website;
var RuleUsage = Database.RuleUsage;
var Stylesheet = Database.Stylesheet;
var _ = require('underscore');
var Boom = require('boom');
var Joi = require('joi');

var queryAllUsage = "SELECT Rules.id as RuleId, Rules.selector as selector, Pages.id as PageId, Pages.url as url \
					FROM (SELECT Rules.id, Rules.selector  \
					    FROM Rules \
					    WHERE Rules.StylesheetId in ( \
					        SELECT id  \
					        FROM Stylesheets \
					        WHERE WebsiteId = :websiteId \
					)) as Rules \
					LEFT JOIN ( \
					    SELECT PageId, RuleId \
					    FROM RuleUsages \
					) AS RuleUsages \
					ON Rules.id = RuleUsages.RuleId \
					LEFT JOIN Pages \
					ON RuleUsages.PageId = Pages.id";
					
var querySheetUsage = "SELECT Rules.id as RuleId, Rules.selector as selector, Pages.id as PageId, Pages.url as url \
					FROM (SELECT Rules.id, Rules.selector  \
					    FROM Rules \
					    WHERE Rules.StylesheetId = :stylesheetId) as Rules \
					LEFT JOIN ( \
					    SELECT PageId, RuleId \
					    FROM RuleUsages \
					) AS RuleUsages \
					ON Rules.id = RuleUsages.RuleId \
					LEFT JOIN Pages \
					ON RuleUsages.PageId = Pages.id";

function getUsageWebsite(websiteId) {
	return sequelize.query(queryAllUsage, {
		replacements: {
			websiteId: websiteId
		},
		type: sequelize.QueryTypes.SELECT
	});
}

function getUsageStylesheet(stylesheetId) {
	return sequelize.query(querySheetUsage, {
		replacements: {
			stylesheetId: stylesheetId
		},
		type: sequelize.QueryTypes.SELECT
	});
}

function getData(websiteId) {
	// Verify if the selected website has been crawled

	return getWebsite(websiteId)
	.then(function (website) {

		// Gather the information:
		// Stats from Website, which we already have
		// List of all rules and their usages

		return website
		.getPages(
			{
				attributes: ['id', 'url'],
				where: {
					visited: true
				}
			}, {
				raw: true
			}
		)
		.then(function (pages) {

			return getUsageWebsite(websiteId)
			.then(function (usages) {
				return calc(usages, pages, website);
			});
		});
	});
}

function getDataSheet(websiteId, stylesheetId) {
	// Verify if the selected website has been crawled

	return getWebsite(websiteId)
	.then(function (website) {
		// Gather the information:
		// Stats from Website, which we already have
		// List of all rules and their usages

		return website
		.getPages(
			{
				attributes: ['id', 'url'],
				where: {
					visited: true
				}
			}, {
				raw: true
			}
		)
		.then(function (pages) {

			return getUsageStylesheet(stylesheetId)
			.then(function (usages) {
				return calc(usages, pages, website);
			});
		});
	});
}

function calc(usages, pages, website) {
				
	var used = {};
	var unused = {};

	usages = _.groupBy(usages, 'selector');
	usages = _.mapObject(usages, function (val, key) {
		val = _.pluck(val, 'url');
		val = (val[0] == null) ? [] : val;
					
		if (val.length === 0) {
			unused[key] = val;
		} else {
			used[key] = val;
		}
			
		return val;
	});
				
	var total = Object.keys(unused).length + Object.keys(used).length;

	return {
		website: website.url,
		websiteId: website.id,
		total: total,
		used:  Object.keys(used).length,
		obsolete:  Object.keys(unused).length,
		percentage: (total === 0 ? 0 :  Object.keys(used).length / total * 100).toFixed(3),
		urls: pages,
		rules: usages
	};
}

function getWebsite(websiteId) {
	return Website
	.find({
		where: {
			id: websiteId
		}
	})
	.then(function (website) {
		if (!website) {
			throw Boom.notFound('The website with an id of "' + websiteId + '" was not found.');
		}
		
		return website;
	});
}

function getStylesheets(websiteId) {
	return Stylesheet
	.findAll({
		raw: true,
		where: {
			WebsiteId: websiteId
		}
	});
}

function getSites() {

	return Website
	.findAll()
	.then(function (websites) {
		return websites.map(function (website) {
			return {
				id: website.id,
				url: website.url
			}
		});
	});
}

exports.stylesheet = {
	validate: {
		params: {
			websiteId: Joi.number().integer(),
			stylesheetId: Joi.number().integer()
		}
	},
	handler: function (request, reply) {
		getDataSheet(request.params.websiteId, request.params.stylesheetId)
		.then(function (data) {
			data.title = data.website + ' - Overview';

			return reply.view('overview', data);
		})
		.catch(function (err) {
			return reply(err)
		});
	}
}

exports.index = {
	handler: function (request, reply) {

		getSites()
		.then(function (websites) {
			return reply.view('index', { folders: websites, title: 'Overview of crawled websites' });
		});
	}
}

exports.webpage = {
	validate: {
		params: {
			websiteId: Joi.number().integer()
		}
	},
	handler: function (request, reply) {

		Promise
		.all([
			getData(request.params.websiteId), 
			getStylesheets(request.params.websiteId)])		
		.then(function (values) {
			
			var data = values[0];
			data.sheets = values[1];
			
			data.title = data.website + ' - Overview';

			return reply.view('overview', data);
		})
		.catch(function (err) {
			return reply(err)
		});
	}
}

exports.rule = {
	validate: {
		params: {
			websiteId: Joi.number().integer(),
			rule: Joi.string()
		}
	},
	handler: function(request, reply) {
		var rule = request.params.rule;
		var websiteId = request.params.websiteId;

		getData(websiteId)
		.then(function (data) {
			data.rule = rule;
			data.urls = data.rules[rule];

			delete data.rules;

			return reply.view('rule', data);
		})
		.catch(function (err) {
			return reply(err)
		});
	}
}
