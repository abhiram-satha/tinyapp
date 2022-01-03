const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
const {objectLoop, generateRandomString, } = require('./helpers');
app.use(cookieSession({
  name: "session",
  keys: ['key1'],

}));


const loginLoop = function(objectToLoop, email, password){
  for (const key in objectToLoop) {
    if (objectToLoop[key]["email"] === email) {
      if (bcrypt.compareSync(password, objectToLoop[key]["password"])) {
        return false;
      }
    }
  }
  return true;
};

const urlDatabase = {
  'b2xVn2': { longURL: "http://www.lighthouselabs.ca", userID: "" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "" },
};

//Creating an empty users object to create a users database
const users = {};



//The register page that populates the users object with information about the account
app.post("/register", (req, res) => {
  if (!req.body["email"] || !req.body["password"]) {
    res.status(400).send("Registration form is incomplete");   
    return;
  }
  const loopUserObject = objectLoop(users, req.body["email"]);
  if (loopUserObject) {
    res.status(400).send("This email address is already registered");
    return;
  }
  const generateID = generateRandomString(4);
  const password = req.body["password"];

  const newUser = {
    id:  generateID,
    email: req.body["email"],
    password: bcrypt.hashSync(password, 10)
  }
  users[generateID] = newUser;
  
  req.session.user_id = req.body["email"];
  req.body.cookie = req.session.user_id;
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Please register or login to view this page");
  }
  let urlDatabaseUpdated = {};
  for (const user in users) {
    if (users[user]["email"] === req.session.user_id) {
      for (const urlID in urlDatabase) {
        if (urlDatabase[urlID]["userID"] === users[user]["id"])
          urlDatabaseUpdated[urlID] = urlDatabase[urlID]["longURL"];
      }
    }
  }
 
  const templateVars = {
    user_id: req.session.user_id,
    urls: urlDatabaseUpdated,
  };


  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: req.session.user_id };

  res.render("urls_new", templateVars);
});

//Creating a registration page
app.get("/register", (req, res) => {
  const templateVars = { user_id: req.session.user_id };
  res.render("./registration", templateVars);
});


app.post("/login", (req, res) => {
  const loginCredentials = loginLoop(
    users,
    req.body["email"],
    req.body["password"]
  );
  if (loginCredentials) {
    res.status(404).send("Login failed").clearCookie("user_id");
    return;
  }
  req.session.user_id = req.body["email"];
  res.redirect("/urls");
});

//Creating a Login Page
app.get("/login", (req, res) => {
  const templateVars = { user_id: req.session.user_id };
  res.render("./login", templateVars);
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString(6);
  const longURL = req.body["longURL"];
  const userEmail = req.session.user_id;
  for (const userID in users) {
    if (req.session.user_id === users[userID]["email"]) {
      urlDatabase[randomString] = { longURL, userID, userEmail};
    }
  }

  res.redirect(`/urls/${randomString}`);
});

const findUser = (email) => {
  let foundUser = {};
  for (let user in users) {
    if (users[user].email === email) {
      foundUser = users[user];
      //console.log(foundUser);
      break;
    }
  }
  return foundUser;
};

const findUrlOfUser = (urlId, email) => {
  const user = findUser(email);
  const url = urlDatabase[urlId];
  if (user.id && url && url.userID === user.id) {
    return url;
  } else {
     const url = urlDatabase[urlId];
     return url;
  }
};

let counter = {};

//Sends the users allowing them to edit the longURL
app.get("/urls/:shortURL", (req, res) => {

  if (!counter[req.params.shortURL]) {
    counter[req.params.shortURL] = 1;
  } else{
    counter[req.params.shortURL] += 1;
  }
  const url = findUrlOfUser(req.params.shortURL, req.session.user_id);

  let templateVars = {};
  if (!req.session.user_id) {
    return res.redirect("/error");
  }
  else if (req.session.user_id === urlDatabase[req.params.shortURL]['userEmail']) {    
    templateVars = {
      user_id: req.session.user_id,
      shortURL: req.params.shortURL,
      longURL: url.longURL,
      message: null,
      counterURL: counter[req.params.shortURL],
    };
    return res.render("urls_show", templateVars);
  } else if (req.session.user_id !== urlDatabase[req.params.shortURL]['userEmail']) {
    console.log('url.userID', url.userID);
    console.log('urldatabase', urlDatabase[req.params.shortURL]['userID']);
    templateVars = {
      user_id: req.session.user_id,
      shortURL: req.params.shortURL,
      longURL: url.longURL,
      message: "You are not the original creator of this link!",
      counterURL: counter[req.params.shortURL],
    };
    return res.render("urls_show", templateVars);
  } 
  
});

//Sends the user to a blank website that says hello
app.get("/error", (req, res) => {
  res.send("You do not have permission to view this page, please login");
});


//Sends the user to a blank website that says hello
app.get("/", (req, res) => {
  res.redirect("/login");
});

//redirects the user to the website
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]["longURL"]) {
    return res.send('Please include the full URL with http://')
  }
  res.redirect(urlDatabase[req.params.shortURL]["longURL"]);
});

//POST Route to remove a URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/error");
  }
  const url = findUrlOfUser(req.params.shortURL, req.session.user_id);
  console.log('it is[',req.session.user_id)
  if (url.userID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  }
  else {
    res.send('You do not have authorization to delete')
  };
});

//Able to edit the long URL
app.post("/urls/:id", (req, res) => {
  const url = findUrlOfUser(req.params.id, req.session.user_id);
  if (url.userID) {
    urlDatabase[req.params.id]["longURL"] = req.body["longURL"];
    res.redirect("/urls");
  }
  else {
    res.send('You do not have authorization to edit');
  }
});

//To log the user out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

//provide the urlDatabase in a JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Sends the user to a URL where they see Hello World in HTML formatting
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port, ${PORT}`);
});
