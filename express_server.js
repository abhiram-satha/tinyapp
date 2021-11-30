const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  
}

const generateRandomString = function(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYXabcdefghijklmnopqrstuvwxyz0123456789';

  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
//Received function from https://www.programiz.com/javascript/examples/generate-random-strings

app.post('/register', (req, res)=> {
  const generateID = generateRandomString(4);
  users[generateID]= {};
  users[generateID]['id'] = generateID;
  users[generateID]['email'] = req.body['email'];
  users[generateID]['password'] = req.body['password'];

  res.cookie('user_id', users[generateID]['id']).redirect('/urls')
})

app.get('/urls', (req, res) => {
  const cookieValue = req.cookies['user_id'];
  const templateVars = {username: users[cookieValue], urls: urlDatabase}; 

  res.render('urls_index', templateVars);
  
});

app.get('/urls/new', (req, res) => {
  const cookieValue = req.cookies['user_id'];
  const templateVars = {username: users[cookieValue]}; 

  res.render('urls_new', templateVars);
});

//Creating a registration page
app.get('/register', (req, res) => {
  const templateVars = {username: req.cookies['user_id']};
  res.render('./registration', templateVars);
})



app.post('/urls', (req, res)=> {
  const randomString = generateRandomString(6);
  const longURL = Object.values(req.body);

  urlDatabase[randomString] = longURL[0];
  console.log(Object.values(req.body));
  res.redirect(`/urls/${randomString}`);
});

//Sends the users allowing them to edit the longURL 
app.get('/urls/:shortURL', (req, res) => {
  const cookieValue = req.cookies['user_id'];
  const templateVars = {username: users[cookieValue], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  //console.log(req.cookies['username']);
  res.render('urls_show', templateVars);
});

//Sends the user to a blank website that says hello
app.get('/', (req, res) => {
  res.send('Hello!');
});

//redirects the user to the website
app.get('/u/:shortURL', (req, res)=> {
  res.redirect(urlDatabase[req.params.shortURL]);
});

//POST Route to remove a URL resource
app.post('/urls/:shortURL/delete', (req, res)=> {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//Able to edit the long URL
app.post('/urls/:id', (req, res)=> {
  const shortURL = req.params.id;
  const longURL = Object.values(req.body);
  urlDatabase[shortURL] = longURL[0];
  res.redirect('/urls');
});

//To log the user out
app.post('/logout', (req,res)=> {
  res.clearCookie('user_id').redirect('/urls');
});

//To login
app.post('/login', (req, res)=> {
  res.cookie('username', req.cookies['user_id']).redirect('/urls');
});

//provide the urlDatabase in a JSON format
app.get('/urls.json', (req, res)=> {
  res.json(urlDatabase);
});

//Sends the user to a URL where they see Hello World in HTML formatting
app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, ()=> {
  console.log(`Example app listening on port, ${PORT}`);
});
