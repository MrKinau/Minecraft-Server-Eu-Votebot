const puppeteer = require('puppeteer');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const config = require('./config');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function vote(minecraftName, serverId) {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    try {
        const page = await browser.newPage();
        await page.goto('https://minecraft-server.eu/vote/index/' + serverId + '/' + minecraftName);

        console.log('Started voting, waiting for drunken cow…');

        await page.waitForSelector('#playername', {visible: true});
        await sleep(Math.floor(Math.random() * 1500) + 500);

        await page.waitForSelector('#captcha', {visible: true});
        page.click('#captcha');

        console.log('Voted, waiting for response…');

        await page.waitForNavigation();
        await page.waitForSelector('.card .alert');
        const alert = await page.$(".card .alert");
        const text = await page.evaluate(alert => alert.textContent, alert);

        console.log(text);
    } catch(e) {
        return e;
    } finally {
        await browser.close();
    }

    return text;
}

async function sendDiscordMessage(webhook, message, minecraftName) {
    var embed;
    if (message instanceof String) {
        embed = new MessageBuilder()
            .setTitle('Voted for: ' + minecraftName)
            .setAuthor('Vote-Bot', 'https://dl.kinau.systems/loading.gif')
            .setColor('#00b0f4')
            .setDescription(message);
    } else if (message instanceof Error) {
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
            .setDescription("unknown error:\n " + message);
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