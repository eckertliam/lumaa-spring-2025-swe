// utility script to generate a private and public key for the JWT

import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

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

    // if keys dir does not exist create it
    if (!fs.existsSync(process.env.JWT_KEY_DIR as string)) {
        fs.mkdirSync(process.env.JWT_KEY_DIR as string);
    }

    // write the keys to the keys directory
    fs.writeFileSync(process.env.JWT_KEY_DIR + '/private.pem', privateKey);
    fs.writeFileSync(process.env.JWT_KEY_DIR + '/public.pem', publicKey);
}

generateKeyPair();