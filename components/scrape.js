const puppeteer = require("puppeteer");

/* scrape function */
let scrape = async (search) => {
    const browser = await puppeteer.launch({ headless: true });
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
    await page.type("input#search-text", search)
    await page.waitForTimeout(500);
    await page.focus("#search-text")
    await page.keyboard.type('\n');
    console.log('search-submit 1')
    await page.waitForSelector("th[title='Сиды']");
    await page.click("th[title='Сиды']");
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
        let pageElement = document.querySelectorAll(["#search-results > table > tbody > tr > td.t-title-col > .t-title"])
        for (let i = 0; i < pageElement.length; i++) {
          if(pageElement[i] === undefined) {
            let obj = {
              title: null,
              id: null,
            }
            obj.title = 'element'
            obj.id = i + 1
            searchArray.push(obj);
          } else {
            let obj = {
              title: null,
              id: null,
            }
            obj.title = pageElement[i].textContent.replace(/[\t]/g, '').replace(/[\n]/g, '')
            obj.id = i + 1
            searchArray.push(obj);
          }
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
    if(el.length > 300) {
      const resEl = '' + el.substring(0, 300)
      return resEl
    } else return el
  })
  arrayResGenelral = buttonsArray


  return buttonsArray
}
/* response function end*/

module.exports.sliceLongTitles = sliceLongTitles