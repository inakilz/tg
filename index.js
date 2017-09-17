const TelegramBot = require('node-telegram-bot-api');
const osmosis = require('osmosis');
const http = require("http");

const token = '445554489:AAGOmrNRNF9-Cn8GCIL3mCh6_GQ_iccqiYI';
const selector = '#overviewQuickstatsDiv table tr:nth-child(2) td.line.text';
const urlSearch = 'https://www.google.es/search?q=sites:morningstar.es+fondo+';
let urlFondo = '';

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
	  bot.sendMessage(chatId, 'Proceso parado');
	  idInterval = null;
	 	urlFondo = null;
	}
	else {
		bot.sendMessage(chatId, 'Proceso ya parado');
	}
});

bot.onText(/\/search\s+(.*)/, (msg, match) => {
	const chatId = msg.chat.id;
	searchFondo(match[1], chatId);
});

bot.on('message', (msg) => {
	const chatId = msg.chat.id;
	if (msg.text == 'Aceptar') {
	  if (!idInterval) {
	  	let nombreFondo = msg.reply_to_message.text.replace('Fondo encontrado:\n','');
		  getValorLiquidativo(chatId, nombreFondo);
		  idInterval = setInterval(() => {
		    getValorLiquidativo(chatId, nombreFondo);
		  }, 1000 * 60 * 60 * 24);
		  //}, 10000);
		}
		else {
			bot.sendMessage(chatId, 'Proceso ya lanzado');
		}
	}
});

var getValorLiquidativo = function(chatId, nombreFondo) {
	osmosis
	  .get(urlFondo)
	  .find(selector)
	  .set('valor')
	  .data(function(data) {
	  	console.log(data);
	    bot.sendMessage(chatId, nombreFondo + '\nValor liquidativo: ' + data.valor);	
	  })
	  .log(console.log)
	  .error(console.log)
	  .debug(console.log)
}

var searchFondo = function(fondo, chatId) {
	osmosis
	  .get(urlSearch + fondo) 
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
			    "keyboard": [["Aceptar", "Cancelar"]],
			  }
			});
	  })
	  .log(console.log)
	  .error(console.log)
	  .debug(console.log)
}



