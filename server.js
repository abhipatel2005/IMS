const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./model/user.js');
const Products = require('./model/product.js');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
// const ejs = require("ejs");
dotenv.config();
const mongo_user = process.env.MONGO_USER;
const mongo_pass = process.env.MONGO_PASS;
const mongoURL = `mongodb+srv://${mongo_user}:${mongo_pass}@cluster0.sgjxjjr.mongodb.net/`;

const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
// we will add the status of the product soon for now i have described there some specification about the product
// we will also add the recent employee who place the order soon in the column of recent customers

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
// app.get('/dashboard', (req, res) => {
//       res.render("dashboard.ejs");
// });

app.get("/add", (req,res) => {
  res.render("add.ejs");
});
app.get("/get_data/data", async(req,res) => {

  const db = await Products();
  const data = await Products.find().sort({ createdAt: -1 });

  res.render("data", {data});
});

app.post("/submit", async(req, res) => {
  try {
      let product_name = req.body.product_name;
      let product_key = req.body.product_key;
      let department = req.body.department;
      let category = req.body.category;
      let sub_category = req.body.sub_category;
      let specification = req.body.specification;

      console.log(product_name,product_key,department,category,sub_category,specification);

      const newProduct = new Products({
          product_name,
          product_key,
          department,
          category,
          sub_category,
          specification
      });

  await newProduct.save();
  console.log("Form submitted:", newProduct);
  // res.json({ message: "Form submitted successfully" });
  res.render("dashboard.ejs", Products);
  // res.sendFile(__dirname + "/public/success.html");
  } catch (err) {
      console.error("Error saving to MongoDB:", err);
      res.status(500).json({ error: "An error occurred" });
  }
});

app.get('/get_data', async (req, res) => {
  try {
    const db = await Products(); // Assuming connectToDatabase returns a Mongoose connection

    const count = await Products.countDocuments();
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    // const date = await Products.find({
    //   createdAt: { $gte: currentDate },
    // });
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
    const saltRounds = 10; // You can adjust the number of salt rounds
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({ email, password:hashedPassword });
    console.log(hashedPassword);

    await user.save();
    // res.json({ message: 'User created successfully' });
    res.render("login.ejs");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Login route
app.post('/login', async (req, res) => {

  const { email, password } = req.body;

  // try {
  //   const user = await User.findOne({ email });
  //   if (!user) {
  //     return res.status(401).json({ error: 'Invalid credentials' });
  //   }

  //   const isPasswordValid = bcrypt.compare(password, user.password);
  //   if (!isPasswordValid) {
  //     return res.status(401).json({ error: 'Invalid Password' });
  //   }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid Password' });
  }
    
    // res.json({ message: 'User logged /in successfully' });
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});