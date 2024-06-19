const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const feedUrl = 'https://rss.app/feeds/UR70vnelEZcQd8QQ.xml';

async function fetchAndParseRSS() {
  try {
    const response = await axios.get(feedUrl);
    const xmlData = response.data;
    const $ = cheerio.load(xmlData, { xmlMode: true });
    const items = $('item');
    const feedData = [];

    items.each((index, item) => {
      const title = $(item).find('title').text().trim();
      const descriptionHtml = $(item).find('description').text().trim();
      const description = cheerio.load(descriptionHtml);
      const descriptionText = description.text().trim();
      const img_url = description('img').attr('src') || '';
      const link = $(item).find('link').text().trim();
      const pub_date = $(item).find('pubDate').text().trim();

      feedData.push({
        title: title,
        description: descriptionText,
        link: link,
        pub_date: pub_date,
        img_url: img_url + "?not-from-cache-please"
      });
    });

    fs.writeFileSync('newsData.json', JSON.stringify(feedData, null, 2));
    console.log('RSS feed has been parsed and saved as newsData.json');
  } catch (error) {
    console.error('Error fetching or parsing RSS feed:', error);
  }
}

fetchAndParseRSS();
