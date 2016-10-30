define([
		'views/domain/thumbnails'
	],

	function (MainThumbnails) {
		var View = MainThumbnails.extend({
			contentType: 'region',
			childContent: 'subRegion',

		});

		return View;
	});
