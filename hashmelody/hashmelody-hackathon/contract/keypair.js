const fs = require('fs');
const keypairJson = JSON.parse(fs.readFileSync('./deploy-keypair.json','utf-8'));
const secretKeyUint8Array = new Uint8Array(keypairJson);
const base64SecretKey = Buffer.from(secretKeyUint8Array).toString('base64');
console.log(base64SecretKey);