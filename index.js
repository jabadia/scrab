"use strict";

var scrap = require('scrap'),
	iconv = require('iconv-lite'),
	request = require('request');

// request.debug = true;

var loginUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/educamos/Login.aspx';
var defaultUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/default.aspx';
var messagesUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/ajaxpro/educamos_mensajeria,webEducamos.ashx';
var oneMessageUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/comunicaciones/';
var cookieJar = request.jar();

iconv.extendNodeEncodings();

function preParseValue(body,cb)
{
	var html = JSON.parse(body).value;
	cb(html);
}

function getMessage(url, date, cb)
{
	scrap({url: url, method: 'POST', jar:cookieJar, encoding:'iso-8859-1'}, function(err,$,code,html,resp)
	{
		var asunto = "";
		$('.legendFicha').each(function(index)
		{
			if(this.text().match(/Asunto:/))
			asunto = this.next(false).text().trim();
		})
		var body = $('#cuerpoMensaje').html();
		var matches = body.match(/(https?:\/\/www.youtube.com\/watch\?v=[^\s|\^"<]+)/g);

		if( matches )
		{
			// make them unique
			matches = matches.filter(function(item, pos) {
	    		return matches.indexOf(item) == pos;
			});

			renderTitle(asunto, date);
			matches.forEach(function(m)
			{
				renderLink(m);
			})			
		}
		cb('done');
	});
}

function renderPageHeader()
{
	var header = [];
	header.push("<!DOCTYPE html>");
	header.push("<html><meta charset='UTF-8'><body>");
	header.push("<link rel='stylesheet' href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.0/css/bootstrap.min.css'>");
	header.push("<link rel='stylesheet' href='style.css'>");
	header.push("<body>");
	header.push("<div class='container'>");
	header.push("<div class='row'>");
	header.push("<div class='col-md-8 col-md-offset-2'>");

	console.log(header.join('\n'));
}

function renderPageFooter()
{
	var footer = [];
	footer.push("</div>"); // col-md-
	footer.push("</div>"); // row
	footer.push("</div>");	// container
	footer.push("</body></html>");
	console.log(footer.join('\n'));
}

function renderTitle(title, date)
{
	var header = "<h3>" + title + " <small>" + date + "</small></h3>";
	console.log(header);
}

function renderLink(href)
{
	//var link = "<a href='" + href + "' target='_blank'>" + href + "</a><br>";
	var video_id = href.match(/https?:\/\/www.youtube.com\/watch\?v=([^\s]+)/)[1];
	var link = "<a href='" + href + "' target='_blank'>" + "<img src='http://img.youtube.com/vi/" + video_id + "/default.jpg' />" + "</a>";
	console.log(link);
}

scrap({url:loginUrl, jar:cookieJar}, function(err,$)
{
	var form = {};

	$('[type=hidden]').each(function(i,el)
	{
		var key = $(el).attr('name');
		var val = $(el).attr('value');

		form[key] = val;
	});

	form.txtUserName = '';
	form.txtUserPass = '';
	form.__EVENTTARGET = 'cmdLogin';
	form.__EVENTARGUMENT = undefined;

	var headers = { 
		'Referer': 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/login.aspx',
		'Origin': 'https://sfjcabrini-mscj-madrid.micolegio.es',
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36'
	};

	request.post({url:loginUrl, jar:cookieJar, form: form, headers:headers, followAllRedirects:true}, function(err,response,body)
	{

		renderPageHeader();
		var remaining = 0;

		var paginas = [1,2];

		paginas.forEach(function(pagina)
		{
			headers['X-AjaxPro-Method'] = 'listaMensajes';
			var payload = '{"sControls":"<root><carpeta>1</carpeta><filtro></filtro><noLeidos>false</noLeidos><pagina>' + pagina + '</pagina><orden>fecha</orden><sentido>DESC</sentido></root>"}';

			scrap({url: messagesUrl, preParse:preParseValue, method: 'POST', jar:cookieJar, headers:headers, body:payload }, function(err,$,code,html,resp)
			{
				var elements = $("tr td[onclick]");
				var links = [];
				elements.each(function(index)
				{	
					if(index % 3 == 2)
					{
						var el = this;
						var onclick = $(el).attr('onclick').trim();
						var url = onclick.match(/location.href='(.+)'/)[1];
						var date = $(el).text();

						remaining += 1;
						getMessage( oneMessageUrl + url, date, function(done)
						{
							remaining -= 1;

							if( remaining == 0)
								renderPageFooter();
						});
					}
				});
			});
		});
	});
});

