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
      { 'Rocket Direct Hits': 12,
        'Rocket Direct Hits - Most in Game': 12,
        'Rocket Direct Hits - Average': 90.38 },
     Combat: 
      { 'Shots Fired': 27,
        'Shots Hit': 21,
        'Damage Done': 2287,
        'Weapon Accuracy': '77%' },
     Best: 
      { 'Damage Done - Most in Life': 1,733,
        'Weapon Accuracy - Best in Game': '77%',
        'Damage Done - Most in Game': 2,287,
        'Objective Time - Most in Game': '00:14' },
     Average: 
      { 'Deaths - Average': 7.53,
        'Objective Time - Average': '01:47',
        'Damage Done - Average': 17224.04 },
     Deaths: { Death: '1', 'Environmental Death': 1 },
     'Match Awards': { 'Medals - Silver': 0, 'Medals - Gold': 0, Medals: 1 },
     Game: 
      { 'Time Played': '1 minute',
        'Games Played': 0,
        'Objective Time': '00:14' },
     Miscellaneous: { 'Games Lost': 0 } },
...
}
```
Note that numerical values are parsed now, which removes the hassle of making your own conversions after the fact.

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

### Using the GraphQL server

Right now, OverScrap ships with a small GQL server so that it is possible to fine-tune what you want to request even more.

You can either use the server components on their own, or run it through the `bin/overscrap.server.js` script.

If ran through the provided binary, the server will start immediately and take any random port available, unless the `OVERSCRAP_PORT` env variable is set.

Let's say that the server booted up on localhost and took port #4242, you can access the graphiql interface at : `localhost:4242/graphql`

From then on, you should be able to use graphiql for a simple `statsByHeroName` query. GraphiQL will provide autocompletion on most items but the "hero specific" ones (which are just raw JSON). 


For example, if you're a D.Va player and want to track how good of a "deleter/bully" you are, you could build a query like this :
```graphql
query {
  statsByHeroName(heroName:"D.Va", mode:"competitive", battleTag:"Hoshin#2365", region:"eu"){
    name
    Combat {
        Eliminations
        FinalBlows
        SoloKills
        ObjectiveKills
        Multikills
        EnvironmentalKills
        EliminationsPerLife
    }
    Best {
        EliminationsMostinLife
        AllDamageDoneMostinLife
        KillStreakBest
        EliminationsMostinGame
        FinalBlowsMostinGame
        ObjectiveKillsMostinGame
        SoloKillsMostinGame
    }
    Average {
        AllDamageDoneAvgper10Min
    }
    Deaths
  }
}
```
And then get this kind of result :

```json
{
  "data": {
    "statsByHeroName": {
      "name": "D.Va",
      "Combat": {
        "Eliminations": 1209,
        "FinalBlows": 474,
        "SoloKills": 85,
        "ObjectiveKills": 653,
        "Multikills": 17,
        "EnvironmentalKills": 13,
        "EliminationsPerLife": null
      },
      "Best": {
        "EliminationsMostinLife": 23,
        "AllDamageDoneMostinLife": 11893,
        "KillStreakBest": 23,
        "EliminationsMostinGame": 61,
        "FinalBlowsMostinGame": 29,
        "ObjectiveKillsMostinGame": 46,
        "SoloKillsMostinGame": 6
      },
      "Average": {
        "AllDamageDoneAvgper10Min": 16.89
      },
      "Deaths": 280
    }
  }
}
```



To this effect, all hero specific data has been moved into the "hero specific" category (so for example Reinhardt charge kills don't end up un the "best" category but rather in a specific section where you can get all things purely Reinhardt, D.Va, Pharah ...

For example, getting raw stats for D.Va would get you : 
```graphql
query {
    statsByHeroName(heroName:"D.Va", mode:"competitive", battleTag:"Hoshin#2365", region:"eu"){
    
        HeroSpecific {
            raw # Here it's not possible to get autocompletion, just raw data as JSON
        }
    }
}
```
Produces: 

```json
{
  "data": {
    "statsByHeroName": {
      "name": "D.Va",
      "HeroSpecific": {
        "raw": {
          "Mechs Called": 253,
          "Mechs Called - Most in Game": 11,
          "Damage Blocked - Most in Game": 28847,
          "Damage Blocked": 569955,
          "Mech Deaths": 365,
          "Melee Final Blow - Most in Game": 1,
          "MechsCalled": 253,
          "MechsCalledMostinGame": 11,
          "DamageBlockedMostinGame": 28847,
          "DamageBlocked": 569955,
          "MechDeaths": 365,
          "MeleeFinalBlowMostinGame": 1
        }
      },
      "Combat": {
        "Eliminations": 1209,
        "FinalBlows": 474,
        "SoloKills": 85,
        "ObjectiveKills": 653,
        "Multikills": 17,
        "EnvironmentalKills": 13,
        "EliminationsPerLife": null
      },
      "Best": {
        "EliminationsMostinLife": 23,
        "AllDamageDoneMostinLife": 11893,
        "KillStreakBest": 23,
        "EliminationsMostinGame": 61,
        "FinalBlowsMostinGame": 29,
        "ObjectiveKillsMostinGame": 46,
        "SoloKillsMostinGame": 6
      },
      "Average": {
        "AllDamageDoneAvgper10Min": 16.89
      },
      "Deaths": 280
    }
  }
}

```
Whereas doing the same for Reinhardt : 
```graphql
query {
    statsByHeroName(heroName:"Reinhardt", mode:"competitive", battleTag:"Hoshin#2365", region:"eu"){
        HeroSpecific {
            raw 
        }
    }
}

```
Produces this :
```json
{
  "data": {
    "statsByHeroName": {
      "name": "Reinhardt",
      "HeroSpecific": {
        "raw": {
          "Damage Blocked": 188695,
          "Damage Blocked - Most in Game": 25436,
          "Charge Kills": 44,
          "Charge Kills - Most in Game": 10,
          "Fire Strike Kills": 85,
          "Fire Strike Kills - Most in Game": 18,
          "Earthshatter Kills": 50,
          "Earthshatter Kills - Most in Game": 11,
          "DamageBlocked": 188695,
          "DamageBlockedMostinGame": 25436,
          "ChargeKills": 44,
          "ChargeKillsMostinGame": 10,
          "FireStrikeKills": 85,
          "FireStrikeKillsMostinGame": 18,
          "EarthshatterKills": 50,
          "EarthshatterKillsMostinGame": 11
        }
      }
    }
  }
}
```

An other important tidbit of info about the server : it is configured to use a "sample file" while not explicitly set to work for a production environment. To enable "production" mode, you just have to export the `OVERSCRAP_ENV` env variable and set it to `production`
