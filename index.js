const express = require("express");
const expressApp = express();
const axios = require("axios");
const path = require("path");
const port = process.env.PORT || 3000;
const osmosis = require("osmosis");
const puppeteer = require("puppeteer");

expressApp.use(express.static("static"));
expressApp.use(express.json());
require("dotenv").config();

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

expressApp.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

function getOpenGraphMeta() {
  // Return a promise as execution of request is time-dependent
  return new Promise((resolve, reject) => {
    let response;

    osmosis
      // Tell Osmosis to load steemit.com
      .get("https://rutracker.net")
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
  bot.telegram.sendMessage(ctx.chat.id, "Привет, Танечка <3", {});
});

bot.command("info", async (ctx) => {
  let result = await getOpenGraphMeta().then((res) => {
    return res;
  });
  console.log(result);
  ctx.reply('' + result.title + "\n" + result.description, {});
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

bot.launch();
