var Database = require('../database/database');
var Website = Database.Website;
var Page = Database.Page;
var Joi = require('joi');
var Boom = require('boom');

exports.create = {
	validate: {
		params: {
			websiteId: Joi.number().integer()
		},
		payload: {
			url: Joi.array().items(Joi.string())
		}
	},
	handler: function (request, reply) {
		var websiteId = request.params.websiteId;
		var urls = request.payload.url || [];

		Website.find({
			where: { id: websiteId }
		}).then(function (website) {

			if (!website) {
				return reply(Boom.notFound('There is no record of a website with an id of "' + websiteId + '".'));
			}

			urls = urls.map(function (url) {
				return {
					url: url,
					WebsiteId: website.id
				};
			});

			Page.bulkCreate(urls).then(function () {

				Page.findAll({
					where: {
						WebsiteId: website.id
					},
					order: 'id DESC',
					limit: urls.length,
					attributes: ['id', 'url']
				}).then(function (pages) {
					return reply(pages);
				}).catch(function (err) {
					return reply(err);
				});

			}).catch(function (err) {
				return reply(err);
			});
		});
	}
}

exports.visit = {
	validate: {
		params: {
			websiteId: Joi.number().integer(),
			pageId: Joi.number().integer()
		}
	},
	handler: function (request, reply) {
		Page.update(
			{
				visited: true
			},
			{
				where: { id: request.params.pageId }
			}
		).then(function (affectedPages) {
			return reply();
		}).catch(function (err) {
			return reply(err);
		});
	}
}
