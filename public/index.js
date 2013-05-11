/* Manfred! Public
 *
 *
 *
 */

var manfred = manfred || {};

(function() {
	'use strict';


	manfred.config = {};
	manfred.config.showTop = 10;
	manfred.config.showCount = 1;


	manfred.fetchJSON = function () {
		$.getJSON('db.json', function (data) {
			manfred.db = data;
			console.log(data);
		});
	};

	manfred.showData = function () {
		var sorted = _.sortBy(manfred.db.raw, function (x) { return -x.timestamp });

		var str = "";
		_.each(sorted, function (x) {
			str += "<tr><td>"+x.artist+"</td><td>"+x.track+"</td><td>"+moment.unix(x.timestamp).format("DD.MM.YYYY HH:mm:ss")+"</td></tr>";
		});

		$('#results').html(str);
	}

})();

manfred.fetchJSON();