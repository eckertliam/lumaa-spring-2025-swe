// utility script to generate a private and public key for the JWT

import crypto from 'crypto';
import fs from 'fs';

function generateKeyPair(): void {
    // generate a private and public key pair using RSA encryption
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki', // standard public key encoding
            format: 'pem' // standard PEM encoding
        },
        privateKeyEncoding: {
            type: 'pkcs8', // standard private key encoding
            format: 'pem' // standard PEM encoding
        }
    });

    // convert the keys to base64 format and concatenate them into a single string
    const envContent: string = `JWT_PRIVATE_KEY=${Buffer.from(privateKey).toString('base64')}\nJWT_PUBLIC_KEY=${Buffer.from(publicKey).toString('base64')}`;
    // append the keys to the .env file
    fs.appendFileSync('.env', envContent);
}

generateKeyPair();