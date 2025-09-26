#!/usr/bin/env node

/**
 * Chahuadev Anti-Mock Cache Scanner - CLI Entry Point
 * Universal Security Engine v2.0
 * 
 * Command: npx chahuadev-anti-mock-cache-scanner
 */

const path = require('path');
const { spawn } = require('child_process');

// Get the main scanner from lib directory
const scannerPath = path.join(__dirname, '..', 'lib', 'universal-security-scanner.js');

// Pass all arguments to the main scanner
const args = process.argv.slice(2);
const scanner = spawn('node', [scannerPath, ...args], {
    stdio: 'inherit'
});

scanner.on('close', (code) => {
    process.exit(code);
});

scanner.on('error', (err) => {
    console.error('Error starting scanner:', err.message);
    process.exit(1);
});