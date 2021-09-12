const puppeteer = require('puppeteer');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const config = require('./config');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function vote(minecraftName, serverId) {    
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: false});
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
    await browser.close();

    return text;
}

async function sendDiscordMessage(webhook, message, minecraftName) {
    const embed = new MessageBuilder()
        .setTitle('Voted for: ' + minecraftName)
        .setAuthor('Vote-Bot', 'https://dl.kinau.systems/loading.gif')
        .setColor('#00b0f4')
        .setDescription(message);
     
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