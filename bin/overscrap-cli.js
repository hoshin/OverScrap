#!/usr/bin/env node
var OverScrap = require('../dist/overScrap.min');

if(process.argv.length < 3){
  console.error('Not enough arguments')
  console.error('\t./bin/overscrap-cli.js <Battle tag> [ region [ game mode ]]')
  console.error('if not provided, region defaults to `eu` and game mode to `competitive`')
  process.exit(1);
}

var overScrap = new OverScrap();
console.log(`Looking up data for ${process.argv[2]} on realm '${process.argv[3] || 'default'}' for the '${process.argv[4] || 'default'}' mode `)
overScrap.loadDataFromProfile(process.argv[2], process.argv[3], process.argv[4]).then(data => {
  console.log(data);
})
