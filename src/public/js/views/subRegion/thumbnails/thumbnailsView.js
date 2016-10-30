define([
		'views/domain/thumbnails'
	],

	function (MainThumbnails) {
		var View = MainThumbnails.extend({
			contentType: 'subRegion',
			childContent: 'retailSegment'
		});

		return View;
	});

