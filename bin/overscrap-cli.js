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
.catch(err => {
  console.log('Oops ... something went wrong.')
  console.log(`${err.message.substring(0, 100)} ...`)
  if(err.message.startsWith('404')){
    console.log('Could not find the page, there\'s probably an issue with the Battle tag, region or game modes provided. Please double check them, retry, and submit a report if it still fails =)' )
  }
  process.exit(2)
})
