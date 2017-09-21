const TelegramBot = require('node-telegram-bot-api');
const osmosis = require('osmosis');
const http = require("http");

const token = '445554489:AAGOmrNRNF9-Cn8GCIL3mCh6_GQ_iccqiYI';
const selector = '#overviewQuickstatsDiv table tr:nth-child(2)';
const urlSearchFondo = 'https://www.google.es/search?q=sites:morningstar.es+caixa+fondo+';
const urlSearchValores = 'https://www.google.es/search?q=valores+liquidativos+caixa+';
const urlImgBase = 'http://chart.googleapis.com/chart?chxt=y&cht=lc&chof=.png&chs=400x300&chdls=000000&chg=0%2C10&chco=76A4FB&chts=76A4FB%2C14&chls=2&chma=35%2C15%2C0%2C20&chf=bg%2Cs%2CF9F9F9&chd=t%3A';
let urlFondo = '';
let urlValores = '';
let fechagraph = '';
let valores = [];

const bot = new TelegramBot(token, {polling: true});
let idInterval = null;
setInterval(function() {
  http.get("http://multisalud.herokuapp.com/");
}, 300000);
http.createServer(function (req, res) { 
	res.writeHead(200, {'Content-Type': 'text/plain'}); 
	res.write('Running'); 
  res.end();})
	.listen(process.env.PORT || 5000);

bot.onText(/\/stop/, (msg, match) => {
	const chatId = msg.chat.id;
	if (idInterval) {
	  clearInterval(idInterval);
	  bot.sendMessage(chatId, 'Subscripción cancelada.');
	  idInterval = null;
	 	urlFondo = null;
	}
	else {
		bot.sendMessage(chatId, 'No hay subscripción activa.');
	}
});

bot.onText(/\/search\s+(.*)/, (msg, match) => {
	const chatId = msg.chat.id;
	if (idInterval) {
	  clearInterval(idInterval);
	  idInterval = null;
	 	urlFondo = null;
		bot.sendMessage(chatId, 'Relanzando subscripción...');
	}
	searchFondo(match[1], chatId);
});

bot.on('message', (msg) => {
	const chatId = msg.chat.id;
	if (msg.text == 'Subscribir') {
  	let nombreFondo = msg.reply_to_message.text.replace('Fondo encontrado:\n','');
	  getValorLiquidativo(chatId, nombreFondo);
	  idInterval = setInterval(() => {
	    getValorLiquidativo(chatId, nombreFondo);
	  }, 1000 * 60 * 60 * 24);
	  //}, 10000);
	  if (valores.length > 0) {
		  let urlImagen = urlImgBase;
		  valores.reverse();
		 	for (i=0; i<valores.length; i++) {
		 		urlImagen += valores[i].toString();
		 		if ((i+1) < valores.length) urlImagen += '%2C';
		 	}
		 	let maxValue = Math.round(Math.max(...valores)) + 1;
		 	let minValue = Math.round(Math.min(...valores)) - 1;
		 	urlImagen += '&chds=' + minValue + '%2C' + maxValue;
		 	urlImagen += '&chxr=0%2C' + minValue + '%2C' + maxValue;
		 	urlImagen += '&chtt=Valor%20liquidativo%20a%20' + fechagraph;
		 	console.log(urlImagen);
		 	bot.sendPhoto(chatId, urlImagen);
		}
		else {
			bot.sendMessage(chatId, 'No se ha encontrado información de valores liquidativos.');
		}
	}
});

var getValorLiquidativo = function(chatId, nombreFondo) {
	osmosis
	  .get(urlFondo)
	  .find(selector)
	  .set('valor', 'td.line.text')
	  .set('fecha', 'td.line.heading .heading')
	  .data(function(data) {
	  	console.log(data);
	  	data.valor = data.valor.replace('EUR','') + ' €';
	    bot.sendMessage(chatId, nombreFondo + '\nValor liquidativo:<b>' + data.valor + '</b>\nA fecha: <b>' + data.fecha + '</b>', {
	    	"parse_mode": "HTML"
	    });	
	  })
	  .log(console.log)
	  .error(console.log)
	  .debug(console.log)
}

var searchFondo = function(fondo, chatId) {
	osmosis
	  .get(urlSearchFondo + fondo) 
    .find('.g:first .r a')
    .set({
    	'link': '@href'
    })
    .follow('@href')
    .set({
      'title': 'title'
    })
    .data(function(data) {
    	console.log(data);
    	urlFondo = data.link;
	   	bot.sendMessage(chatId, 'Fondo encontrado:\n' + data.title, {
				"reply_markup": {
			    "keyboard": [["Subscribir", "Cancelar"]],
        	"resize_keyboard": true,
        	"one_time_keyboard": true
			  }
			});
	  })
	  .log(console.log)
	  .error(console.log)
	  .debug(console.log);
	valores = [];
	urlValores = '';
  fechagraph = '';
  console.log(urlSearchValores + fondo);
	osmosis
	  .get(urlSearchValores + fondo) 
    .find('.g:first .r a')
    .set({
    	'link': '@href'
    })
    .follow('@href')
    .find('.contentBodyGrid li.valor')
    .set({'valor': 'span'})
	  .find('.contentBodyGrid li.fechavalor:first')
    .set({'fecha': 'span'})
    .data(function(data) {
    	console.log(data);
    	if(!urlValores) urlValores = data.link;
    	if(!fechagraph) fechagraph = data.fecha;
    	valores.push(parseFloat(data.valor.replace(' euros', '').replace(',','.')).toFixed(3));
	  })
	  .log(console.log)
	  .error(console.log)
	  .debug(console.log);
}
