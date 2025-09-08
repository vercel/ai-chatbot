import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `#graphql
  type Query {
    health: String!
  }
`;

const resolvers = {
  Query: {
    health: () => 'ok',
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, { listen: { port: 4000 } }).then(({ url }) => {
  console.log(`GraphQL API server ready at ${url}`);
});
