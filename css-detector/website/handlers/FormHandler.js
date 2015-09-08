var Database = require('../database/database');
var Page = Database.Page;
var Website = Database.Website;
var Form = Database.Form;
var FormField = Database.FormField;
var Joi = require('joi');
var Boom = require('boom');
var Mediator = require('../casper/mediator');

exports.create = {
	validate: {
		params: {
			websiteId: Joi.number().integer()
		},
		payload: {
			pageId: Joi.number().integer(),
			src: Joi.string().required(),
			url: Joi.string().required(),
			html: Joi.string().required(),
			selector: Joi.string().required()
		}
	},
	handler: function (request, reply) {
		var pageId = request.payload.pageId;
		var websiteId = request.params.websiteId;

		Page.find({
			where: { id: pageId }
		}).then(function (page) {

			if (!page) {
				return reply(Boom.notFound('There is no record of a page with an id of "' + pageId + '".'));
			}

			request.payload.WebsiteId = websiteId;
			request.payload.PageId = pageId;

			Form
			.create(request.payload)
			.then(function (form) {

				request.payload.url = "/websites/" + websiteId + "/pages/" + pageId + "/forms/" + form.id;
				Mediator.emit('form', websiteId, request.payload);

				return reply(form);
			});
		});
	}
};


exports.fill = {
	validate: {
		params: {
			websiteId: Joi.number().integer(),
			pageId: Joi.number().integer(),
			formId: Joi.number().integer()
		}
	},
	handler: function (request, reply) {
		delete request.payload.selector;

		Form.update(
			{
				filledIn: true,
				values: JSON.stringify(request.payload)
			},
			{
				where: {
					id: request.params.formId
				}
			})
		.then(function () {
			// TODO: update values

			return reply.redirect('/status/' + request.params.websiteId);
		});
	}
};

exports.submit = {
	validate: {
		params: {
			formId: Joi.number().integer()
		}
	},
	handler: function (request, reply) {
		Form.update(
			{
				submitted: true
			},
			{
				where: {
					id: request.params.formId
				}
			})
		.then(function () {
			return reply();
		});
	}
};

exports.getForms = {
	validate: {
		params: {
			websiteId: Joi.number().integer()
		},
		query: {
			filled: Joi.boolean(),
			submitted: Joi.boolean()
		}
	},
	handler: function (request, reply) {
		var filled = request.query.filled;
		var submitted = request.query.submitted;
		var websiteId = request.params.websiteId;

		var conditions = {};

		if (filled !== undefined) {
			conditions.filledIn = filled;
		}

		if (submitted !== undefined) {
			conditions.submitted = submitted;
		}

		Form
		.findAll({
			where: conditions
			// {
			// 	// WebsiteId: websiteId,
			// 	filledIn: filled,
			// 	submitted: submitted
			// }
		})
		.then(function (forms) {
			return reply(forms);
		});
	}
}

exports.backup = {
	validate: {
		params: {
			websiteId: Joi.number().integer(),
			pageId: Joi.number().integer()
		},
		payload: {
			selector: Joi.string().required(),
			idAttribute: Joi.string(),
			nameAttribute: Joi.string(),
			inputFields: Joi.array().items(Joi.object().keys({
				type: Joi.string().required(),
				selector: Joi.string().required(),
				idAttribute: Joi.string(),
				nameAttribute: Joi.string()
			}))
		}
	},
	handler: function (request, reply) {
		var websiteId = request.params.websiteId;
		var pageId = request.params.pageId;
		var inputFields = request.payload.inputFields || []

		Page.find({
			where: { id: pageId }
		}).then(function (page) {

			if (!page) {
				return reply(Boom.notFound('There is no record of a page with an id of "' + pageId + '".'));
			}

			Form.create({
				selector: request.payload.selector,
				idAttribute: request.payload.idAttribute,
				nameAttribute: request.payload.nameAttribute
			}).then(function (form) {

				form.setPage(page).then(function () {

					// Create and then retrieve all formFields
					// Cannot do this in a single call, due to limitations of Sequelize
					FormField.bulkCreate(inputFields).then(function () {

						FormField.findAll({
							where: {
								FormId: form.id
							}
						}).then(function (formFields) {

							form.dataValues.formFields = formFields.map(function (formfield) {
								return {
									id: formfield.id,
									selector: formfield.selector,
									idAttribute: formfield.idAttribute,
									nameAttribute: formfield.nameAttribute
								};
							});

							return reply(form).code(201).header('Location', '/websites/' + websiteId + '/pages/' + page.id + '/forms/' + form.id);
						});
					}).
					catch(function (err) {
						return reply(err);
					});

				}).catch(function (err) {
					// console.log(err);
					return reply(err);
				});

			}).catch(function (err) {
				delete err.errors;
				// console.log('[ERR] stylesheet.create: ', err);
				return reply(Boom.badRequest(err.message));
			});
		});
	}
}
