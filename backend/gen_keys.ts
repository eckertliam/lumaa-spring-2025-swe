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

    // if keys dir does not exist create it
    if (!fs.existsSync('keys')) {
        fs.mkdirSync('keys');
    }

    // write the keys to the keys directory
    fs.writeFileSync('keys/private.pem', privateKey);
    fs.writeFileSync('keys/public.pem', publicKey);
}

generateKeyPair();