$(function()
{
	$('a.thumbnail').each(function()
	{
		var a = $(this);
		var href = a.attr('href');
		var video_id = href.match(/https?:\/\/(www|m).youtube.com\/watch\?v=([^\s]+)/)[2];

		$.ajax({
			url: 'https://gdata.youtube.com/feeds/api/videos/' + video_id,
			data: { alt: 'json' },
			dataType: 'json'
		}).then(function(json)
		{
			var title = json.entry.title.$t;
			a.attr('title', title);
			a.find('.title').text(title);
		})
	});
})