const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession =require('cookie-session')
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(cookieSession( {
  name: "session",
  keys: ['key1'],

}))

const urlDatabase = {
  'b2xVn2': { longURL: "http://www.lighthouselabs.ca", userID: "" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "" },
};

//Creating an empty users object to create a users database
const users = {};

let userURLDatabase = {};

const generateRandomString = function (length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYXabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
//Received function from https://www.programiz.com/javascript/examples/generate-random-strings

const objectLoop = function (objectToLoop, email) {
  for (const key in objectToLoop) {
    if (objectToLoop[key]["email"] === email) {
      console.log(objectToLoop[key]["email"]);
      console.log(email);
      return false;
    }
  }
  return true;
};

const loginLoop = function (objectToLoop, email, password) {
  for (const key in objectToLoop) {
    if (objectToLoop[key]["email"] === email) {
      console.log(bcrypt.hashSync(password, 10))
      if (bcrypt.compareSync(password, objectToLoop[key]["password"]))
        // objectToLoop[key]["password"] === password)
         {
        console.log(users);
        return false;
      }
    }
  }
  return true;
};

// const urlsForUser = function (id) {
//   const userCreatedUrls = {};
//   for (const user in users) {
//     if (id[user]["email"] === req.cookies["user_id"]) {
//       for (const urlID in urlDatabase) {
//         if (urlDatabase[urlID]["userID"] === id) {
//           urlsForUser[urlDatabase][urlID]["userID"] =
//             urlDatabase[urlID]["longURL"];
//         }
//       }
//     }
//   }
//   return userCreatedUrls;
// };

//console.log(urlsForUser(users));

app.post("/register", (req, res) => {
  if (!req.body["email"] || !req.body["password"]) {
    res.status(400).send("Registration form is incomplete");
    return;
  }
  const loopUserObject = objectLoop(users, req.body["email"]);
  if (!loopUserObject) {
    res.status(400).send("This email address is already registered");
    return;
  }
  const generateID = generateRandomString(4);
  users[generateID] = {};
  users[generateID]["id"] = generateID;
  users[generateID]["email"] = req.body["email"];
  const password = req.body["password"]
  users[generateID]["password"] = bcrypt.hashSync(password, 10);  
  console.log('registering users', users);
  req.session.user_id = req.body["email"]
  req.body.cookie = req.session.user_id;
  console.log(req.session.user_id)
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
    console.log('cookie', req.session.user_id)
  if (!req.session.user_id) {
    return res.send("Please register or login to view this page");
  }
  let urlDatabaseUpdated = {};
  //console.log(users);
  for (const user in users) {
    if (users[user]["email"] === req.session.user_id) {
      for (const urlID in urlDatabase) {
        if (urlDatabase[urlID]["userID"] === users[user]["id"])
          urlDatabaseUpdated[urlID] = urlDatabase[urlID]["longURL"];
        // userURLDatabase[urlDatabase[urlID]] = [urlDatabase[urlID]]['longURL']
      }
    }
  }
  //console.log('user stuff',userURLDatabase);
  const cookieValue = req.session.user_id;
  const templateVars = {
    user_id: req.session.user_id,
    urls: urlDatabaseUpdated,
  };

  console.log('varss::::::::', templateVars)

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const cookieValue = req.session.user_id;
  const templateVars = { user_id: req.session.user_id };

  res.render("urls_new", templateVars);
});

//Creating a registration page
app.get("/register", (req, res) => {
  const templateVars = { user_id: req.session.user_id };
  res.render("./registration", templateVars);
});


app.post("/login", (req, res) => {
  // if (req.cookies['user_id']) {
  //   res.cookie('user_id', req.cookies['user_id']).redirect('/urls');
  //   return
  // }
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
  //const userID = users;
  for (const userID in users) {
    if (req.session.user_id === users[userID]["email"]) {
      urlDatabase[randomString] = { longURL, userID };
    }
  }

  res.redirect(`/urls/${randomString}`);
});

const findUser = (email) => {
  let foundUser = {};
  console.log("desiredemail", email);
  for (let user in users) {
    if (users[user].email === email) {
      foundUser = users[user];
      break;
    }
  }
  return foundUser;
};

const findUrlOfUser = (urlId, email) => {
  const user = findUser(email);
  console.log("user", user, users);
  const url = urlDatabase[urlId];
  console.log("urlAgain::", url);
  if (user.id && url && url.userID === user.id) {
    return url;
  } else {
    return {};
  }
};

//Sends the users allowing them to edit the longURL
app.get("/urls/:shortURL", (req, res) => {
  const url = findUrlOfUser(req.params.shortURL, req.session.user_id);
  console.log("urlFirst", url, urlDatabase);
  let templateVars = {};
  if (url.userID) {
    templateVars = {
      user_id: req.session.user_id,
      shortURL: req.params.shortURL,
      longURL: url.longURL,
      message: null,
    };
    return res.render("urls_show", templateVars);
  } else {
    templateVars = {
      user_id: req.session.user_id,
      shortURL: req.params.shortURL,
      longURL: url.longURL,
      message: "You are not the original creator of this link!",
    };
  }
  return res.render("urls_show", templateVars);
  // const userIDlongerURL = {};
  // for (const user in users) {
  //   if (users[user]["email"] === req.cookies["user_id"]) {
  //     for (const urlID in urlDatabase) {
  //       if (urlDatabase[urlID]["userID"] === users[user]["id"]) {
  //         //userIDlongerURL[urlDatabase[urlID]['userID']] = urlDatabase[urlID]['longURL'];
  //         console.log(users[user]["id"]);
  //         console.log(urlDatabase[urlID]["userID"]);
  //         console.log("heelo");
  //         const templateVars = {
  //           user_id: req.cookies["user_id"],
  //           shortURL: req.params.shortURL,
  //           longURL: urlDatabase[req.params.shortURL]["longURL"],
  //           message: null,
  //         };
  //         return res.render("urls_show", templateVars);
  //       }
  //     }
  //   }
  // }
  // console.log("this is line 187");
  // const message1 = "You are not the original creator of this link!";
  // const cookieValue = req.cookies["user_id"];
  // const templateVars = {
  //   user_id: req.cookies["user_id"],
  //   shortURL: req.params.shortURL,
  //   longURL: urlDatabase[req.params.shortURL]["longURL"],
  //   message: message1,
  // };
  // return res.render("urls_show", templateVars);
});

//Sends the user to a blank website that says hello
app.get("/", (req, res) => {
  res.send("Hello!");
});

//redirects the user to the website
app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]["longURL"]) {
    return res.send('Please include the full URL with http://')
  }
  res.redirect(urlDatabase[req.params.shortURL]["longURL"]);
});

