require('dotenv').config();

const { ApolloServer } = require('@apollo/server');
const{ startStandaloneServer } = require('@apollo/server/standalone');

const mongoose = require('mongoose');
const User = require('./models/User');
const { GraphQLError } = require('graphql');
const MONGODB_URI= process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('connected to: ', MONGODB_URI);
    }).catch((err) => {
        console.log(err.message);
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
        register(
            username: String!
            email: String!
            password: String!
        ): User
        login(
            username: String!
            password: String!
        ): Token
    }`


const bcrpyt = require('bcrypt');
const jwt = require('jsonwebtoken');

const resolvers = {
    Query: {
        me: (root, args, context) => {
            return context.currentUser;
        }
    },
    Mutation: {
        register: async (root, args) => {

            const passwordHash = await bcrpyt.hash(args.password, 10);
            const user = new User({
                username: args.username,
                email: args.email,
                password: passwordHash
            })

        return await user.save()
            .catch(err => {
                throw new GraphQLError('Creating user failed', {
                    extensions:{
                        code: 'BAD_USER_INPUT',
                        err
                    }
                })
            })
        },
        login: async (root, args) => {
            const user = await User.findOne({ username: args.username});

            if(!user) {
                throw new GraphQLError('User not found', {
                    extensions: {
                        code: 'BAD_USER_INPUT'
                    }
                })
            }
            
            //Check whether the given password is valid
            const isValid = await bcrpyt.compare(args.password, user.password);

            if(!isValid) {
                throw new GraphQLError('Incorrect password', {
                    extensions: {
                        code: 'BAD_USER_INPUT'
                    }
                })
            }

            //Sign in the user and return a web token
            const userForToken = {
                username: user.username,
                email: user.email,
                id: user._id
            }

            //Create token with jsonwebtoken library
            return({ value: jwt.sign(userForToken, process.env.SECRET)});
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
})

//
startStandaloneServer(server, {
    listen: {port: 4000 },
    context: async ({ req, res}) => {
        const auth = req ? req.headers.authorization : null;
        if(auth && auth.startsWith('Bearer ')) {
            const decodedToken = jwt.verify(
                auth.substring(7), process.env.SECRET
            )
            const currentUser = await User.findById(decodedToken.id);
            return { currentUser }
        }
    }
}).then(({ url }) => {
    console.log(`Server ready at ${url}`)
})