const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  const { url } = req.body ? JSON.parse(req.body) : {};
  if (!url) return res.status(400).json({ error: "Missing URL" });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const price = await page.evaluate(() => {
      const selectors = [
        '[data-testid="product-price"]',
        '.price__wrapper .price', 
        '.price-characteristic', 
        '.priceView-hero-price span', 
        '.product-price', 
        '.prod-PriceHero span'
      ];
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent) return el.textContent.trim();
      }
      return null;
    });

    await browser.close();
    if (!price) return res.status(404).json({ error: "Price not found" });

    res.status(200).json({ price });
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
};
