# OverScrap

This piece of JS aims to scrap a playoverwatch.com profile page and to produce a JSON digest of the stats found in it for a specific account.
When getting a profile's stats, one can choose between regions & game mode, just like on the page itself. The JSON produced is basically a "distraction free" version of what is seen on the page.

Right now, the tool focuses on the `Career stats` section and can be used for the `quickplay` & `competitive` game modes for any region you wish

Originally, I wrote this tool to allow me to track very specific stats (like my K/D ratio) without all the clutter existing applications provide

Note : this is still hugely WIP but, provided it is transpiled, it should be useable on a small app. As Blizzard does not seem to allow cross-origin for playoverwatch.com, this probably means that the requesting will have to be done server-side before handing the parsed data over to a user-facing app.

## What does the scrapped data look like?

The general structure of the file is as follows : 

```$json
{
    profile:{
        currentSR:<current profile's SR>
    }
    heroesStats:{
        <stats broken down by hero + 'All heroes'>
    }
}
```

Here's an example for one character in the `heroesStats` section
```$json
{
...
  Pharah: 
   { 'Hero Specific': 
      { 'Rocket Direct Hits': '12',
        'Rocket Direct Hits - Most in Game': '12',
        'Rocket Direct Hits - Average': '90.38' },
     Combat: 
      { 'Shots Fired': '27',
        'Shots Hit': '21',
        'Damage Done': '2,287',
        'Weapon Accuracy': '77%' },
     Best: 
      { 'Damage Done - Most in Life': '1,733',
        'Weapon Accuracy - Best in Game': '77%',
        'Damage Done - Most in Game': '2,287',
        'Objective Time - Most in Game': '00:14' },
     Average: 
      { 'Deaths - Average': '7.53',
        'Objective Time - Average': '01:47',
        'Damage Done - Average': '17,224.04' },
     Deaths: { Death: '1', 'Environmental Death': '1' },
     'Match Awards': { 'Medals - Silver': '0', 'Medals - Gold': '0', Medals: '1' },
     Game: 
      { 'Time Played': '1 minute',
        'Games Played': '0',
        'Objective Time': '00:14' },
     Miscellaneous: { 'Games Lost': '0' } },
...
}
```
The stats collected also include the `All heroes` section (as seen on the original page).

## How do I use it ?

### As a lib in a nodejs app
```$javascript
import OverScrap from 'over-scrap'

const overscrap = new OverScrap();

overscrap.loadDataFromProfile('Hoshin#2365', 'eu', 'competitive')
.then(playerStats => {
    // from then on, the `playerStats` object contains all heroes data parsed & organized as shown in the previous section
})

```

### Using the cli tool
```$bash
npm run start <Battle tag> [ region [ game mode ] ]
#^this'll output the raw JSON parsed from the playoverwatch profile page

```