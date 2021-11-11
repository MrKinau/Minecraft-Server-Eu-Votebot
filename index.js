const puppeteer = require('puppeteer');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const config = require('./config');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function vote(minecraftName, serverId) {
    let browser;
    if (config.chromiumPath.includes('/'))
        browser = await puppeteer.launch({executablePath: config.chromiumPath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    else
        browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36');
        await page.goto('https://minecraft-server.eu/vote/index/' + serverId + '/' + minecraftName);

        console.log('Started voting, waiting for drunken cow…');

        await page.waitForSelector('#playername', {visible: true});
        try {
            await page.waitForSelector('button[mode="primary"]', {visible: true});
            page.click('button[mode="primary"]');
        } catch(e) {}
        await sleep(Math.floor(Math.random() * 1500) + 500);

        await page.waitForSelector('#captcha', {visible: true});

        await sleep(Math.floor(Math.random() * 150) + 200);
        page.click('#captcha');

        console.log('Voted, waiting for response…');

        await page.waitForNavigation();
        await page.waitForSelector('.card .alert');
        const alert = await page.$(".card .alert");
        const text = await page.evaluate(alert => alert.textContent, alert);

        console.log(text);

        return text;
    } catch(e) {
        return e;
    } finally {
        await browser.close();
    }
    return null;
}

async function sendDiscordMessage(webhook, message, minecraftName) {
    var embed;
    if ((typeof message === 'string' || message instanceof String) && message.includes('successfully')) {
        embed = new MessageBuilder()
            .setTitle('Voted for: ' + minecraftName)
            .setAuthor('Vote-Bot', 'https://dl.kinau.systems/loading.gif')
            .setColor('#00b0f4')
            .setDescription(message);
    } else if (typeof message === 'error' || message instanceof Error) {
        embed = new MessageBuilder()
            .setTitle('Could not vote for: ' + minecraftName)
            .setAuthor('Vote-Bot', 'https://dl.kinau.systems/loading.gif')
            .setColor('#ffbaba')
            .setDescription(message.message);
    } else {
        embed = new MessageBuilder()
            .setTitle('Could not vote for: ' + minecraftName)
            .setAuthor('Vote-Bot', 'https://dl.kinau.systems/loading.gif')
            .setColor('#ffbaba')
            .setDescription("Unknown error:\n " + message);
    }
     
    webhook.send(embed);
}

async function start(minecraftName, serverId, webHook) {
    const response = await vote(minecraftName, serverId);
    await sendDiscordMessage(webHook, response, minecraftName);
}

const minecraftName = config.user_name;
const serverId = config.server_id;
const webHook = new Webhook(config.webhook_url);

start(minecraftName, serverId, webHook);