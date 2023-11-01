const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const ejs = require('ejs');
const User = require('./model/user.js');
const AuthRoute = require('./routes/auth.js');
const dotenv = require('dotenv');
dotenv.config();
const mongo_user = process.env.MONGO_USER;
const mongo_pass = process.env.MONGO_PASS;
const mongoURL = `mongodb+srv://${mongo_user}:${mongo_pass}@cluster0.sgjxjjr.mongodb.net/`;

const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));


mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
.then(() => {
    console.log("Connected to MongoDB Atlas");
})
.catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
});

// const { Schema } = mongoose;

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        // validate: [{ validator: value => isEmail(value), msg: 'Invalid email.' }]
    },
    password: {
        type: String,
        required: true,
        // validate: [{ validator: value => isPassword(value), msg: 'Invalid Password.' }]
    },
});

const user = mongoose.model("user", userSchema);

app.use(bodyParser.json());

app.get("/",(req,res) => {
  res.render("index.ejs");
});

app.get("/register", (req,res) => {
  res.render("index.ejs");
});

app.get("/login", (req,res) => {
  res.render("login.ejs");
})

app.post('/register', async (req, res) => {

  bcrypt.hash(req.body.password,10,function(err,hashedPass){
    if(err){
      res.json({
        error: err,
      })
    }
  })

  let user = new User({
    email: req.body.email,
    password : hashedPass,
  })
  user.save()
  .then(user => {
    res.json({
      message: "User Added Successfully...!"
    })
  })
  .catch(error => {
    res.json({
      message: "An Error occured"
    })
  })

  module.export = register

  res.render("login.ejs");

});

app.post('/login', async (req, res) => {

  res.render("login.ejs");
    
  try {
      
    const email = req.body.user_email;
    const password = req.body.user_password;

    const user_find = await user.findOne({ email });

    if (!user_find) {
      return res.status(404).send('User not found');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      res.status(200).send('Login successful');
    } else {
    res.status(401).send('Authentication failed');
    }
  } catch (error) {
      console.error(error);
      res.status(500).send('Error during login');
  }

  res.send("Login Successfully");
});
  

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})