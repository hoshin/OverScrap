#!/usr/bin/env node
const OverScrapServer = require('../dist/overScrap.server.min');

const port = process.env['OVERSCRAP_PORT'] || 0;
const serverInstance = OverScrapServer({port});

serverInstance.start();

