const TelegramBot = require('node-telegram-bot-api');
const osmosis = require('osmosis');

const token = '445554489:AAGOmrNRNF9-Cn8GCIL3mCh6_GQ_iccqiYI';
const urlFondo = 'http://www.morningstar.es/es/funds/snapshot/snapshot.aspx?id=F0GBR04QAD';
const selector = '#overviewQuickstatsDiv table tr:nth-child(2) td.line.text';

const bot = new TelegramBot(token, {polling: true});
let idInterval = null;

bot.onText(/\/multisalud/, (msg, match) => {
  const chatId = msg.chat.id;
  //const resp = match[1];
  getValorLiquidativo(chatId);
  idInterval = setInterval(() => {
    getValorLiquidativo(chatId);
  //}, 10000);
  }, 1000 * 60 * 60 * 24);
});

bot.onText(/\/stop/, (msg, match) => {
  clearInterval(idInterval);
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Proceso parado');
});

var getValorLiquidativo = function(chatId) {
	osmosis
	  .get(urlFondo)
	  .find(selector)
	  .set('valor')
	  .data(function(data) {
	    console.log(data);
	    bot.sendMessage(chatId, 'Valor liquidativo: ' + data.valor);
	  })
	  .log(console.log)
	  .error(console.log)
	  .debug(console.log)
}




