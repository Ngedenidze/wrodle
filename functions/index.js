const express = require("express");
const {MongoClient} = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// init app and db
const app = express();
// init database url

const user = functions.config().myenv.db_user;
const password = functions.config().myenv.db_password;
const secretKey = functions.config().myenv.secret_key;
const DB_URL = functions.config().myenv.db_url;

const url = `mongodb+srv://${user}:${password}${DB_URL}?retryWrites=true&w=majority`;

// firebase admin init
admin.initializeApp();

// Connect to the database
const getDatabase = async () => {
  try {
    const client = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    return client.db("logininfo");
  } catch (error) {
    console.error(error);
  }
};

// enable static routing to "./public" folder
app.use(express.static("public"));
// cors init
app.use(cors({origin: true}));
app.options("*", cors());

// automatically decode all requests from JSON
// and encode all responses into JSON
app.use(express.json());

// information route
app.post("/information", requireAuth, async (req, res) => {
  try {
    // get user information(username)
    const db = await getDatabase();
    const doc = await db.collection("users").
        findOne({username: req.body.username});
    // error checking - 404
    if (!doc) {
      return res.status(404).send({error: "Username not found."});
    } res.send({user: doc.user, username: doc.username, email: doc.email});
  } catch (error) {
    return res.send({error});
  }
});

// create route to get user record (POST /users/:auth)
//     if record is found, send information
app.get("/users/:auth", async (req, res) => {
  try {
    const token = req.params.auth;
    const decodedToken = jwt.verify(token, secretKey);
    // after token authentication get username
    const db = await getDatabase();
    const doc = await db.collection("users").
        findOne({username: decodedToken.username});

    if (!doc) {
      return res.status(404).send({error: "User not found."});
    }
    // send info
    res.send({auth: doc.auth, user: doc.name, username: doc.username});
  } catch (error) {
    res.status(302).redirect("/index.html");
  }
});

// route to POST /login upon user clicking loginBtn
app.post("/login", async (req, res) => {
  // get user information(username)
  const db = await getDatabase();
  const doc = await db.collection("users").
      findOne({username: req.body.username});
  // error checking - 404
  if (!doc) {
    return res.status(404).send({error: "Username not found."});
  }

  // compare hash password
  const enteredPassword = req.body.password;
  const passwordMatches = bcrypt.compareSync(enteredPassword, doc.password);

  // error checking - 401
  if (!passwordMatches) {
    return res.status(401).send({error: "Incorrect password."});
  } else {
    // authenticate with token
    const authenticationToken = jwt.sign({username: req.body.username},
        secretKey);
    await db.collection("users").updateOne({username: req.body.username}, {
      // update the token
      $set: {auth: authenticationToken},
    });
    // send token on res with updated user information
    res.send({
      auth: authenticationToken,
      user: doc.user, username: doc.username,
    });
  }
});

