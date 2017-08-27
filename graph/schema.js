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
    Eliminations: { type: GraphQLInt },
    FinalBlows: { type: GraphQLInt },
    SoloKills: { type: GraphQLInt },
    AllDamageDone: { type: GraphQLInt },
    ObjectiveKills: { type: GraphQLInt },
    Multikills: { type: GraphQLInt },
    EnvironmentalKill: { type: GraphQLInt },
    EnvironmentalKills: { type: GraphQLInt },
    EliminationsPerLife: { type: GraphQLFloat },
  },
});

const Assists = new GraphQLObjectType({
  name: 'Assists',
  fields: {
    TurretsDestroyed: { type: GraphQLInt },
    OffensiveAssists: { type: GraphQLInt },
  },
});

const Best = new GraphQLObjectType({
  name: 'Best',
  fields: {
    EliminationsMostinLife: { type: GraphQLInt },
    AllDamageDoneMostinLife: { type: GraphQLInt },
    KillStreakBest: { type: GraphQLInt, },
    AllDamageDoneMostinGame: { type: GraphQLInt, },
    EliminationsMostinGame: { type: GraphQLInt, },
    FinalBlowsMostinGame: { type: GraphQLInt, },
    ObjectiveKillsMostinGame: { type: GraphQLInt, },
    ObjectiveTimeMostinGame: { type: GraphQLInt, },
    SoloKillsMostinGame: { type: GraphQLInt, },
    OffensiveAssistsMostinGame: { type: GraphQLInt },
  },
});

const Average = new GraphQLObjectType({
  name: 'Average',
  fields: {
    AllDamageDoneAvgper10Min: { type: GraphQLFloat },
  },
});

const MatchAwards = new GraphQLObjectType({
  name: 'MatchAwards',
  fields: {
    MedalsBronze: { type: GraphQLInt, },
    MedalsSilver: { type: GraphQLInt, },
    MedalsGold: { type: GraphQLInt, },
    Medals: { type: GraphQLInt, },
    Cards: { type: GraphQLInt },
  },
});

const Game = new GraphQLObjectType({
  name: 'Game',
  fields: {
    TimePlayed: { type: GraphQLInt, },
    GamesPlayed: { type: GraphQLInt, },
    GamesWon: { type: GraphQLInt, },
    ObjectiveTime: { type: GraphQLFloat, },
    TimeSpentonFire: { type: GraphQLFloat, },
    WinPercentage: { type: GraphQLFloat },
  },
});

const Miscelaneous = new GraphQLObjectType({
  name: 'Miscelaneous',
  fields: {
    MultikillBest: { type: GraphQLInt },
    GamesTied: { type: GraphQLInt },
    TimeSpentonFireMostinGame: { type: GraphQLFloat },
    OffensiveAssistsAvgper10Min: { type: GraphQLFloat },
    DamageBlockedAvgper10Min: { type: GraphQLFloat },
    TimeSpentonFireAvgper10Min: { type: GraphQLFloat },
    SoloKillsAvgper10Min: { type: GraphQLFloat },
    ObjectiveTimeAvgper10Min: { type: GraphQLFloat },
    ObjectiveKillsAvgper10Min: { type: GraphQLFloat },
    FinalBlowsAvgper10Min: { type: GraphQLFloat },
    EliminationsAvgper10Min: { type: GraphQLFloat },
    DeathsAvgper10Min: { type: GraphQLFloat },
    GamesLost: { type: GraphQLInt },
  },
});

const HeroStats = new GraphQLObjectType({
  name: 'HeroStats',
  fields: {
    name: { type: GraphQLString },
    HeroSpecific: { type: HeroSpecific },
    Combat: { type: Combat },
    Assists: { type: Assists },
    Best: { type: Best },
    Average: { type: Average },
    Deaths: { type: GraphQLInt },
    MatchAwards: { type: MatchAwards },
    Game: { type: Game },
    Miscelaneous: { type: Miscelaneous },
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