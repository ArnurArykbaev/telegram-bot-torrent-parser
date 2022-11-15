const puppeteer = require("puppeteer");

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
    await page.waitForTimeout(500);
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
    console.log('search-submit 1')
    await page.waitForSelector("#tor-tbl");
    console.log('searchRes 1')
    const searchRes = await page.evaluate(() => {
      /*     document.querySelector(["#search-results > table > tbody > #trs-tr-6253797 > td.t-title-col > div.t-title > a"] */
      let searchRows = Array.from(
        document.querySelectorAll(["#search-results > table > tbody > tr"])
      );
      let emptyRes = document.querySelector(["#search-results > table > tbody > tr > td"])
      if(typeof emptyRes.innerText === 'string' && emptyRes.innerText === 'Не найдено') {
        console.log('EMPTY')
        emptyRes = emptyRes.innerText
        return emptyRes
      } else {
        let searchArray = [];
        console.log('NOTEMPTY')
        for (let i = 0; i < 8; i++) {
          const messageText = document.querySelectorAll(["#search-results > table > tbody > tr > td.t-title-col > .t-title"])[i].textContent.replace(/[\t]/g, '').replace(/[\n]/g, '')
          searchArray.push(messageText);
        }
        return searchArray;
      }
    });
    console.log('searchRes 1-2')
    await browser.close();
    return searchRes;
  };
  /* scrape function end */

  module.exports.scrape = scrape

  /* response function */
let sliceLongTitles = async (resArray) => {
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

module.exports.sliceLongTitles = sliceLongTitles