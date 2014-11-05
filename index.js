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
		var body = $('#cuerpoMensaje').text();
		var matches = body.match(/(https?:\/\/www.youtube.com\/watch\?v=[^\s]+)/g);		

		if( matches )
		{
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
	var header = "<!DOCTYPE html>";
	header += "<html><meta charset='UTF-8'><body>";
	console.log(header);
}

function renderPageFooter()
{
	var footer = "</body></html>";
	console.log(footer);
}

function renderTitle(title, date)
{
	var header = "<h1>" + title + " <small>" + date + "</small></h1>";
	console.log(header);
}

function renderLink(href)
{
	var link = "<a href='" + href + "' target='_blank'>" + href + "</a><br>";
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
		headers['X-AjaxPro-Method'] = 'listaMensajes';
		var payload = '{"sControls":"<root><carpeta>1</carpeta><filtro></filtro><noLeidos>false</noLeidos><pagina>0</pagina><orden>fecha</orden><sentido>DESC</sentido></root>"}';

		scrap({url: messagesUrl, preParse:preParseValue, method: 'POST', jar:cookieJar, headers:headers, body:payload}, function(err,$,code,html,resp)
		{
			renderPageHeader();

			var elements = $("tr td[onclick]");
			var links = [];
			var remaining = 0;
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