// create route to register user (POST /users)
//   ensure all fields (username, password, email, name) are specified; if not,
//  send {error:"Missing fields."}
//   use findOne to check if username already exists in db
//     if username exists, send {error:"Username already exists."}
//     otherwise,
//       use bcrypt to hash the password
//       use insertOne to add document to database
//       if all goes well, send returned document
//   use .catch(error=>res.send({error})) to catch and send other errors
app.post("/users", async (req, res) => {
  const {username, password, email, name} = req.body;

  if (!username || !password || !email || !name) {
    return res.status(400).json({error: "Missing fields."});
  }

  try {
    const db = await getDatabase();
    console.log(db);
    const doc = await db.collection("users").
        findOne({username: req.body.username});
    if (doc) {
      res.status(409).send({error: "Username already exists."});
    } else {
      const hashedPassword = await bcrypt.hash(password, 2);
      const authenticationToken = jwt.sign({username}, secretKey);

      const user = {
        username,
        password: hashedPassword,
        email,
        name,
        auth: authenticationToken,
      };
      const result = await db.collection("users").
          insertOne(user);
      console.log(result);

      if (result && result.insertedId) {
        res.send(user);
      } else {
        throw new Error("Insert operation returned an unexpected result");
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({error: error.toString()});
  }
});


// Logout
// TODO: do it with delete

app.delete("/logout/:username", async (req, res) => {
  const {username} = req.params;
  const db = await getDatabase();
  const doc = await db.collection("users").findOne({username});

  // error checking
  if (!doc) {
    return res.status(404).send({error: "User not found."});
  }

  // update the user"s record to remove the authentication token.
  await db.collection("users").updateOne({username}, {$unset: {auth: ""}});

  // send a success message
  res.status(200).send({message: "Logged out successfully."});
});

// create route to update user doc (PATCH /users/:username)
//   use updateOne to update document in database
//     updateOne resolves to 0 if no records were updated,
//  or 1 if record was updated
//     if 0 records were updated, send {error:"Something went wrong."}
//     otherwise, send {ok:true}
//   use .catch(error=>res.send({error})) to catch and send other errors
app.patch("/users/:username", async (req, res) => {
  const {username} = req.params;
  const updateData = {...req.body};
  delete updateData.username;

  const db = await getDatabase();
  let doc = await db.collection("users").findOne({username});
  // error checking - 404
  if (!doc) {
    return res.status(404).send({error: "User not found."});
  }
  // authenticate with token
  jwt.verify(doc.auth, secretKey, (err, user) => {
    // error checking - 403
    if (err) {
      return res.status(403).send({error: "Invalid authentication token."});
    }

    // update method
    db.collection("users").updateOne(
        {username}, // find doc with given :username
        {$set: updateData}, // update it with new data
    ).then(async (result) => {
      if (result.matchedCount == 0) {
        res.status(400).send({error: "Something went wrong."});
      } else {
        doc = await db.collection("users").
            findOne({username});
        res.send({ok: true, name: doc.name});
      }
    })
        .catch((error) => res.send({error: error.message}));
  });
});

// create route to delete user doc (DELETE /users/:username)
//   use deleteOne to update document in database
//   deleteOne resolves to 0 if no records were deleted,
// or 1 if record was deleted
//   if 0 records were deleted, send {error:"Something went wrong."}
//    otherwise, send {ok:true}
//   use .catch(error=>res.send({error})) to catch and send other errors
app.delete("/users/:username", async (req, res) => {
  const {username} = req.params;
  const db = await getDatabase();
  const doc = await db.collection("users").findOne({username});

  if (!doc) {
    return res.status(404).send({error: "User not found."});
  }

  // authentication with token
  // assuming the token is sent in the Authorization header as a Bearer token
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).send({error: "Invalid authentication token."});
    }

    db.collection("users").deleteOne({username})
        .then((result) => {
          if (result.deletedCount == 0) {
            res.status(400).send({error: "Could not delete user."});
          } else {
            res.send({ok: true});
          }
        })
        .catch((error) => (res.send({error})));
  });
});

/**
 * Checking if user is authenticated
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @return {undefined} Express HTTP response with status code
 * 401 if user is not authenticated.
 */
function requireAuth(req, res, next) {
  // check with header bearer token
  const authHeader = req.headers.authorization;
  // check if authorization header is missing
  if (!authHeader) {
    return res.status(401).send("Unauthorized");
  }
  // only token
  const token = authHeader.split(" ")[1];

  try {
    // verify the token
    const verifying = jwt.verify(token, secretKey);
    // storing
    req.user = verifying;
    next();
  } catch (err) {
    res.status(401).send("Unauthorized");
  }
}

// default route
app.all("*", (req, res) => {
  res.status(404).send("Invalid URL.");
});

// start server
// app.listen(process.env.PORT || 3000, () =>
// console.log(`Server started on ${process.env.PORT || 3000}`));

exports.function = functions.https.onRequest(app);
