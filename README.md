# Subreddit-Wiki-Scrapper

## About
`subreddit-wiki-scrapper` lets you download any subreddit's wiki and archive it.

currently only the html will be downloaded without any styling to it

## Installing
```
npm i subreddit-wiki-scrapper
```

## Usage
Suppose you want to archive the Piracy subreddit's wiki

```js
const SWS = require("subreddit-wiki-scrapper")

SWS("piracy", "./piracy-wiki", { chromiumPath: 'C:\\path\\for\\chromium.exe' })
```

This will download the wiki in the `piracy-wiki` directory

*if the given subreddit doesn't have a wiki, an empty `.nowiki` file will be placed in the dirctory*

*NOTE:* only a chromium browser will work, firefox will NOT work

## Arguments
1. **subreddit name**
2. **installation path** relatively to the current working directory loacation, to avoid cwd path, use an absolute path
3. **options**
   - `chromiumPath` - the path for a chromium browser to run in it - required
   - `headless` - whether to run chromium in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome) or not - default true
   - `silent` - operate in silent mode, there will be no logs in the terminal - default true

