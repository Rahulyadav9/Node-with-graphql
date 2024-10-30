const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "mySEcretKey78";

// Mock data
const data = [
    { id: 1, name: "Rahul", age: 23, lastname: "Yadav", contact: 83748293783, email: "rj@gmail.com" },
    { id: 2, name: "Ram", age: 25, lastname: "Yadu1c", contact: 9238764398, email: "rjk@gmail.com" },
    { id: 3, name: "Shyam", age: 26, lastname: "Yad", contact: 463882837, email: "rkk@gmail.com" },
    { id: 4, name: "Kanah", age: 27, lastname: "Y", contact: 9283743782, email: "kk@gmail.com" },
    { id: 5, name: "Mohan", age: 28, lastname: "Yadv", contact: 19283743774, email: "jkk@gmail.com" }
];
const users = [{ id: 1, username: "admin", password: bcrypt.hashSync("password", 10), role: "admin" }];

// GraphQL type definitions
const typeDefs = gql`
    type Student {
        id: ID!
        name: String
        age: Int
        lastname: String
        contact: Float
        email: String
    }

    type Query {
        students: [Student]
        getStudent(id: ID!): Student
    }

    type Mutation {
        login(username: String!, password: String!): String
    }
`;

// Resolvers
const resolvers = {
    Query: {
        students: () => data,
        getStudent: (_, { id }, context) => {
            if (!context.user || context.user.role !== "admin") {
                throw new Error("Unauthorized access");
            }
            return data.find(student => student.id === parseInt(id));
        }
    },
    Mutation: {
        login: async (_, { username, password }) => {
            const user = users.find(u => u.username === username);
            if (!user || !(await bcrypt.compare(password, user.password))) {
                throw new Error("Invalid credentials");
            }
            return jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
        }
    }
};

// Middleware for JWT authentication
const middleware = (req) => {
    const token = req.headers.authorization || "";
    if (token) {
        try {
            req.user = jwt.verify(token, SECRET_KEY);
        } catch (error) {
            throw new Error("Token validation failed");
        }
    }
};

// Create and start the server
const createServer = async () => {
    const app = express();
    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            middleware(req);
            return { user: req.user };
        }
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log(`Server running at http://localhost:4000${apolloServer.graphqlPath}`);
    });
};

createServer();
