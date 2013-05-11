/* Manfred!
 *
 *
 *
 */

 var app = app || {};

(function() {
	'use strict';

	var request = require("request");
	var cheerio = require("cheerio");
	var moment  = require('moment');
	var _       = require('lodash');
	var fs      = require('fs');
	var http	= require('http');
	var express = require('express');
	var server = express();

	app.config = {};
	app.config.fileDB = 'db.json';
	app.config.selector = '.wsPlaylistsEL tr.wsEven, .wsPlaylistsEL tr.wsOdd';
	app.config.url = 'http://www.einslive.de/musik/playlists/';

	var db = {};

	app.loadDB = function (filename) {
		fs.readFile(filename, function (err, data) {
		if (err) console.log(err);

		try {
			db = JSON.parse(data);
		} catch (e) {
			db.raw = [];
			console.log(e);
		}

		});
	};

	app.writeDB = function (filename, data, callback) {
		fs.writeFile(filename, JSON.stringify(data, null, 4), function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log("DB Saved!");
			}
			callback();
		}); 
	};

	app.fetch = function (callback) {
		request({
			uri: app.config.url
		}, function(error, response, body) {
			var $ = cheerio.load(body);
			var current = [];

			$(app.config.selector).each(function() {
				var day = moment().format('DD.MM.YYYY');
				var cTimestamp = $(this).children().first().text();

				// Bugfix: wenn nach 0 Uhr aber Song vor 0 Uhr, dann aufpassen!
				if (Number(moment().format('HH')) < Number(cTimestamp.substring(0,2)))
				{
					day = moment().subtract('days', 1).format('DD.MM.YYYY');
				}

				var timestamp = moment(day + ' ' + cTimestamp, ['DD.MM.YYYY HH:mm:ss', 'ddd MMM DD HH:mm:ss dddd YYYY']).unix();
				current.push({timestamp: timestamp, artist: $(this).children().eq(1).text(), track: $(this).children().eq(2).text()});
			});

			callback(current);
		});

	};

	app.countByArtist = function () {
		return _.countBy(db.raw, function (d) { return d.artist; });
	};

	app.countByTrack = function () {
		return _.countBy(db.raw, function (d) { return d.artist + '|' + d.track; });
	};


	app.main = function () {

		console.log("Fetching...");

		app.loadDB(app.config.fileDB);
		app.fetch(function (data) {
			var union = _.union(data, db.raw);
			union =  _.unique(union, function (x) { return x.timestamp; });
			db.raw = _.sortBy(union, function (x) { return x.timestamp; });


			db.stats = {};
			db.stats.byArtist = app.countByArtist();
			db.stats.byTrack  = app.countByTrack();

			console.log('Saving ' + _(db.raw).size() + ' Tracks');

			app.writeDB(app.config.fileDB, db, app.finish);
		});

	};

	app.finish = function () {
		console.log("Fetched!");
	};

	app.start = function () {

		server.get('/db.json', function (req, res) {
			res.json(db);
		})

		server.use(express.static(__dirname + '/public'));
		server.listen(process.env.PORT || 9000);
		
		console.log('Server running at http://127.0.0.1:9000/');

		// Run every 10 minutes
		app.main();
		setInterval(function () { app.main(); }, 10 * 60 * 1000);
	}

	app.start();


})();

module.exports = app;



