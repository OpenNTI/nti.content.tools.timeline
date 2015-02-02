'use strict';

var assign = require('object-assign');

function getGVar(v) {
	return (v && v.$t) || '';
}

module.exports.buildDataFromList = buildDataFromList;
module.exports.buildDataFromCells = buildDataFromCells;


function buildDataFromList(input) {
	var dd, ddType,
		data = {
			timeline: {
				type: 'default',
				headline: '',
				description: '',
				asset: {
					media: '',
					credit: '',
					caption: ''
				},
				date: [],
				era:[]
			}
		};


	if (typeof input.feed.entry === 'undefined') {
		console.error('Error parsing spreadsheet. Make sure you have no blank rows and that the headers have not been changed.');
		return null;
	}


	for(var i = 0; i < input.feed.entry.length; i++) {
		dd = input.feed.entry[i];
		ddType = '';

		if (typeof dd.gsx$startdate === 'undefined') {
			throw new TypeError('Missing start date. Make sure the headers of your Google Spreadsheet have not been changed.');
		}

		if (typeof dd.gsx$type !== 'undefined') {
			ddType = getGVar(dd.gsx$type);
		} else if (typeof dd.gsx$titleslide !== 'undefined') {
			ddType = getGVar(dd.gsx$titleslide);
		}

		if (ddType.match('start') || ddType.match('title') ) {
			assign(data.timeline, {
				startDate: getGVar(dd.gsx$startdate),
				headline: getGVar(dd.gsx$headline),
				asset: {
					media: getGVar(dd.gsx$media),
					caption: getGVar(dd.gsx$mediacaption),
					credit: getGVar(dd.gsx$mediacredit)
				},
				text: getGVar(dd.gsx$text),
				type: 'google spreadsheet'
			});
		}
		else if (ddType.match('era')) {
			data.timeline.era.push({
				startDate: getGVar(dd.gsx$startdate),
				endDate: getGVar(dd.gsx$enddate),
				headline: getGVar(dd.gsx$headline),
				text: getGVar(dd.gsx$text),
				tag: getGVar(dd.gsx$tag)
			});
		}
		else {
			data.timeline.date.push({
				type: 'google spreadsheet',
				startDate: getGVar(dd.gsx$startdate),
				endDate: getGVar(dd.gsx$enddate),
				headline: getGVar(dd.gsx$headline),
				text: getGVar(dd.gsx$text),
				tag: getGVar(dd.gsx$tag),
				asset: {
					media: getGVar(dd.gsx$media),
					credit: getGVar(dd.gsx$mediacredit),
					caption: getGVar(dd.gsx$mediacaption),
					thumbnail: getGVar(dd.gsx$mediathumbnail)
				}
			});
		}
	}

	return data;
}


function buildDataFromCells(input) {
	var data = {
			timeline: {
				headline: '',
				type: 'default',
				description: '',
				asset: {
					media: '',
					credit: '',
					caption: ''
				},
				date: [],
				era:[]
			}
		},
		date, dd, columnName, cell,
		cellnames = ['timeline'],
		list = [],
		maxRows = 0,
		i = 0;


	if (!input.feed.entry) {
		return null;
	}

	console.log('Parsing Google Doc Data (cells)');

	// DETERMINE NUMBER OF ROWS
	for(i = 0; i < input.feed.entry.length; i++) {
		var dd = input.feed.entry[i];

		if (parseInt(dd.gs$cell.row, 10) > maxRows) {
			maxRows = parseInt(dd.gs$cell.row);
		}
	}

	// CREATE OBJECT FOR EACH ROW
	for(i = 0; i < maxRows + 1; i++) {
		var date = {
			type:			'',
			startDate:		'',
			endDate:		'',
			headline:		'',
			text:			'',
			tag:			'',
			asset: {
				media:		'',
				credit:		'',
				caption:	'',
				thumbnail:	''
			}
		};
		list.push(date);
	}

	// PREP GOOGLE DOC CELL DATA TO EVALUATE
	for(i = 0; i < input.feed.entry.length; i++) {
		dd = input.feed.entry[i];
		columnName = '';
		cell = {
			content: getGVar(dd.gs$cell),
			col: dd.gs$cell.col,
			row: dd.gs$cell.row,
			name: ''
		};


		if (cell.row === 1) {
			switch(cell.content) {
				case 'Start Date':
					columnName = 'startDate'; break;
				case 'End Date':
					columnName = 'endDate'; break;
				case 'Headline':
					columnName = 'headline'; break;
				case 'Text':
					columnName = 'text'; break;
				case 'Media':
					columnName = 'media'; break;
				case 'Media Credit':
					columnName = 'credit'; break;
				case 'Media Caption':
					columnName = 'caption'; break;
				case 'Media Thumbnail':
					columnName = 'thumbnail'; break;
				case 'Type':
					columnName = 'type'; break;
				case 'Tag':
					columnName = 'tag'; break;
			}

			cellnames.push(columnName);

		} else {
			cell.name = cellnames[cell.col];
			list[cell.row][cell.name] = cell.content;
		}

	}


	for(i = 0; i < list.length; i++) {
		date = list[i];
		if (date.type.match('start') || date.type.match('title') ) {

			assign(data.timeline, {
				startDate:		date.startDate,
				headline:		date.headline,
				asset: {
					media:		date.media,
					caption:	date.caption,
					credit:		date.credit
				},
				text:			date.text,
				type:			'google spreadsheet'
			});

		} else if (date.type.match('era')) {
			data.timeline.era.push({
				startDate:	date.startDate,
				endDate:	date.endDate,
				headline:	date.headline,
				text:		date.text,
				tag:		date.tag
			});
		} else {
			if (date.startDate) {
				data.timeline.date.push({
					type:			'google spreadsheet',
					startDate:		date.startDate,
					endDate:		date.endDate,
					headline:		date.headline,
					text:			date.text,
					tag:			date.tag,
					asset: {
						media:		date.media,
						credit:		date.credit,
						caption:	date.caption,
						thumbnail:	date.thumbnail
					}
				});

			}
			else {
				console.warn('Skipping item ' + i + ' in list: no start date.');
			}
		}

	}

	return data.timeline.date.length > 0 ? data : null;
}
