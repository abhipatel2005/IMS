const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./model/user.js');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();
const mongo_user = process.env.MONGO_USER;
const mongo_pass = process.env.MONGO_PASS;
const mongoURL = `mongodb+srv://${mongo_user}:${mongo_pass}@cluster0.sgjxjjr.mongodb.net/`;

const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("Connected to MongoDB Atlas");
})
.catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
});

app.get("/", (req,res) => {
    res.render("index.ejs");
});
app.get("/login", (req,res) => {
    res.render("login.ejs");
});
app.get("/dashboard", (req,res) => {
  res.render("dashboard.ejs");
});

// Signup route
app.post('/register', async (req, res) => {

  const email  = req.body.email;
  const password = req.body.password;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    const user = new User({ email, password });
    await user.save();
    res.json({ message: 'User created successfully' });
    // res.render("login.ejs");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Login route
app.post('/login', async (req, res) => {

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid Password' });
    }
    
    res.json({ message: 'User logged /in successfully' });
    // res.redirect("/login/dashboard.ejs");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
