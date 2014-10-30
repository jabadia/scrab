"use strict";

var scrap = require('scrap'),
	request = require('request');

// request.debug = true;

var loginUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/educamos/Login.aspx';
var defaultUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/default.aspx';
var mensajesUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/ajaxpro/educamos_mensajeria,webEducamos.ashx';
var cookieJar = request.jar();

function preParseValue(body,cb)
{
	var html = JSON.parse(body).value;
	cb(html);
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
		// console.log(response.statusCode);
		// console.log(body);

		// ?idMensajesLeidos=1

		headers['X-AjaxPro-Method'] = 'listaMensajes';
		var payload = '{"sControls":"<root><carpeta>1</carpeta><filtro></filtro><noLeidos>false</noLeidos><pagina>0</pagina><orden>fecha</orden><sentido>DESC</sentido></root>"}';

		console.log("+");
		scrap({url: mensajesUrl, preParse:preParseValue, method: 'POST', jar:cookieJar, headers:headers, body:payload}, function(err,$,code,html,resp)
		{
			// console.log(err);
			// console.log( $('#tbListaMensajes').text() );
			// console.log(html);

			// $("td[onclick]").each(function (i, el)
			// {
			// 	console.log($(el).text(), $(el).attr('onclick'));
			// });

			// console.log("------------");
			// console.log(err);
			// console.log("------------");
			// console.log(resp);
			// console.log("------------");
			// console.log(body);
			// console.log("------------");

			var elements = $("td[onclick]");
			elements.each(function()
			{		
				var el = this;
				console.log($(el).text(), "|", $(el).attr('onclick').trim());
			});
			console.log("-");
		});
	});
});

