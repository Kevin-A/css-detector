var Database = require('../database/database');
var Page = Database.Page;
var Joi = require('joi');
var Boom = require('boom');
var _ = require('underscore');
var Mediator = require('../casper/mediator');
var URL = require('url-parse');

exports.create = {
	validate: {
		payload: {
			from: Joi.string().required(),
			to: Joi.array().items(Joi.string())
		}
	},
	handler: function (request, reply) {
		var fromUrl = request.payload.from;
		var toUrls = request.payload.to || [];

		var errors = [];

		// Retrieve the from page
		Page.find({
			where: { url: fromUrl },
			order: 'id DESC'
		}).then(function (from) {

			if (!from) {
				return reply(Boom.notFound('There is no record of a page with the url "' + fromUrl + '".'));
			}

			// Find all to pages
			Page.findAll({
				where: {
					url: {
						in: toUrls
					}
				},
				order: 'id DESC'
			}).then(function (toUrlsDB) {

				var diff = _.difference(toUrls,
					_.pluck(toUrlsDB, 'url'));

				// Check for errors
				for (var i = diff.length - 1; i >= 0; i--) {
					errors.push(Boom.notFound('There is no record of a page with the url "' + diff[i] + '".'));
				}

				if (errors.length > 0) {
					return reply(errors);
				}

				// Finally create the association
				from.setLinks(toUrlsDB);

				toUrls.forEach(function (url) {
					Mediator.emit('link', from.WebsiteId, fromUrl, url);
				});

				from.save().then(function () {
					return reply();
				}).
				catch (function (err) {
					return reply(err);
				});
			});
		});
	}
}
