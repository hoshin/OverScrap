const { GraphQLScalarType, GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLFloat } = require('graphql');

let JSONScalar = {
  type: new GraphQLScalarType({
    name: 'JSONScalar',
    serialize: value => value,
    parseValue: value => value,
    parseLiteral: value => value
  })
};

const HeroSpecific = new GraphQLObjectType({
  name: 'HeroSpecific',
  fields: {
    raw: JSONScalar,
  },
});

const Combat = new GraphQLObjectType({
  name: 'Combat',
  fields: {
    eliminations: { type: GraphQLInt },
    finalBlows: { type: GraphQLInt },
    soloKills: { type: GraphQLInt },
    allDamageDone: { type: GraphQLInt },
    objectiveKills: { type: GraphQLInt },
    multikills: { type: GraphQLInt },
    environmentalKill: { type: GraphQLInt },
    environmentalKills: { type: GraphQLInt },
    eliminationsPerLife: { type: GraphQLFloat },
  },
});

const Assists = new GraphQLObjectType({
  name: 'Assists',
  fields: {
    turretsDestroyed: { type: GraphQLInt },
    offensiveAssists: { type: GraphQLInt },
  },
});

const Best = new GraphQLObjectType({
  name: 'Best',
  fields: {
    eliminationsMostInLife: { type: GraphQLInt },
    allDamageDoneMostInLife: { type: GraphQLInt },
    killStreakBest: { type: GraphQLInt, },
    allDamageDoneMostInGame: { type: GraphQLInt, },
    eliminationsMostInGame: { type: GraphQLInt, },
    finalBlowsMostInGame: { type: GraphQLInt, },
    objectiveKillsMostInGame: { type: GraphQLInt, },
    objectiveTimeMostInGame: { type: GraphQLInt, },
    soloKillsMostInGame: { type: GraphQLInt, },
    offensiveAssistsMostInGame: { type: GraphQLInt },
  },
});

const Average = new GraphQLObjectType({
  name: 'Average',
  fields: {
    allDamageDoneAvgPer10Min: { type: GraphQLFloat },
  },
});

const MatchAwards = new GraphQLObjectType({
  name: 'MatchAwards',
  fields: {
    medalsBronze: { type: GraphQLInt, },
    medalsSilver: { type: GraphQLInt, },
    medalsGold: { type: GraphQLInt, },
    medals: { type: GraphQLInt, },
    cards: { type: GraphQLInt },
  },
});

const Game = new GraphQLObjectType({
  name: 'Game',
  fields: {
    timePlayed: { type: GraphQLInt, },
    gamesPlayed: { type: GraphQLInt, },
    gamesWon: { type: GraphQLInt, },
    objectiveTime: { type: GraphQLFloat, },
    timeSpentOnFire: { type: GraphQLFloat, },
    winPercentage: { type: GraphQLFloat },
  },
});

const Miscellaneous = new GraphQLObjectType({
  name: 'Miscellaneous',
  fields: {
    multikillBest: { type: GraphQLInt },
    gamesTied: { type: GraphQLInt },
    timeSpentOnFireMostInGame: { type: GraphQLFloat },
    offensiveAssistsAvgPer10Min: { type: GraphQLFloat },
    damageBlockedAvgPer10Min: { type: GraphQLFloat },
    timeSpentOnFireAvgPer10Min: { type: GraphQLFloat },
    soloKillsAvgPer10Min: { type: GraphQLFloat },
    objectiveTimeAvgPer10Min: { type: GraphQLFloat },
    objectiveKillsAvgPer10Min: { type: GraphQLFloat },
    finalBlowsAvgPer10Min: { type: GraphQLFloat },
    eliminationsAvgPer10Min: { type: GraphQLFloat },
    deathsAvgPer10Min: { type: GraphQLFloat },
    gamesLost: { type: GraphQLInt },
  },
});

const HeroStats = new GraphQLObjectType({
  name: 'HeroStats',
  fields: {
    name: { type: GraphQLString },
    heroSpecific: { type: HeroSpecific },
    combat: { type: Combat },
    assists: { type: Assists },
    best: { type: Best },
    average: { type: Average },
    deaths: { type: GraphQLInt },
    matchAwards: { type: MatchAwards },
    game: { type: Game },
    miscellaneous: { type: Miscellaneous },
    raw: JSONScalar,
  },
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: () => ({
      statsByHeroName: {
        type: HeroStats,
        args: {
          heroName: { type: GraphQLString },
          battleTag: { type: GraphQLString },
          region: { type: GraphQLString },
          mode: { type: GraphQLString }
        }
      }
    })
  })
});

module.exports = schema;