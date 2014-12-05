'use strict';

var defaultWorksheet = 'od6';
var googleFeedURLPattern = 'https://spreadsheets.google.com/feeds/{target}/{key}/{worksheet}/public/values?alt=json';
var sheetsPattern = /docs\.google\.com\/.*spreadsheets\/d\/([^\/]+)/;

var fs = require('fs');
var get = require('./get');
var googleDataParser = require('./buildData');
var QueryString = require('query-string');

var opt = require('optimist')
	.usage('Get TimelineJS JSON')
	.options('h', {
		alias: ['?', 'help'],
		desc: 'Usage'
	})
	.options('url', {
		demand: true,
		desc: 'Source'
	})
	.options('o', {
		alias: 'output',
		default: 'timeline.json',
		desc: 'Output'
	})
	.check(function(v) {if (v.hasOwnProperty('h')){throw false;}})
	.argv;







var input = opt.url || '';

var worksheet = QueryString.parse(input.split('?').pop()).worksheet || defaultWorksheet;
var key = input.match(sheetsPattern)[1];
var url = googleFeedURLPattern
	.replace('{target}', 'list')
	.replace('{key}', key)
	.replace('{worksheet}', worksheet);



var parse = get(url).then(function(data) {

	var d = googleDataParser.buildDataFromList(data);

	if (d === null) {
		url = googleFeedURLPattern
			.replace('{target}', 'cells')
			.replace('{key}', key)
			.replace('{worksheet}', worksheet);

		return get(url).then(function(data) {
				return googleDataParser.buildDataFromCells(data);
			});
	}

	return d;

});


parse.then(function(timelineData) {
	fs.writeFileSync(opt.output, JSON.stringify(timelineData, null, 4));
});