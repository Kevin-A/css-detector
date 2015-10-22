var Hapi = require('hapi');
var Routes = require('./routes');
var fs = require('fs-extra');
var Path = require('path');
var Mediator = require('./casper/mediator');
var Database = require('./database/database');
var Config = require('./config');

// ensure the data directory exists
fs.ensureDirSync(Config.dataFolder);

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({
	host: '0.0.0.0',
	port: 8000,
	routes: { cors: true }
});

server.views({
	engines: {
		html: require('handlebars')
	},
	relativeTo: __dirname,
	path: './templates',
	partialsPath: './templates/partials',
	helpersPath: './templates/helpers'
});

// Add the route
server.route(Routes);

server.ext('onPostAuth', function (request, reply) {
	// console.log('headers:', request.headers);
	// console.log('payload:', request.payload);
	// console.log();
	return reply.continue();
});

// Set up Socket.io
var io = require('socket.io')(server.listener);

Mediator.on('log', function (page, tag, message) {
    io.sockets.in(page).emit('log', { tag: tag, message: message });
});
Mediator.on('form', function (page, obj) {
    io.sockets.in(page).emit('form', obj);
});
Mediator.on('link', function (page, from, to) {
	io.sockets.in(page).emit('link', { from: from, to: to });
});
Mediator.on('status', function (page, data) {
	io.sockets.in(page).emit('status', data);
});

io.on('connection', function (socket) {
	socket.on('page', function (page) {
		socket.join(page);
	});
});


Database.sequelize.sync({force: Config.force || false}).then(function () {
	// Start the server
	server.start(function() {
		console.log('Started the webserver at: ', server.info.uri);
	});
});
