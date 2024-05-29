const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const pdfkit = require('pdfkit');
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
    password: String,
    userRole: String
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
// app.get('/dashboard', (req, res) => {
//       res.render("dashboard.ejs");
// });

app.get("/add", (req,res) => {
  if(req.isAuthenticated()){
    res.render("add_2.ejs");
  } else {
    res.redirect("/login");
  }
});

//temp route to check
app.get("/get_data", (req, res) => {
  if(req.user.userRole === 'admin'){
    res.redirect("/get_data/admin");
  }
  else{
    res.redirect("/get_data/user");
  }
});

app.get('/get_data/user', async (req, res) => {
  if(req.isAuthenticated() && req.user.userRole === 'user'){ 
    try {
      const username = req.user.username;
      const db = await Products();
      const userData = await User.find();

      const count = await Products.countDocuments({username});
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
      const recent = await Products.find({username}).sort({ createdAt: -1 }).limit(10);
      // console.log(productData);
  
      const data = await Products.find();
      res.render('new_dashboard', { count, todayCount, recent, userData });
      
    } catch (error) {
      console.error('Error retrieving data:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect("/login");
  }
});

//weekly report webpage just to check;
app.get('/get_data/currentWeek', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const username = req.user.username;
      const userRole = req.user.userRole;
      // Retrieve data from the Products collection
      // const productData = await Products.find({});

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Calculate the start and end dates of the current week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Set to the first day of the week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to the last day of the week (Saturday)

      // Retrieve data for the current week
      if(userRole === 'user'){

        const currentWeekData = await Products.find({
          "createdAt": { $gte: startOfWeek, $lte: endOfWeek }
        } && {username}).sort({createdAt: -1});
        
        const count = currentWeekData.length;

        res.render('weekly', {count, currentWeekData });

      } else {
        try{
          const currentWeekData = await Products.find({
            "createdAt": { $gte: startOfWeek, $lte: endOfWeek }
          }).sort({createdAt: -1}); 
  
          const count = currentWeekData.length;
  
          res.render('weekly', {count, currentWeekData });
        } catch(err){
          res.json(err);
        }
      }

    } catch (error) {
      console.error('Error retrieving data:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect("/login");
  }
});

//last week data
app.get('/get_data/lastWeek', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const username = req.user.username;
      const userRole = req.user.userRole;

      // Retrieve data from the Products collection
      // const productData = await Products.find();

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Calculate the start and end dates of the last week
      const startOfLastWeek = new Date(currentDate);
      startOfLastWeek.setDate(currentDate.getDate() - currentDate.getDay() - 6); // Set to the first day of the last week (Sunday)
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6); 
      
      // Retrieve data for the last week
      if(userRole === 'user'){

      const lastWeekData = await Products.find({
        "createdAt": { $gte: startOfLastWeek, $lte: endOfLastWeek }
      } && {username}).sort({createdAt: -1});

      const count = lastWeekData.length;

      res.render('lastWeek', {count, lastWeekData });
      } else {
        const lastWeekData = await Products.find({
          "createdAt": { $gte: startOfLastWeek, $lte: endOfLastWeek }
        }).sort({createdAt: -1});
  
        const count = lastWeekData.length;
  
        res.render('lastWeek', {count, lastWeekData });
      }

    } catch (error) {
      console.error('Error retrieving data:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect("/login");
  }
});

//to generate the data on monthly basis
app.get('/get_data/monthly', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const username = req.user.username;

      // Retrieve data from the Products collection
      // const productData = await Products.find({});

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Calculate the start and end dates of the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Retrieve data for the current month
      const currentMonthData = await Products.find({
        "createdAt": { $gte: startOfMonth, $lte: endOfMonth }
      } && {username}).sort({ createdAt: -1 });
      const count = currentMonthData.length;
      // console.log(currentMonthData);

      res.render('monthly', {currentMonthData, count});

    } catch (error) {
      console.error('Error retrieving data:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect("/login");
  }
});


//to generate pdf reports weekly
app.get('/get_data/weekly-pdf-report', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Set to the first day of the week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // Fetch data from MongoDB
      const currentWeekData = await Products.find({
        "createdAt": { $gte: startOfWeek, $lte: endOfWeek }
      });
      // Create a PDF document
      const doc = new pdfkit();
      const filename = 'weekly_report.pdf';

      // Set response headers for PDF
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/pdf');

      // Pipe the PDF directly to the response
      doc.pipe(res);

      // PDF content
      doc.text('Weekly Report\n\n');

      // Loop through the retrieved data and add it to the PDF dynamically
      currentWeekData.forEach((item, index) => {
        const itemObject = item.toObject(); // Convert Mongoose document to plain JavaScript object
        Object.entries(itemObject).forEach(([key, value],index) => {
          doc.text(`${key}: ${value}`);
        });
        doc.text('\n');
      });

      // Finalize and end the PDF stream
      doc.end();

    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect("/login");
  }
});

