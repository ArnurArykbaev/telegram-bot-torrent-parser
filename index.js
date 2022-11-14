const express = require("express");
const expressApp = express();
const axios = require("axios");
const path = require("path");
const port = process.env.PORT || 3000;
const osmosis = require("osmosis");
const puppeteer = require("puppeteer");
const fs = require("fs");
const https = require('https');

expressApp.use(express.static("static"));
expressApp.use(express.json());
require("dotenv").config();

const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);

/* Autorisation bot on trutracker */

/* (async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(process.env.RUTRACKER_SITE)

  await page.type('#login_field', process.env.RUTRACKER_SITE_USER)
  await page.type('#password', process.env.RUTRACKER_SITE_PWD)

  await page.waitForSelector('.js-cookie-consent-reject')
  await page.click('.js-cookie-consent-reject')
  await page.$eval('[name="commit"]', (elem) => elem.click())
  await page.waitForNavigation()

  const cookies = await page.cookies()
  const cookieJson = JSON.stringify(cookies)

  fs.writeFileSync('cookies.json', cookieJson)

  await browser.close()
})() */
/* Autorisation bot on trutracker */

/* Read coockies from file */
/* (async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  const cookies = fs.readFileSync('cookies.json', 'utf8')

  const deserializedCookies = JSON.parse(cookies)
  await page.setCookie(...deserializedCookies)

  await page.goto(`${process.env.RUTRACKER_SITE}/${process.env.RUTRACKER_SITE_USER}`)

  await browser.close()
})() */
/* Read coockies from file */

expressApp.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

function getOpenGraphMeta() {
  // Return a promise as execution of request is time-dependent
  return new Promise((resolve, reject) => {
    let response;

    osmosis
      // Tell Osmosis to load steemit.com
      .get(process.env.RUTRACKER_SITE)
      // We want to get the metatags in head, so provide the head element as a value to find
      .find("head")
      // Set creates our final object of data we will get calling .data
      // the secondary values for these are select lookups. We are saying find meta tag with this property and return its content
      .set({
        title: "title",
        description: "meta[name='description']@content",
        icon: "meta[name='description']@content",
      })
      // Store a copy of the above object in our response variable
      .data((res) => (response = res))
      // If we encounter an error we will reject the promise
      .error((err) => reject(err))
      // Resolve the promise with our response object
      .done(() => resolve(response));
  });
}

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

/* scrape function */
let scrape = async (search) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const escapeXpathString = (str) => {
    const splitedQuotes = str.replace(/'/g, `', "'", '`);
    return `concat('${splitedQuotes}', '')`;
  };
  const clickByText = async (page, text) => {
    const escapedText = escapeXpathString(text);
    const linkHandlers = await page.$x(`//*[contains(text(), ${escapedText})]`);
    if (linkHandlers.length > 0) {
      await linkHandlers[0].click();
    } else {
      throw new Error(`Link not found: ${text}`);
    }
  };

  await page.goto(process.env.RUTRACKER_SITE);
  await clickByText(page, "Вход");
  await page.waitForSelector("#top-login-box");
  await page.type("#top-login-uname", process.env.RUTRACKER_SITE_USER);
  await page.type("#top-login-pwd", process.env.RUTRACKER_SITE_PWD);
  await page.click("#top-login-btn");
  await page.waitForSelector("#logged-in-username");
  const entryBtn = await page.evaluate(() => {
    let title = document.querySelector(["#logged-in-username"]).innerText;
    return title;
  });
  console.log(entryBtn, "authenticated");
  console.log(search, "searchText");
  await page.type("#search-text", search);
  await page.click("#search-submit");
  console.log('search-submit 1')
  await page.waitForSelector("#tor-tbl");
  console.log('searchRes 1')
  const searchRes = await page.evaluate(() => {
    /*     document.querySelector(["#search-results > table > tbody > #trs-tr-6246797 > td.t-title-col > div.t-title > a"] */
    let searchRows = Array.from(
      document.querySelectorAll(["#search-results > table > tbody > tr"])
    );
    let searchArray = [];
    for (let i = 0; i < 8; i++) {
      const messageText = document.querySelectorAll(["#search-results > table > tbody > tr > td.t-title-col > .t-title"])[i].textContent.replace(/[\t]/g, '').replace(/[\n]/g, '')
      searchArray.push(messageText);
    }
    return searchArray;
  });
  console.log('searchRes 1-2')
  await browser.close();
  return searchRes;
};
/* scrape function end */

