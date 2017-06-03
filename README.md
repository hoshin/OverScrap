# OverScrap

Note : this is still hugely WIP (package.json is a mess for example) but, provided it is transpiled, it should be useable on a small app.

## What is this ?
This is a quite basic scrapper that transforms all the stats we see on an Overwatch players stats page into a JSON object in order to use that info elsewhere

Basically, it downloads the current profile page, parses it, and transforms the stats it finds into a JSON object.

Right now, the tool focuses on the `Career stats` section and can be used for the `quickplay` & `competitive` game modes

Originally, I wrote this tool to allow me to track very specific stats (like my K/D ratio) without all the clutter existing applications provide
## How does the scrapped data look like?

Here's an example for one character
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
The stats collected also include the `All heroes` section.

## How do I use it ?

A crude example (probably more to come later): 
```$javascript
import OverScrap from 'overscrap'

const overscrap = new OverScrap();

overscrap.loadDataFromProfile('Hoshin#2365', 'eu', 'competitive')
.then(playerStats => {
    console.log(playerStats.Reinhardt.Combat['Damage done'])
})

```