//monthly report generation from last month's first date to current date
app.get('/get_data/pdf-report-last-month', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Calculate the first day of the last month
      const firstDayOfLastMonth = new Date(currentDate);
      firstDayOfLastMonth.setMonth(firstDayOfLastMonth.getMonth() - 1);
      firstDayOfLastMonth.setDate(1);

      // Fetch data from MongoDB for the last month
      const monthlyData = await Products.find({
        "createdAt": { $gte: firstDayOfLastMonth, $lt: currentDate }
      });

      // Create a PDF document
      const doc = new pdfkit();
      const filename = 'monthly_report.pdf';

      // Set response headers for PDF
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/pdf');

      // Pipe the PDF directly to the response
      doc.pipe(res);

      // PDF content
      doc.text('Monthly Report\n\n');

      // Loop through the retrieved data and add it to the PDF dynamically
      monthlyData.forEach((item, index) => {
        const itemObject = item.toObject(); // Convert Mongoose document to plain JavaScript object
        Object.entries(itemObject).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`);
        });
        doc.text('\n');
      });

      // Finalize and end the PDF stream
      doc.end();

    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect("/login");
  }
});

//current month data generation;
app.get('/get_data/monthly-pdf-report', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Calculate the start and end dates of the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Retrieve data for the current month
      const currentMonthData = await Products.find({
        "createdAt": { $gte: startOfMonth, $lte: endOfMonth }
      });

      // Create a PDF document
      const doc = new pdfkit();
      const filename = 'current_month_report.pdf';

      // Set response headers for PDF
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/pdf');

      // Pipe the PDF directly to the response
      doc.pipe(res);

      // PDF content
      doc.text('Current Month Report\n\n');

      // Loop through the retrieved data and add it to the PDF dynamically
      currentMonthData.forEach((item, index) => {
        doc.text(`${index + 1}. Product Name: ${item.product_name}`);
        doc.text(`   Product Key: ${item.product_key}`);
        doc.text(`   Department: ${item.department}`);
        doc.text(`   Category: ${item.category}`);
        doc.text(`   Specification: ${item.specification}`);
        doc.text(`   Date of order : ${item.createdAt}\n\n`);
      });
      // Finalize and end the PDF stream
      doc.end();

    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect("/login");
  }
});

//route for getting data from mongodb to view all items
app.get("/get_data/data", async(req,res) => {
  if(req.isAuthenticated()){
    if(req.user.userRole === 'user'){
    try{
      const username = req.user.username;

      const db = await Products();
      const data = await Products.find({username}).sort({ createdAt: -1 });
      const count = await Products.countDocuments({username});

      res.render("data_2", {data, count});
    } catch(err){
      console.log(err);
    }
  } else {
      const db = await Products();
      const data = await Products.find().sort({ createdAt: -1 });
      const count = await Products.countDocuments();

      res.render("data_2", {data, count});
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

    // console.log(results);
    res.render('data', { results });
  } catch (error) {
    console.error('Error searching in MongoDB:', error);
    res.status(500).send('Internal Server Error');
  }
});
//know your customers
app.get("/customers", async (req,res) => {
  if(req.isAuthenticated()){
    try{
      const db = await User();
      const customers = await User.find({userRole: 'user'}).sort({ createdAt: -1 });
      res.render("customer", {customers});

    } catch(err){
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req,res) => {
  req.logout(err => {
    if(err){
      console.log(err);
    } else {
      res.redirect("/login");
    }
  });
});

// SignUp route
app.post('/register', async (req, res) => {

  User.register({username: req.body.username, userRole: req.body.userRole}, req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.json(err.message);
      // res.redirect("/");
    } else {
      passport.authenticate("local")(req,res, function(err){
      if(err){
        console.log(err);
        return res.status(500).send("Internal Server Error");
      } else {
        res.redirect("/login");
      }
      });
    }
  });
});

// Login route
app.post('/login', async (req, res) => {
  const user = new User({
    username:req.body.username,
    password:req.body.password,
    userRole:req.body.userRole
  });

  req.login(user, function(err){
    if(err){
        console.log(err);
    } else {
      passport.authenticate("local")(req,res, function(err){
        if(err){
          res.json(err);
        } else {
          if((req.body.userRole === req.user.userRole)){
            if(req.body.userRole === 'user'){
              res.redirect("/get_data/user");
            }
            else if(req.body.userRole === 'admin'){
              res.redirect("/get_data/admin");
            }
            else{
              res.json("Choose proper role");
            }
          }
          else{
            res.json("Something went wrong");
          }
        }
      });
    }
  })
});


app.get("/get_data/admin", async(req,res) => {
  if(req.isAuthenticated() && req.user.userRole === 'admin'){ 
    try {
      const username = req.user.username;
      const db = await Products();
      const userData = await User.find();

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
  
      const data = await Products.find();
      res.render('new_dashboard', { count, todayCount, recent, userData });
      
    } catch (error) {
      console.error('Error retrieving data:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect("/login");
  }
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
    let username = req.user.username;
    
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
        specification,
        username
    });

    await newProduct.save();
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