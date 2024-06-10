const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const PDFDocumentWithTables = require('pdfkit-table');
// const table = require('pdfkit-table');
// const User = require('./model/user.js');
const Products = require('./model/product.js');
const Customer = require('./model/customer.js');
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
app.use(bodyParser.urlencoded({ extended: true }));
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

app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/add", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("add_product.ejs");
  } else {
    res.redirect("/login");
  }
});

app.get("/add_customer", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("add_customer.ejs");
  } else {
    res.redirect("/login");
  }
});


app.get('/get_data/user', async (req, res) => {
  if (req.isAuthenticated() && req.user.userRole === 'user') {
    try {
      const username = req.user.username;
      const db = await Products();
      const userData = await User.find();

      const count = await Products.countDocuments({ username });
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const today = await Products.find({ "createdAt": { $gt: currentDate } })
      var productData = {};

      today.forEach((item) => {
        const createdAtDate = new Date(item.createdAt).toLocaleDateString();
        const count = productData[createdAtDate] ? productData[createdAtDate] : 0;
        productData[createdAtDate] = count + 1;
      });

      const userOrders = today.filter((item) => item.username === username);
      const todayCount = userOrders.length;

      const recent = await Products.find({ username }).sort({ createdAt: -1 }).limit(10);
      // const data = await Products.find();
      const pending = await Products.find({ isApproved: false, username });
      let pendingOrders = pending.length;

      const approved = await Products.find({ isApproved: true, username });
      let approvedOrders = approved.length;

      res.render('dashboard', { count, todayCount, recent, userData, pendingOrders, approvedOrders, user: req.user });

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

      if (userRole === 'admin') {
        try {
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setHours(0, 0, 0, 0);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

          const weeklyData = await Products.find({
            createdAt: { $gte: startOfWeek, $lte: today }
          }).sort({ createdAt: -1 });
          const count = weeklyData.length;

          res.render('weekly', { weeklyData, count, user: req.user })
        } catch (error) {
          console.error('Error fetching weekly data:', error);
          res.status(500).json({ error: 'Internal server error' });
        }

      } else {
        try {
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setHours(0, 0, 0, 0);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

          const weeklyData = await Products.find({
            createdAt: { $gte: startOfWeek, $lte: today },
            username: username
          }).sort({ createdAt: -1 });
          const count = weeklyData.length;

          res.render('weekly', { weeklyData, count, user: req.user })
        } catch (error) {
          console.error('Error fetching weekly data:', error);
          res.status(500).json({ error: 'Internal server error' });
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
      let userRole = req.user.userRole;

      const today = new Date();
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setHours(0, 0, 0, 0);
      endOfLastWeek.setDate(today.getDate() - today.getDay()); // Last Sunday

      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 7); // The Sunday before last
      let count, lastWeekAdmin, lastWeekUser;
      if (userRole === 'admin') {
        lastWeekAdmin = await Products.find({
          createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek }
        }).sort({ createdAt: -1 });
        count = lastWeekAdmin.length;
      } else {
        lastWeekUser = await Products.find({
          createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek },
          username: username
        }).sort({ createdAt: -1 });
        count = lastWeekUser.length;
      }

      res.render('lastWeek', { lastWeekAdmin, lastWeekUser, count, user: req.user })
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      res.status(500).json({ error: 'Internal server error' });
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
      const userRole = req.user.userRole;

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 2); // First day of this month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Last day of this month

      let monthlyAdminData, monthlyUserData, count;
      if (userRole === 'admin') {
        monthlyAdminData = await Products.find({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ createdAt: -1 });
        count = monthlyAdminData.length;
      } else {
        monthlyUserData = await Products.find({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          username: username
        }).sort({ createdAt: -1 });
        count = monthlyUserData.length;
      }

      res.render('monthly', { monthlyAdminData, monthlyUserData, count, user: req.user })
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.redirect("/login");
  }
});


