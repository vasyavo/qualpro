define([
		'views/domain/thumbnails',
		'models/country'
	],

	function (MainThumbnails, Model) {
		var View = MainThumbnails.extend({
			contentType: 'country',
			childContent: 'region'
		});

		return View;
	});

