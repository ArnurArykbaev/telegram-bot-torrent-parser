const express = require("express");
const expressApp = express();
const path = require("path");
const scrape = require('./components/scrape');
const getFile = require('./components/getFile');

expressApp.use(express.static("static"));
expressApp.use(express.json());
require("dotenv").config();

/* require scenes, session */
const { Telegraf, Composer, Scenes, session, Markup } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);

expressApp.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

bot.command("start", (ctx) => {
  console.log(ctx.from);
  bot.telegram.sendMessage(ctx.chat.id, "Приветствую, тут можно получить ссылку на скачивание торрент файлов", {});
});

bot.command("info", async (ctx) => {
  let result = await getOpenGraphMeta().then((res) => {
    return res;
  });
  console.log(result);
  ctx.reply("" + result.title + "\n" + result.description, {});
});
bot.command("tracker", async (ctx) => {
  console.log(ctx.from);
  const trackerMessage = `Выберите трекер, который хотите скачать`;
  ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, trackerMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "utorrent182",
            callback_data: "utorrent182",
          },
          {
            text: "BitTorrent612",
            callback_data: "BitTorrent612",
          },
        ],
      ],
    },
  });
});

bot.action("utorrent182", async (ctx) => {
  await bot.telegram.sendDocument(ctx.chat.id, {
    source: "./assets/files/utorrent182.exe",
  });
});
bot.action("BitTorrent612", async (ctx) => {
  await bot.telegram.sendDocument(ctx.chat.id, {
    source: "./assets/files/BitTorrent612.exe",
  });
});

const createButtons = (data) => {
  const buttons = Markup.inlineKeyboard(data.map((button, id) => Markup.button.callback(button, id)), {columns: 1})
  return buttons
}

let firstSearch
let torrentId

/* SCENES func */
const startWizard = new Composer();
startWizard.on("text", async (ctx) => {
  const trackerMessage = `Введите наименование файла, который хотите скачать`;
  await ctx.reply(trackerMessage);
  return ctx.wizard.next();
});

const searchTorrent = new Composer();
searchTorrent.on("text", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply(
    `Начал искать файл с названием ${Object.values(ctx.message)[4]}...`
  );
  firstSearch = ctx.message.text
  let res = await scrape.scrape(ctx.message.text)

  if(typeof res === 'string') {
    await ctx.reply('' + res + '! Попробуйте другой запрос');
  } else {  
    const arrayRes = await scrape.sliceLongTitles(res)
    await ctx.reply('Выберите файл из списка', createButtons(arrayRes));
  }

  return ctx.wizard.next();
});

const searchTorrentAction = new Composer();
searchTorrentAction.action(/.+/, async (ctx) => {
  await ctx.deleteMessage();
  const torrentIndex = await getFile.getFile(firstSearch, ctx.match.input, torrentId)
  const fileName = await getFile.findFile(torrentIndex)
  await ctx.replyWithDocument({ source: `./torrents/${fileName}` });
  return ctx.scene.leave();
});

/* Scenes declare */
const menuScene = new Scenes.WizardScene(
  "sceneWizard",
  searchTorrent,
  searchTorrentAction,
);
const stage = new Scenes.Stage([menuScene]);

/* middleware to scenes */
bot.use(session());
bot.use(stage.middleware());

bot.on("text", (ctx) => ctx.scene.enter("sceneWizard"));

bot.launch();