//to generate pdf reports weekly
app.get('/get_data/weekly-report', async (req, res) => {
  if (req.isAuthenticated()) {
    const username = req.user.username;
    const userRole = req.user.userRole;

    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Set to the first day of the week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // Fetch data from MongoDB
      let currentWeekAdminData, currentWeekUserData;
      if (userRole === 'admin') {
        currentWeekAdminData = await Products.find({
          "createdAt": { $gte: startOfWeek, $lte: endOfWeek }
        });
      } else {
        currentWeekAdminData = await Products.find({
          "createdAt": { $gte: startOfWeek, $lte: endOfWeek },
          username: username
        });
      }

      let doc = new PDFDocumentWithTables({ size: 'A4' }); // Set page size to A4
      let filename = 'weekly_report.pdf';

      // Set response headers for PDF
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/pdf');

      // Pipe the PDF directly to the response
      doc.pipe(res);

      doc.fontSize(18) // Set font size to 18
        .text('Weekly Report') // Center align text
        .fontSize(12) // Reset font size to 12 for the rest of the document
        .text('\n\n');

      // Define table headers
      let headers = ['Product Name', 'Product Key', 'Department', 'Category', 'Specification', 'Date of Order'];

      // Prepare table data
      let data = [];
      (currentWeekAdminData || currentWeekUserData).forEach((item, index) => {
        const itemObject = item.toObject(); // Convert Mongoose document to plain JavaScript object
        let dateOfOrder = new Date(itemObject.createdAt);
        let dateOnly = `${dateOfOrder.getDate()}-${dateOfOrder.getMonth() + 1}-${dateOfOrder.getFullYear()}`;
        let row = [itemObject.product_name, itemObject.product_key, itemObject.department, itemObject.category, itemObject.specification, dateOnly];
        data.push(row);
      });

      // Create the table
      doc.table({
        headers: headers,
        rows: data,
      }, { top: 50, left: 0, bottom: 50 });

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

//monthly report generation of this month
app.get('/get_data/monthly-report', async (req, res) => {
  if (req.isAuthenticated()) {

    const username = req.user.username;
    const userRole = req.user.userRole;

    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 2); // First day of this month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Last day of this month

      let monthlyAdminData, monthlyUserData, count;
      if (userRole === 'admin') {
        monthlyAdminData = await Products.find({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ createdAt: -1 });
        count = monthlyAdminData.length;
      } else {
        monthlyUserData = await Products.find({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          username: username
        }).sort({ createdAt: -1 });
        count = monthlyUserData.length;
      }

      let doc = new PDFDocumentWithTables({ size: 'A4' });
      let filename = 'monthly_report.pdf';

      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/pdf');

      doc.pipe(res);

      //to get month adn year to add in title
      let date = new Date();
      let month = (date.getMonth() + 1).toString().padStart(2, '0');
      let year = date.getFullYear();
      let monthYear = `${month} ${year}`;

      doc.fontSize(18)
        .text(`Monthly Report (${monthYear})`)
        .fontSize(12)
        .text('\n\n');

      let headers = ['Product Name', 'Product Key', 'Department', 'Category', 'Specification', 'Date of Order'];

      // Prepare table data
      let data = [];
      (monthlyAdminData || monthlyUserData).forEach((item, index) => {
        const itemObject = item.toObject(); // Convert Mongoose document to plain JavaScript object
        let dateOfOrder = new Date(itemObject.createdAt);
        let dateOnly = `${dateOfOrder.getDate()}-${dateOfOrder.getMonth() + 1}-${dateOfOrder.getFullYear()}`;
        let row = [itemObject.product_name, itemObject.product_key, itemObject.department, itemObject.category, itemObject.specification, dateOnly];
        data.push(row);
      });

      // Create the table
      doc.table({
        headers: headers,
        rows: data,
      }, { top: 50, left: 0, bottom: 50 });

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
app.get("/get_data/data", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const username = req.user.username;

      if (req.user.userRole === 'admin') {
        // Admin order page
        const role = 'admin';
        const db = await Products();
        const data = await Products.find({ isApproved: false }).sort({ createdAt: -1 });
        const count = await Products.countDocuments({ isApproved: false });
        const approvedData = await Products.find({ isApproved: true }).sort({ createdAt: -1 });
        const countForApprovedData = await Products.find({ isApproved: true }).sort({ createdAt: -1 });
        res.render("orders", { data, count, role, approvedData, countForApprovedData, user: req.user });
      } else {
        const db = await Products();
        const data = await Products.find({ username }).sort({ createdAt: -1 });
        const count = await Products.countDocuments({ username });
        res.render("orders", { data, count, user: req.user });
      }

    } catch (err) {
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

    // console.log(results);
    res.render('search', { results });
  } catch (error) {
    console.error('Error searching in MongoDB:', error);
    res.status(500).send('Internal Server Error');
  }
});

//know your customers
app.get("/customers", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const db = await User();
      const customers = await Customer.find().sort({ createdAt: -1 });

      res.render("customer", { customers, user: req.user });

    } catch (err) {
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/login");
    }
  });
});

