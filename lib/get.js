'use strict';

var request = require('request');
var Promise = global.Promise || require('es6-promise').Promise;

module.exports = function(url) {
	return new Promise(function(fulfill, reject) {

		request(url, function(error, res, body) {
			try {
				body = JSON.parse(body);
			} catch (e) {}//Don't care... let it pass to the client as a string

			if (error || res.statusCode >= 300 || res.statusCode === 0) {
				if(res) {
					res.___isResponse = true;
					res.responseJSON = typeof body === 'object' ? body : null;
				}
				return reject(error || res);
			}

			fulfill(body);
		});

	});
};
