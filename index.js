const { ApolloServer } = require('@apollo/server');
const{ startStandaloneServer } = require('@apollo/server/standalone');
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI= process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('connected to: ', MONGODB_URI);
    }).catch((err) => {
        console.err(err.message);
    })


const typeDefs = `
    type User {
        username: String!
        email: String!
        password: String!
        id: ID!
    }
    
    type Token {
        value: String!
    }

    type Query {
        me: User!
    }
    
    type Mutation {
        createUser(
            username: String!
            email: String!
            password: String!
        ): User
        login(
            username: String!
            password: String!
        ): Token
    }`

const resolvers = {
    Query: {
        me: () => 
    }
}

const server = ApolloServer({
    typeDefs,
    resolvers
})

startStandaloneServer(server, {
    listen: {port: 4000 },
}).then(({ url }) => {
    console.log(`Server ready at ${url}`)
})