//customer add route
app.post("/customer_submit", async (req, res) => {
  try {
    let username = req.body.username;
    let phone = req.body.phone;
    let email = req.body.email;
    let address = req.body.address;

    const newCustomer = new Customer({
      username,
      phone,
      email,
      address,
    });

    await newCustomer.save();
    res.render("success.ejs", { user: req.user });
    // res.json({ message: "Form submitted successfully" });
  } catch (err) {
    console.error("Error saving to MongoDB:", err);
    res.render("failure.ejs");
    // res.status(500).json({ error: "An error occurred" });
  }
});

// SignUp route
app.post('/register', async (req, res) => {
  User.register({ username: req.body.username, userRole: req.body.userRole }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.json(err.message);
      // res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function (err) {
        if (err) {
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
    username: req.body.username,
    password: req.body.password,
    userRole: req.body.userRole
  });

  userRole = req.user
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function (err) {
        if (err) {
          console.log(err);
        } else {
          if ((req.body.userRole === req.user.userRole)) {
            if (req.body.userRole === 'user') {
              res.redirect("/get_data/user");
            }
            else if (req.body.userRole === 'admin') {
              res.redirect("/get_data/admin");
            }
            else {
              res.json("Choose proper role");
            }
          }
          else {
            res.json("Choose proper role");
          }
        }
      });
    }
  })
});


app.get("/get_data/admin", async (req, res) => {
  if (req.isAuthenticated() && req.user.userRole === 'admin') {
    try {
      const username = req.user.username;
      const db = await Products();
      const userData = await User.find();

      const count = await Products.countDocuments();
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const today = await Products.find({ "createdAt": { $gt: currentDate } })
      // var productData = {};

      today.forEach((item) => {
        const createdAtDate = new Date(item.createdAt).toLocaleDateString();
        // const count = productData[createdAtDate] ? productData[createdAtDate] : 0;
        // productData[createdAtDate] = count + 1;
      });
      const todayCount = today.length;
      const recent = await Products.find().sort({ createdAt: -1 }).limit(10);
      // const data = await Products.find();
      const pending = await Products.find({ isApproved: false });
      const pendingOrders = pending.length;

      const approved = await Products.find({ isApproved: true })
      const approvedOrders = approved.length;

      res.render('dashboard', { count, todayCount, recent, userData, pendingOrders, approvedOrders, user: req.user });

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
app.post("/submit", async (req, res) => {
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

  } catch (err) {
    console.error("Error saving to MongoDB:", err);
    res.render("failure.ejs");
  }
});
//approving products
app.post('/approve_product/:productId', async (req, res) => {
  const productId = req.params.productId;
  try {
    await Products.findByIdAndUpdate(productId, { isApproved: true });
    // res.redirect('/get_data/data'); // Redirect back to admin panel
    res.redirect("/get_data/data")
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).send('Error approving product');
  }
});

//to delete the product
app.delete('/decline_product/:productId', async (req, res) => {
  const productId = req.params.productId;
  try {
    await Products.findByIdAndUpdate(productId, { isApproved: false });
    res.json("Product declined successfully.");
  } catch (error) {
    console.error('Error declining product:', error);
    res.status(500).send('Error declining product');
  }
});

//user remove from database
app.post('/delete_user/:userId', async (req, res) => {
  const userId = req.params.userId;
  const userRole = req.user.userRole;

  try {
    // Find the user by ID and remove them
    await Customer.findByIdAndDelete(userId);
    res.redirect("/customers");
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Error deleting user');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});