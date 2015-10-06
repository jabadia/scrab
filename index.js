"use strict";

var scrap = require('scrap'),
	iconv = require('iconv-lite'),
	async = require('async'),
	secret = require('./secret'),
	request = require('request');

// request.debug = true;

var loginUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/educamos/Login.aspx';
var defaultUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/default.aspx';
var messagesUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/ajaxpro/educamos_mensajeria,webEducamos.ashx';
var oneMessageUrl = 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/comunicaciones/';
var cookieJar = request.jar();

var headers = { 
	'Referer': 'https://sfjcabrini-mscj-madrid.micolegio.es/Educamos/login.aspx',
	'Origin': 'https://sfjcabrini-mscj-madrid.micolegio.es',
	'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36'
};

iconv.extendNodeEncodings();

function preParseValue(body,cb)
{
	var html = JSON.parse(body).value;
	cb(html);
}

function getMessage(msg, callback)
{
	var url = msg.url;
	var date =msg.date;
	var output = [];

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

			output.push( renderTitle(asunto, date) );
			output.push( "<div>" );
			matches.forEach(function(m)
			{
				output.push( renderLink(m) );
			})			
			output.push( "</div>" );
		}
		callback(null, output.join('\n'));
	});
}

function getPageMessages(pagina, callback)
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

				links.push({ url: oneMessageUrl + url, date: date });
			}
		});
		callback(null,links);
	});	
}

/* output rendering */

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
	footer.push("<script src='//code.jquery.com/jquery-1.11.0.min.js'></script>");
	footer.push("<script src='links.js'></script>");
	footer.push("</body></html>");
	console.log(footer.join('\n'));
}

function renderTitle(title, date)
{
	var header = "<h3>" + title + " <small>" + date + "</small></h3>";
	return header;
}

function renderLink(href)
{
	//var link = "<a href='" + href + "' target='_blank'>" + href + "</a><br>";
	var video_id = href.match(/https?:\/\/www.youtube.com\/watch\?v=([^\s]+)/)[1];
	var link = [];
	href = 'http://m.youtube.com/watch?v=' + video_id;
	link.push("<a class='thumbnail' href='" + href + "' target='_blank'>");
	link.push("<img src='http://img.youtube.com/vi/" + video_id + "/default.jpg' />");
	link.push("<span class='title'></span>");
	link.push("</a>");
	return link.join('\n');
}


/* main script */

scrap({url:loginUrl, jar:cookieJar}, function(err,$)
{
	var form = {};

	$('[type=hidden]').each(function(i,el)
	{
		var key = $(el).attr('name');
		var val = $(el).attr('value');

		form[key] = val;
	});

	form.txtUserName = secret.name;
	form.txtUserPass = secret.pwd;
	form.__EVENTTARGET = 'cmdLogin';
	form.__EVENTARGUMENT = undefined;

	request.post({url:loginUrl, jar:cookieJar, form: form, headers:headers, followAllRedirects:true}, function(err,response,body)
	{
		renderPageHeader();

		var paginas = [1,2];

		async.map(paginas, getPageMessages, function(err,messages)
		{
			// flatten array and filter
			messages = [].concat.apply([],messages).filter(function(m)
			{
				var components = m.date.split(' ');
				var c1 = components[0].split('/');
				var c2 = components[1].split(':');
				var date = new Date( c1[2], c1[1]-1, c1[0], c2[0], c2[1])
				return date >= new Date(2015,8,1) // 01/Sep/2015
			});			
			
			async.map(messages, getMessage, function(err,outputs)
			{
				//console.log(outputs.length);

				outputs.forEach(function(output)
				{ 
					if(output.length) 
						console.log(output); 
				});

				renderPageFooter();
			})
		});
	});
});

