const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
// const User = require('./model/user.js');
const Products = require('./model/product.js');
const Counter = require('./model/counter.js');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const dotenv = require('dotenv');
dotenv.config();
const mongo_user = process.env.MONGO_USER;
const mongo_pass = process.env.MONGO_PASS;
const mongoURL = `mongodb+srv://${mongo_user}:${mongo_pass}@cluster0.sgjxjjr.mongodb.net/`;

const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(session({
    secret: `${process.env.SECRET}`,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

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

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req,res) => {
    res.render("index.ejs");
});
app.get("/login", (req,res) => {
    res.render("login.ejs");
});
app.get('/dashboard', (req, res) => {
      res.render("dashboard.ejs");
});

app.get("/add", (req,res) => {
  res.render("add.ejs");
});

app.get('/get_data', async (req, res) => {
  if(req.isAuthenticated()){ 
    try {
      const db = await Products();
      
      const count = await Products.countDocuments();
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
  
      const today = await Products.find({ "createdAt": { $gt: currentDate } })
      var productData = {};
        
      today.forEach((item) => {
        const createdAtDate = new Date(item.createdAt).toLocaleDateString();
        const count = productData[createdAtDate] ? productData[createdAtDate] : 0;
        productData[createdAtDate] = count + 1;
      });
      const todayCount = today.length;
      const recent = await Products.find().sort({ createdAt: -1 }).limit(10);
      console.log(productData);
  
      const data = await Products.find();
      
      res.render('dashboard', { count, todayCount, recent });
      
    } catch (error) {
      console.error('Error retrieving data:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect("/login");
  }
});

//route for getting data from mongodb to view all items
app.get("/get_data/data", async(req,res) => {
  if(req.isAuthenticated()){
    try{
      const db = await Products();
      const data = await Products.find().sort({ createdAt: -1 });
    
      res.render("data", {data});
    } catch(err){
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
});

//serach / retrieve data request for both dashboard and view all items pages
app.get('/get_data/:data?/search', async (req, res) => {
  const query = req.query.search;

  try {
    const results = await Products.find({
      $or: [
        { product_name: { $regex: new RegExp(query, 'i') } },
        { product_key: { $regex: new RegExp(query, 'i') } },
        { department: { $regex: new RegExp(query, 'i') } },
        { category: { $regex: new RegExp(query, 'i') } },
        { sub_category: { $regex: new RegExp(query, 'i') } },
        { specification: { $regex: new RegExp(query, 'i') } }
      ]
    });

    console.log(results);
    res.render('data', { results });
  } catch (error) {
    console.error('Error searching in MongoDB:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/logout", (req,res) => {
  req.logout(err => {
    if(err){
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

// SignUp route
app.post('/register', async (req, res) => {

  User.register({username: req.body.username}, req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req,res, function(err){
      if(err){
        console.log(err);
        return res.status(500).send("Internal Server Error");
      } else {
        res.redirect("/get_data");
      }
      });
    }
  });
});

// Login route
app.post('/login', async (req, res) => {
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user, function(err){
    if(err){
        console.log(err);
    } else {
      passport.authenticate("local")(req,res, function(err){
        if(err){
          console.log(err);
        } else {
          res.redirect("/get_data");
        }
      });
    }
  })
});

//function for product key generation
function generateFormattedDate() {
  const currentDate = new Date();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const year = currentDate.getFullYear();
  return `${month}${year}`;
}

//Add items route
app.post("/submit", async(req, res) => {
  try {
    let product_name = req.body.sub_category;
    let department = req.body.department;
    let category = req.body.category;
    let specification = req.body.specification;
    
    const formattedDate = generateFormattedDate();
    let counter = await Counter.findOne({ _id: `counters_${formattedDate}` });

    if (!counter) {
      // If the counter document does not exist, create it
      counter = new Counter({ _id: `counters_${formattedDate}`, sequence_value: 1 });
    } else {
      // If the counter document exists, update the sequence_value
      counter.sequence_value += 1;
    }

    const product_key = `${formattedDate}${counter.sequence_value.toString().padStart(8, '0')}`;

    await counter.save();

    // console.log(product_name,product_key,department,category,specification);

    const newProduct = new Products({
        product_name,
        product_key,
        department,
        category,
        specification
    });

    await newProduct.save();
    console.log("Form submitted:", newProduct);
    res.render("success.ejs");
    // res.json({ message: "Form submitted successfully" });

  } catch (err) {
      console.error("Error saving to MongoDB:", err);
      res.render("failure.ejs");
      // res.status(500).json({ error: "An error occurred" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});