/* response function */
let toResponse = async (resArray) => {
  const buttonsArray = resArray.map(el => {
    if(el.length > 34) {
      const resEl = '' + el.substring(0, 34)
      return resEl
    } else return el
  })
  arrayResGenelral = buttonsArray


  return buttonsArray
}
/* response function end*/

/* getFile function */
let getFile = async (search, index) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const fs = require('fs');
  const https = require('https');
  const escapeXpathString = (str) => {
    const splitedQuotes = str.replace(/'/g, `', "'", '`)
    return `concat('${splitedQuotes}', '')`;
  };
  const clickByText = async (page, text) => {
    const escapedText = escapeXpathString(text);
    const linkHandlers = await page.$x(`//*[contains(text(), ${escapedText})]`);
    if (linkHandlers.length > 0) {
      await linkHandlers[0].click()
    } else {
      console.log('errortext ' + text)
    }
  };

  await page.goto(process.env.RUTRACKER_SITE);
  await clickByText(page, "Вход");
  await page.waitForSelector("#top-login-box");
  await page.type("#top-login-uname", process.env.RUTRACKER_SITE_USER);
  await page.type("#top-login-pwd", process.env.RUTRACKER_SITE_PWD);
  await page.click("#top-login-btn");
  await page.waitForSelector("#logged-in-username");
  const entryBtn = await page.evaluate(() => {
    let title = document.querySelector(["#logged-in-username"]).innerText;
    return title;
  });
  console.log(entryBtn, "authenticated");
  console.log(search, "searchText");
  await page.type("#search-text", search)
  await page.click("#search-submit")
  console.log('search-submit 2')
  await page.waitForSelector("#tor-tbl")
  // await page.click("#search-results > table > tbody > tr > td.t-title-col > .t-title");
  console.log('searchRes 2')
  const searchRes = await page.evaluate((index) => { 
    let searchArray = []
    for (let i = 0; i < 8; i++) {
      const messageText = document.querySelectorAll(["#search-results > table > tbody > tr > td.t-title-col > .t-title > a"])[i].dataset.topic_id
      searchArray.push(messageText)
    }
    return searchArray
  });
  console.log('searchRes 2-2')
  console.log(searchRes[index], 'RESULT!')
  await page.waitForXPath(`//a[@data-topic_id="${searchRes[index]}"]`, { visible: true } )
  await page.click(`[data-topic_id="${searchRes[index]}"]`)
  console.log(searchRes[index], 'data-topic_id clicked!')
  await page.waitForSelector(".dl-link");
  const torrentUrl = await page.$eval('.dl-link', torrent => torrent.href)
  await browser.close();
  return torrentUrl
};
/* getFile function end */

let arrayResGenelral 
let firstSearch
let firstIndex

bot.command("find", async (ctx, next) => {
  console.log(ctx.from);
  const trackerMessage = `Введите наименование файла, который хотите скачать`;
  ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, trackerMessage, {});
  bot.on("text", (ctx) => ctx.reply(ctx.message));
  scrape().then((value) => {
    console.log(value, "Получилось"); // Получилось!
  });
});

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
  let res = await scrape(ctx.message.text)

  if(typeof res === 'string') {
    await ctx.reply('' + res + '! Попробуйте другой запрос')
  } else {  
    const arrayRes = await toResponse(res)
    await ctx.reply('Выберите файл из списка',
      Markup.inlineKeyboard(arrayRes.map((button, id) => Markup.button.callback(button, id)), {columns: 1})
    );
  }

  return ctx.wizard.next();
});

const searchTorrentAction = new Composer();
searchTorrentAction.action(/.+/, async (ctx) => {
  await ctx.deleteMessage();
  let res = await getFile(firstSearch, ctx.match.input)
  await ctx.reply('' + res);
  return ctx.scene.leave();
});


/* Scenes declare */
const menuScene = new Scenes.WizardScene(
  "sceneWizard",
  startWizard,
  searchTorrent,
  searchTorrentAction,
);
const stage = new Scenes.Stage([menuScene]);

/* middleware to scenes */
bot.use(session());
bot.use(stage.middleware());

bot.command("go", (ctx) => ctx.scene.enter("sceneWizard"));

bot.launch();
