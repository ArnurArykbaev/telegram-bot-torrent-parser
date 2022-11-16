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
const { Pagination } =  require('telegraf-pagination');

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
    return ctx.scene.leave();
  } else {  
    const arrayRes = await scrape.sliceLongTitles(res)
    const pagination = new Pagination({
      data: arrayRes, // array of items
      header: (currentPage, pageSize, total) =>
        `${currentPage}-page of total ${total}`, // optional. Default value: 👇
      // `Items ${(currentPage - 1) * pageSize + 1 }-${currentPage * pageSize <= total ? currentPage * pageSize : total} of ${total}`;
      pageSize: 10, // optional. Default value: 10
      rowSize: 1, // optional. Default value: 5 (maximum 8)
      isButtonsMode: true, // optional. Default value: false. Allows you to display names on buttons (there is support for associative arrays)
      buttonModeOptions: {
        isSimpleArray: false, // optional. Default value: true. Enables/disables support for associative arrays
        title: (item, i) => i + 1 + ". " + item.title,
      },
      isEnabledDeleteButton: true, // optional. Default value: true
      onSelect: (item, index, ctx) => {
        ctx.reply(item.id)
      }, // optional. Default value: empty function
      messages: {
        // optional
        firstPage: "First page", // optional. Default value: "❗️ That's the first page"
        lastPage: "Last page", // optional. Default value: "❗️ That's the last page"
        prev: "◀️", // optional. Default value: "⬅️"
        next: "▶️", // optional. Default value: "➡️"
        delete: "🗑", // optional. Default value: "❌"
      },
    });
  
    pagination.handleActions(menuScene); // pass bot or scene instance as a parameter
  
    let text = await pagination.text(); // get pagination text
    let keyboard = await pagination.keyboard(); // get pagination keyboard
    await ctx.replyWithHTML(text, keyboard);
    // await ctx.reply('Выберите файл из списка', createButtons(arrayRes));
    return ctx.wizard.next();
  }
});

const searchTorrentAction = new Composer();
searchTorrentAction.action(/.+/, async (ctx) => {
  await ctx.deleteMessage();
  console.log(ctx, 'CONTEXT');
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
