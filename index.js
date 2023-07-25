const axios = require('axios');
const fs = require('fs');
const twilio = require('twilio');
const path = require('path');

const OPENAI_API_URL = 'https://api.openai.com/v1/engines';
const FILE_NAME = path.join(__dirname, 'gpt_4_found');

const TWILIO_ACCOUNT_SID = '';
const TWILIO_AUTH_TOKEN = '';
const TWILIO_PHONE_NUMBER = '';
const TARGET_PHONE_NUMBER = '';

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const OpenAIKeys = [
    { name: 'my.email@example.com', key: 'sk-.....' },
    { name: 'my.other.email@example.org', key: 'sk-.....' },
  ];

async function hasGpt4(key) {
    try {
        const response = await axios({
            method: 'get',
            url: OPENAI_API_URL,
            headers: {
                'Authorization': `Bearer ${key.key}`,
                'Content-Type': 'application/json'
            }
        });

        const engines = response.data.data;

        const gptEngines = engines.filter(engine => engine.id.startsWith('gpt-'));

        if (gptEngines.length === 0) {
            console.error('Error - ' + key.name + ' - No GPT engines found');
            return null;
        }

        const gpt4 = engines.filter(engine => engine.id.startsWith('gpt-4'));

        return gpt4.length !== 0;
    } catch (error) {
        console.error('Error - ' + key.name + ' - API Error: ' + error.message);
        return null;
    }
}

async function main() {
    const now = new Date();
    const formattedDateTime = now.toISOString().slice(0, 16).replace('T', ' ');
    console.log('*** ' + formattedDateTime + ' ***');

    if (fs.existsSync(FILE_NAME)) {
        console.log(`File ${FILE_NAME} exists. Exiting.`);
        console.log('***')
        process.exit(0);
    }

    let hasFoundGpt4 = false;

    for (const key of OpenAIKeys) {
        const gpt4 = await hasGpt4(key);
        if (gpt4) {
            hasGpt4 = true;
            console.log('Status - ' + key.name + ' - GPT-4!! :) ');
            fs.writeFileSync(FILE_NAME, `GPT-4 found for ${key.name}`);

            console.log('Will send SMS now!!')
            await twilioClient.messages.create({
                body: `GPT-4 found for ${key.name}`,
                from: TWILIO_PHONE_NUMBER,
                to: TARGET_PHONE_NUMBER
            });
            console.log('SMS sent!')

            break;
        } else {
            console.log('Status - ' + key.name + ' - No GPT-4 :(');
        }
    }

    const currentHourLocal = now.getHours();
    const isTimeToSendUpdate = currentHourLocal >= 8 && currentHourLocal < 9;

    if (!hasFoundGpt4 && isTimeToSendUpdate) {
        console.log('Sending Sad Update SMS')
        await twilioClient.messages.create({
            body: 'I\'m still checking for GPT-4 and I\'ve not found it yet! Sorry :(',
            from: TWILIO_PHONE_NUMBER,
            to: TARGET_PHONE_NUMBER
        });
        console.log('SMS Sent')
    }
    console.log('***')
}

main();

