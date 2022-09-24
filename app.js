require("dotenv").config();
require("express-async-errors");


//extra security packages
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');

const express = require("express");
const expressLayouts = require('express-ejs-layouts');
const app = express();
app.use(expressLayouts)

//session and passport
const session = require("express-session");
// const passport = require("passport");
// const passport_init = require("./passport/passport_init");

//connectDB
const {connectDB, storeDB} = require('./db/connect')

// //middleware
const { authenticateUser, setCurrentUser } = require("./middleware/authentication");

// //routers
// const eventRouter = require('./routes/events');
const authRouter = require("./routes/auth");

// //error handler
// // const errorHandlerMiddleware = require("./middleware/error-handler");
const notFoundMiddleware = require("./middleware/not-found");


//connect to views
app.set("view engine", "ejs");

//use the security packages
app.set('trust proxy', 1);
app.use(
  rateLimiter({
    windowMs: 60 * 1000, // 15 minutes
    max: 60, // each IP is limited to make 100 requests per windowMs
  })
)
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

//Use files from public folder
app.use(express.static('public'))

// Express body parser
app.use(express.urlencoded({ extended: true }));

//save the session in mongo
//validate env variables
const requiredEnvVars = ['SESSION_SECRET', 'MONGO_URI'];
requiredEnvVars.forEach((item) => {
  if (process.env[item] === undefined) { 
   throw new Error(`Required environment variable ${item} is missing`);
 }
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: storeDB(process.env.MONGO_URI),
  })
);

// passport_init();
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(express.urlencoded({ extended: false }));
app.use(setCurrentUser);


// //routes
app.use("/", authRouter)
app.use("/api/v1/auth", authRouter);
// app.use("/api/v1/events", authenticateUser, eventRouter);

app.use(notFoundMiddleware);
// // app.use(errorHandlerMiddleware);

const port = process.env.port || 3000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log("mongo connection error:- ", error);
  }
};

start();