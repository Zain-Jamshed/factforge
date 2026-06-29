// testKey.ts
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

async function testKey() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    console.log(`Testing key: ${apiKey?.substring(0, 5)}...${apiKey?.substring(apiKey.length - 4)}`);
    try {
        const response = await axios.get('https://api.elevenlabs.io/v1/user', {
            headers: { 'xi-api-key': apiKey }
        });
        console.log('Success! User details:', response.data);
    } catch (error: any) {
        console.error('Failed!', error.response?.status, error.response?.data);
    }
}
testKey();
