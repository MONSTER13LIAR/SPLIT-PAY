const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    page.on('pageerror', error => {
        errors.push(error.message);
    });

    try {
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });

        // Check if canvas exists
        const canvasExists = await page.evaluate(() => {
            return !!document.querySelector('canvas');
        });

        // Check if spline-viewer exists (if we reverted to that)
        const viewerExists = await page.evaluate(() => {
            return !!document.querySelector('spline-viewer');
        });

        console.log(JSON.stringify({
            canvasExists,
            viewerExists,
            errors
        }, null, 2));

    } catch (error) {
        console.error('Script error:', error);
    } finally {
        await browser.close();
    }
})();
