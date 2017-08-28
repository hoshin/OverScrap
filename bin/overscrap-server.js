#!/usr/bin/env node
const OverScrapServer = require('../dist/overScrap.server.min');
process.env['OVERSCRAP_ENV'] = 'production';

const port = process.env['OVERSCRAP_PORT'] || 0;
const serverInstance = OverScrapServer({port});

serverInstance.start();

