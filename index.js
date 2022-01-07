const
fs = require("fs/promises"),
puppeteer = require("puppeteer-core")


/**
 * 
 * @typedef {object} options
 * @property {string} chromiumPath the path for a chromium browser to run in it - required
 * @property {boolean} [headless] whether to run chromium in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome) or not - default true
 * @property {boolean} [silent] operate in silent mode, there will be no logs in the terminal - default true
 * @property {number} [timeout] page loading timeout in ms - default 30000 (30s)
 */

/**
 * 
 * @param {string} subreddit the subreddit name to scrape
 * @param {string} outDir the output directory
 * @param {options} opts scrape options
 * @returns {Promise<void>}
 */

async function subredditWikiScrapper(subreddit, outDir, opts = {}) {

  subreddit = subreddit.toLowerCase()
  await fs.mkdir(outDir, { recursive: true })
  const doneScraping = new Set()


  const browser = await puppeteer.launch({
    executablePath: opts.chromiumPath,
    headless: opts.headless === false ? false : true
  })


  const page = await browser.newPage()
  typeof opts.timeout === "number" && page.setDefaultTimeout(opts.timeout)
  page.setRequestInterception(true)
  page.on("request", req => {
    req.resourceType() === "document" ? req.continue() : req.abort()
  })

  opts.silent === false && console.log("Downloading index")

  await page.goto(`https://www.reddit.com/r/${subreddit}/wiki/index`)

  const wikiError = await page.waitForSelector(".md.wiki").then(() => 0).catch(err => err)

  if (wikiError !== 0) {
    opts.silent === false && console.log("/r/%s doesn't have a wiki\n\n%O", subreddit, wikiError)
    await browser.close()
    await fs.writeFile(`${outDir}/.nowiki`, "")
    return
  }

  let [wiki, links] = await page.evaluate(() => [
    document.querySelector(".md.wiki").innerHTML,
    Array.from(document.querySelector(".md.wiki").querySelectorAll("a")).map(a => a.pathname.toLowerCase())
  ])

  links = links.filter(link => link.indexOf(`/r/${subreddit}/wiki/`) !== -1).map(link => link.substring(9 + subreddit.length))

  await fs.writeFile(`${outDir}/index.html`, wiki).then(() => doneScraping.add("index"))

  wiki = null
  await page.close()


  for (const link of links) {
    await recursiveScrape(outDir, browser, subreddit, link, doneScraping, opts)
  }

  opts.silent === false && console.log("\nsuccessfuly done downloading: \n%O", [...doneScraping.values()])

  await browser.close()
}

/**
 * 
 * @param {string} outDir out directory
 * @param {object} browser browser object
 * @param {string} subreddit subreddit name
 * @param {string} link current link to scrape (stripped version)
 * @param {set} doneScraping already scraped links
 * @param {options} opts scrape options
 * @returns {Promise<void>}
 * @private
 */

async function recursiveScrape(outDir, browser, subreddit, link, doneScraping, opts) {

  if (doneScraping.has(link)) return

  opts.silent === false && console.log("Downloading %s", link)

  const page = await browser.newPage()

  typeof opts.timeout === "number" && page.setDefaultTimeout(opts.timeout)
  page.setRequestInterception(true)
  page.on("request", req => {
    req.resourceType() === "document" ? req.continue() : req.abort()
  })

  await page.goto(`https://www.reddit.com/r/${subreddit}/wiki/${link}`)

  const wikiError = await page.waitForSelector(".md.wiki").then(() => 0).catch(err => err)

  if (wikiError !== 0) {
    opts.silent === false && console.log("Failed Downloading %s\n\n%O\n", link, wikiError)
    return
  }

  let [wiki, links] = await page.evaluate(() => [
    document.querySelector(".md.wiki").innerHTML,
    Array.from(document.querySelector(".md.wiki").querySelectorAll("a")).map(a => a.pathname.toLowerCase())
  ])

  links = links.filter(link => link.indexOf(`/r/${subreddit}/wiki/`) !== -1).map(link => link.substring(9 + subreddit.length))


  if (link.indexOf("/") !== -1) {
    await fs.mkdir(`${outDir}/${link.substring(0, link.lastIndexOf("/"))}`, { recursive: true })
  }

  await fs.writeFile(`${outDir}/${link}.html`, wiki).then(() => doneScraping.add(link))

  wiki = null
  await page.close()

  for (const newLink of links) {
    if (doneScraping.has(newLink)) continue

    await recursiveScrape(outDir, browser, subreddit, newLink, doneScraping, opts)
  }
}

module.exports = subredditWikiScrapper