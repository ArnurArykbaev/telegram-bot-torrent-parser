const puppeteer = require("puppeteer");
const path = require("path");
const { readdir } = require('fs/promises');

/* getFile function */
let getFile = async (search, index, torrentId) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const downloadPath = path.resolve('././torrents');
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
    await page.focus("#search-text")
    await page.keyboard.type('\n');
    console.log('search-submit 2')
    await page.waitForSelector("#tor-tbl")
    // await page.click("#search-results > table > tbody > tr > td.t-title-col > .t-title");
    console.log('searchRes 2')
    const searchRes = await page.evaluate((index) => { 
      let searchArray = []
      for (let i = 0; i < 9; i++) {
        const messageText = document.querySelectorAll(["#search-results > table > tbody > tr > td.t-title-col > .t-title > a"])[i].dataset.topic_id
        searchArray.push(messageText)
      }
      return searchArray
    });
    console.log('searchRes 2-2')
    console.log(searchRes[index], 'RESULT!')
    await page.waitForXPath(`//a[@data-topic_id="${searchRes[index]}"]`)
    await page.click(`a[data-topic_id="${searchRes[index]}"]`)
    console.log(searchRes[index], 'data-topic_id clicked!')
    await page.waitForSelector(".dl-link");
    const torrentUrl = await page.$eval('.dl-link', torrent => torrent.href)
  
  
    const client = await page.target().createCDPSession()
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath,
    })
    await page.click('a.dl-link')
    await page.waitForTimeout(1000);
    torrentId = searchRes[index]
    await browser.close()
    return torrentId
};
  /* getFile function end */

module.exports.getFile = getFile

  
let findFile = async (id) => {
    let matchedFile
  
    const files = await readdir('././torrents');
  
    for (const file of files) {
        // Method 3:
        if (file.includes(id)) {
          matchedFile = file;
          console.log(matchedFile, 'here')
        }
    }
  
    return matchedFile
}

module.exports.findFile = findFile