//POST Route to remove a URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  const url = findUrlOfUser(req.params.shortURL, req.session.user_id);
  if (url.userID) {
    const a = delete urlDatabase[req.params.shortURL];
    console.log("a", a, urlDatabase);
    return res.redirect("/urls");
  }
  else {
    res.send('You do not have authorization to delete')
  }
  // for (const user in users) {
  //   if (users[user]["email"] === req.cookies["user_id"]) {
  //     for (const urlID in urlDatabase) {
  //       if (urlDatabase[urlID]["userID"] === users[user]["id"]) {
  //         console.log(urlDatabase[urlID]["userID"]);
  //         delete urlDatabase[req.params.shortURL];
  //         res.redirect("/urls");
  //       }
  //     }
  //   }
  // }
});

//Able to edit the long URL
app.post("/urls/:id", (req, res) => {
  console.log('url:::::::::::::::', urlDatabase[req.params.id]["userID"], req.session.user_id)
  const url = findUrlOfUser(req.params.id, req.session.user_id);
  if (url.userID) {
    urlDatabase[req.params.id]["longURL"] = req.body["longURL"];
    res.redirect("/urls");
  }
  else {
    res.send('You do not have authorization to edit')
  }
});

//To log the user out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
  //res.clearCookie("user_id").redirect("/urls");
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
