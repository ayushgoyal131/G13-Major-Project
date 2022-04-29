const express= require('express');
const ejs = require('ejs');
const mongoose= require('mongoose');
const bodyParser= require('body-parser');
const fs= require('fs');  //for image upload support
const multer= require('multer');  //for image upload support
const fetch = require("isomorphic-fetch");
const alert= require('alert');
const app = express();

// app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:false}));
//----------------Mongoose--------------------------------------------- 
mongoose.connect('mongodb://localhost:27017/majorProjectDB', {useNewUrlParser: true, useUnifiedTopology: true});
const UserSchema= new mongoose.Schema({
  username: String,
  password: String,
  userType: String
});
const CustomerSchema = new mongoose.Schema({
  name: String,
  username: String,
  cart: [{productID: String, quantity: Number}],
  wishlist: [{productID: String, quantity: Number}],
  bookCart: [{bookID: String}]
});
const SellerSchema = new mongoose.Schema({
  name: String,
  username: String,
  productIDs: [String]
});
const ProductSchema = new mongoose.Schema({
  category: String,
  subcategory: String,
  genericname: String,
  name: String,
  brand: String,
  price: Number,
  mrp: String,
  // img: { data: Buffer, contentType: String },
  imgURL: String,
  rating: Number,
  country: String,
  sellerName: String,
  quantity: String,
  sellerUsername: String,
});
const BookStoreSchema = new mongoose.Schema({
  name: String,
  username: String,
  city: String,
  pincode:  Number,
  bookstoreNumber: Number,
  bookdb: [{bookID: String, quantity: Number, buyPrice: Number, sellPrice: Number}]
});
const BookSchema = new mongoose.Schema({
  class: Number,
  board: String,
  subject: String,
  name: String,
  publisher: String,
  author: String,
  price: Number
});
const Customer = mongoose.model("Customer", CustomerSchema);
const Seller= mongoose.model("Seller", SellerSchema);
const Product = mongoose.model("Product", ProductSchema);
const Bookstore = mongoose.model("Bookstore", BookStoreSchema);
const Book = mongoose.model("Book", BookSchema);
const User= mongoose.model("User", UserSchema);
//------------------------------------------------------------------------

//---------PASSPORT ---------------------------------
const bcrypt= require('bcrypt');
const passport= require('passport');
const flash= require('express-flash')
const session= require('express-session');
const initializePassport= require('./passport-config')
initializePassport( 
  passport, 
  async function(username){
    const user = await User.findOne({username: username});
    console.log(user);
    return user;
  },
  async function(_id){
    const user = await User.findOne({_id: _id});
    console.log(user);
    return user;
  }
)

app.use(flash())
app.use(session({
  secret:"our little secret",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
//-------------------------------------------------------

//for captcha
const request = require('request');
const { post } = require('request');
// app.use(express.json());

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname + 'public'));





// app.use(multer({dest: './uploads/',
//   rename: function(fieldname, filename){
//     return filename;
//   },
// }));

app.get('/register', function(req, res){
  res.render('register.ejs', {user: req.user});
});
app.post('/register', function(req, res){
  try{
    const hashedPassword= bcrypt.hash(req.body.password, 10, function(err, hashedPassword){
      console.log(hashedPassword);
      var user = new User({
        username: req.body.username,
        password: hashedPassword,
        userType: req.body.userType
      });
      user.save(function (err, results) {
        if(err){
          console.log(err);
        }
        res.redirect('/login');
      });
    });
  }catch(e){
    console.log(e);
  }
});
app.get('/login', function(req, res){
  res.render('login.ejs', {user: req.user});
});
app.post('/login', 
  passport.authenticate('local', {failureRedirect: '/login',failureFlash: true  }),
  function(req, res){
    console.log("Logged in Successfully");
    res.redirect('/');
  }
);

app.get('/', function (req, res) {
    console.log("Entered homepage");
    console.log("USER REQ vaala: "+req.user)
    res.render('index.ejs', {user: req.user});
});

app.get('/signup_login', function(req, res){
  console.log("HELLOOOOOOOOOOOO");
  req.logout();
  res.render('signup_login_new.ejs', {user: req.user});
});
app.get('/customerSignup', function(req, res){
  res.render('customerSignup.ejs', {user:req.user});
});
app.post('/customerSignup', function(req, res){
  User.findOne({username: req.body.username}, function(err, doc){
    if(doc){
      console.log("CUSTOMER SIGNUP: User Already Exists");
      res.redirect('/customerSignup');
    }else{
      const hashedPassword= bcrypt.hash(req.body.password, 10, function(err, hashedPassword){
        const user= new User({
          username: req.body.username,
          password: hashedPassword,
          userType: "Customer"
        });
        user.save();
      });
      const customer = new Customer({
        name: req.body.name,
        username: req.body.username
      });
      customer.save();
      res.redirect('/login');
    }
  });
});
app.get('/sellerSignup', function(req, res){
    res.render('sellerSignup.ejs', {user:req.user});
});
app.post('/sellerSignup', function(req, res){
  User.findOne({username: req.body.username}, function(err, doc){
    if(doc){
      console.log("SELLER SIGNUP: User Already Exists");
      res.redirect('/sellerSignup');
    }else{
      const hashedPassword= bcrypt.hash(req.body.password, 10, function(err, hashedPassword){
        const user= new User({
          username: req.body.username,
          password: hashedPassword,
          userType: "Seller"
        });
        user.save();
      });
      const seller = new Seller({
        name: req.body.name,
        username: req.body.username
      });
      seller.save();
      res.redirect('/login');
    }
  });
});
/*
app.get('/login', function(req, res){
    res.redirect('/register');
    req.logout();
    res.render('login.ejs',{});
    //res.sendFile(__dirname+'/views/login.html');
});
app.post('/login', function(req, res){

  const response_key = req.body["g-recaptcha-response"];
  const secretKey = '6LeSqFsdAAAAAB9J8cSX-kvQ8HfS9EGYqTaCnuY4';
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${response_key}`;
  //captcha
  fetch(verifyUrl, {
    method: "post",
  })
    .then((response) => response.json())
    .then((google_response) => {
      console.log("HIIIIIIIIIIIIIIIII");
      // google_response is the object return by
      // google as a response
      console.log(google_response);
      if (google_response.success == true) {
        const customer= new Customer({
          username: req.body.username,
          password: req.body.password
        });
        
        req.login(customer, function(err){
          if(err){
            console.log(err);
            res.redirect('/register');
          }else{
            passport.authenticate("customerLocal")(req, res, function(){
              console.log("Success");
              res.redirect('/makeinindia');
            });
          }
        });
      } else {
        // if captcha is not verified
        console.log("Captcha not verified!!!!!!!!!!!!!!");
        return res.redirect('/register');
      }
    })
    .catch((error) => {
        // Some error while verify captcha
      return res.json({ error });
    });

  
});
  

app.get('/signup', function(req, res){
  res.redirect('/register');
  res.render('signup.ejs',{});
});
app.post('/signup', function(req, res){
  Customer.register({username: req.body.username, name:req.body.name}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect('/register');
    }else{
      passport.authenticate("customerLocal")(req, res, function(){
        console.log("Success");
        res.redirect('/register');
      });
    }
  });
});
*/

app.get('/seller',  function(req, res){
  if(req.isAuthenticated()){
    if(req.user.userType!="Seller"){
      res.render('unauthorized.ejs', {user:req.user});
    }else{
      const user= req.user;
      console.log("SELLER USER: "+user);
      const username=  req.user.username;
      
      if(req.user.userType!="Seller") res.render('unauthorized.ejs', {user: req.user})
      Seller.findOne( {username: username}, function(err, foundUser){
        if(err){
          console.log(err);
        }else{
          if(foundUser){
            console.log("Found");
            console.log(foundUser.name);
            res.render('seller.ejs', {sellerName: foundUser.name});
          }
        }
      });
    }
  }else{
    res.redirect('/login');
  }
});

app.get('/dashboard', function(req, res){
  if(!req.isAuthenticated()) 
    res.redirect('/seller/login');
  
  const sellerUsername= req.user.username;
  Product.find({sellerUsername: sellerUsername}, function(err, docs){
    Seller.findOne( {username: sellerUsername}, function(err, foundUser){
      if(err){
        console.log(err);
      }else{
        if(foundUser){
          res.render('sellerDashboard.ejs', {sellerName: foundUser.name, productsArray:docs});
        }
      }
    });
  });

});

app.post('/seller', upload.single('userPhoto'), function(req, res){
  console.log(JSON.stringify(req.file));
  let productName= req.body.name;
  let productQuantity= req.body.quantity;
  let productPrice= req.body.price;
  let productImage= {data: fs.readFileSync(req.file.path), contentType: "image/png" }
  let sellerUsername= req.user.username;

  var ObjectID = require('mongodb').ObjectID;
  var newID= new ObjectID();
  var newProduct= new Product({
    _id: newID, 
    name: productName, 
    quantity: productQuantity, 
    price: productPrice, 
    img: productImage,
    sellerUsername: sellerUsername
  });
  newProduct.save((err, doc)=>{
    if(err){
      console.log("Unable to save product.!!!");
      console.log(err);
    }
  });

  Seller.findOneAndUpdate(
    {username: req.user.username}, 
    { $push: {productIDs: newID}},
    function(error, success){
      if(error){console.log(error)}
      else{console.log("Success")};
    }
    );
  console.log("Success");
  res.redirect('/seller');
});

/*
app.get('/seller/login', function(req, res){
  req.logout();
  res.render('sellerlogin.ejs',{});
});
app.post('/seller/login', function(req, res){

  const seller= new Seller({
    username: req.body.username,
    password: req.body.password
  });

  req.login(seller, function(err){
    if(err){
      console.log(err);
      res.redirect('/seller/login');
    }else{
      passport.authenticate("sellerLocal")(req, res, function(){
        console.log("Success");
        res.redirect('/seller');
      });
    }
  });
});

app.get('/seller/signup', function(req, res){
res.render('sellersignup.ejs',{});
});
app.post('/seller/signup', function(req, res){

  const seller = new Seller({
    name: req.body.name,
    username: req.body.username
  });

  Seller.register(seller, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect('/seller/signup');
    }else{
      console.log("Reached here");
      res.redirect('/seller/login');
      // passport.authenticate("local", function(req, res){
      //   console.log("Success");
      //   res.redirect('/seller');
      // }); 
    }
  });
  
  res.redirect('/seller/login');
});
*/


app.get('/cart',function(req, res){
  if(req.isAuthenticated()){
    if(req.user.userType!="Customer"){
      console.log("NOT CUSTOMER")
      res.render('unauthorized.ejs', {user:req.user});
    }else{
      var productArray = []
  var cartItems= [];
  Customer.findOne(
    {username: req.user.username}, 
    function(err, doc){
      // console.log("Cart Size: " + doc.cart.length);
      for(var i=0; i<doc.cart.length; i++){
        productArray.push({productID: doc.cart[i].productID, quantity: doc.cart[i].quantity})
      }
      // console.log("Product Array Size: "+productArray.length);
      if(productArray.length===0)
        res.render('cart.ejs', {cartItems:cartItems, user: req.user});
      for(var i=0; i<productArray.length; i++){
        let productQuantity= productArray[i].quantity;
        let currIndex= i;
        let productArrayLength= productArray.length;
        // console.log(productArray[i].productID);
        Product.findOne({_id: productArray[i].productID}, function(err, doc){
          cartItems.push({
            productID: doc._id,
            name: doc.name,
            price: doc.price,
            image: doc.imgURL,
            quantity: productQuantity
          });
          // console.log("Cart Items: "+ cartItems);
          if(currIndex===productArrayLength-1){
            res.render('cart.ejs', {cartItems: cartItems, user: req.user});
          }
        });
      }
    }
  );
    }
  
  }else{
    res.redirect('/login');
  }
});

app.post('/removeFromCart', function(req, res){
  console.log("Presenting the cart");
  Customer.findOne(
    {username: req.user.username},
    function(err, doc){
      if(err){
        console.log("ERROR ERROR");
      }
      cartItems = doc.cart;
      console.log("Cart Items: "+ cartItems);
      newCartItems= cartItems.filter(item=>{
        console.log(item.productID);
        console.log(req.body.productID);
        if(item.productID===req.body.productID)
          console.log("FOUND");
        return item.productID!=req.body.productID;
      });
      console.log(newCartItems);
      doc.cart= newCartItems;
      doc.save();
      res.redirect('/cart');
    }
  );
});

app.get('/deliveryAddress',function(req, res){
  res.render('checkout_address.ejs',{user: req.user});
});

app.post('/deliveryAddress',function(req,res){
  res.render('checkout_address.ejs',{user: req.user.name})
});

app.get('/payment',function(req, res){
  res.render('checkout_payment.ejs',{user: req.user})
});

app.post('/payment',function(req,res){
  res.render('checkout_payment.ejs',{})
});


app.get('/checkout_review_payment',function(req,res){
  var productArray = []
  var cartItems= [];
  Customer.findOne(
    {username: req.user.username}, 
    function(err, doc){
      console.log("Cart Size: " + doc.cart.length);
      for(var i=0; i<doc.cart.length; i++){
        productArray.push({productID: doc.cart[i].productID, quantity: doc.cart[i].quantity})
      }
      console.log("Product Array Size: "+productArray.length);
      if(productArray.length===0)
        res.render('checkout_review_payment.ejs', {cartItems:cartItems, user: req.user});
      for(var i=0; i<productArray.length; i++){
        let productQuantity= productArray[i].quantity;
        let currIndex= i;
        let productArrayLength= productArray.length;
        Product.findOne({_id: productArray[i].productID}, function(err, doc){
          cartItems.push({
            name: doc.name,
            price: doc.price,
            image: doc.img,
            quantity: productQuantity
          });
          console.log("Cart Items: "+ cartItems);
          if(currIndex===productArrayLength-1){
            console.log("Hellooooo")
            res.render('checkout_review_payment.ejs', {cartItems: cartItems, user: req.user});
          }
        });
      }
    }
  );
  //res.render('checkout_review_payment.ejs',{})
});

app.post('/checkout_review_payment',function(req,res){
  res.render('checkout_review_payment.ejs',{})
});

app.get('/place_order',function(req,res){
  res.render('payment_success.ejs',{user: req.user})
});

app.post('/place_order',function(req,res){
  res.render('payment_success.ejs',{})
});


app.get('/orders', function(req, res){
  if(req.isAuthenticated()){
    if(req.user.userType!="Customer"){
      res.render('unauthorized.ejs', {user:req.user});
    }else
  res.render('orders.ejs', {user: req.user});
  }else{
    res.redirect('/login');
  }
});

app.get('/order-details', function(req, res){
  var productArray = []
  var cartItems= [];
  Customer.findOne(
    {username: req.user.username}, 
    function(err, doc){
      console.log("Order Size: " + doc.cart.length);
      for(var i=0; i<doc.cart.length; i++){
        productArray.push({productID: doc.cart[i].productID, quantity: doc.cart[i].quantity})
      }
      console.log("Product Array Size: "+productArray.length);
      if(productArray.length===0)
        res.render('order-details.ejs', {cartItems:cartItems, user: req.user});
      for(var i=0; i<productArray.length; i++){
        let productQuantity= productArray[i].quantity;
        let currIndex= i;
        let productArrayLength= productArray.length;
        Product.findOne({_id: productArray[i].productID}, function(err, doc){
          cartItems.push({
            name: doc.name,
            price: doc.price,
            image: doc.img,
            quantity: productQuantity
          });
          console.log("Order Detail Items: "+ cartItems);
          if(currIndex===productArrayLength-1){
            console.log("Hellooooo")
            res.render('order-details.ejs', {cartItems: cartItems, user: req.user});
          }
        });
      }
    }
  );
});

app.get('/wishlist', function(req, res){
  if(req.isAuthenticated()){
    if(req.user.userType!="Customer"){
      res.render('unauthorized.ejs', {user:req.user});
    }else{
      var productArray = []
      var wishItems= [];
      Customer.findOne(
        {username: req.user.username}, 
        function(err, doc){
          console.log("Wishlist Size: " + doc.wishlist.length);
          for(var i=0; i<doc.wishlist.length; i++){
            productArray.push({productID: doc.wishlist[i].productID, quantity: doc.wishlist[i].quantity})
          }
          console.log("Product Array Size: "+productArray.length);
          if(productArray.length===0)
            res.render('wishlist.ejs', {wishItems:wishItems, user: req.user});
          for(var i=0; i<productArray.length; i++){
            let productQuantity= productArray[i].quantity;
            let currIndex= i;
            let productArrayLength= productArray.length;
            console.log(productArray[i].productID);
            Product.findOne({_id: productArray[i].productID}, function(err, doc){
              wishItems.push({
                name: doc.name,
                productID: doc._id,
                price: doc.price,
                image: doc.imgURL,
                quantity: productQuantity
              });
              console.log("Wishlist Items: "+ wishItems);
              if(currIndex===productArrayLength-1){
                console.log("Hellooooo")
                res.render('wishlist.ejs', {wishItems: wishItems, user: req.user});
              }
            });
          }
        }
      );
    }
 
  }else{
    res.redirect('/login');
  }

});

app.post('/wishlist',function(req, res){
  Product.find({name:req.body.searchItem}, function(err, docs){
    var resultArray=[];
    
    for(let i=0; i<docs.length; i++){
        resultArray.push({id:docs[i]._id , name: docs[i].name, price: docs[i].price, image: docs[i].img});
    }
    res.render('wishlist.ejs', {resultArray: resultArray,user: req.user});
  });
});
app.post('/addtowishlist', function(req, res){
  if(req.isAuthenticated() && req.user.userType==="Customer"){
  const customerUsername= req.user.username;
  const productID= req.body.productID;
  console.log("addtowishlist---post");
  Customer.updateOne(
    {username:customerUsername},
    {$push: {wishlist: {productID: productID, quantity: 1} } },
    function(err){
      console.log(err);
    }
  );
  }else{
    if(!req.isAuthenticated())
    res.redirect('/login');
    else
    res.render('unauthorized.ejs', {user:req.user});
  }

});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/makeinindia', function(req, res){
  // Seller.findOne({username:"weddingzeal@gmail.com"}, function(err, doc){
  //   res.render('makeinindia.ejs', {resultArray: [],user: req.user.name});
  // });
  if(req.isAuthenticated() && req.user.userType=== "Bookstore"){
      res.render('unauthorized.ejs', {user:req.user});
  }else{
    Product.find({}, function(err, docs){
      var resultArray=[];
      for(let i=0; i<docs.length; i=i+50){
          console.log(docs[i]);
          resultArray.push(docs[i]);
      }
      resultArray.sort((a, b) => a.name > b.name ? 1 : -1);
      res.render('makeinindia.ejs', {sortBy:"Name", searchQuery: "" ,resultArray: resultArray,user: req.user});
    });
  }
});
app.post('/makeinindia', function(req, res){
  var sortBy= req.body.sortBy;
  if(sortBy===undefined)
    sortBy= "Name";
  else{
    console.log("Sort BY: "+sortBy);
    console.log("Search Query: "+req.body.searchItem);
  }
  Product.find({name:{$regex: '.*' + req.body.searchItem + '.*', $options : 'i'}}, function(err, docs){
    var resultArray=[];
    for(let i=0; i<docs.length; i++){
        resultArray.push(docs[i]);
    }
    if(sortBy==="Name")
      resultArray.sort((a, b) => a.name > b.name ? 1 : -1);
    if(sortBy==="Price (High to Low)")
      resultArray.sort((a, b) => a.price < b.price ? 1 : -1);
    if(sortBy==="Price (Low to High)")
      resultArray.sort((a, b) => a.price > b.price ? 1 : -1);

    res.render('makeinindia.ejs', {sortBy: sortBy,searchQuery:req.body.searchItem ,resultArray: resultArray,user: req.user});
  });
});

app.post('/addToCart', function(req, res){
  if(req.isAuthenticated() && req.user.userType==="Customer"){
  const customerUsername= req.user.username;
  const productID= req.body.productID;
  
  Customer.findOne(
    {username: customerUsername},
    function(err, doc){
      console.log(customerUsername)
      let flag= false;
      console.log(doc);
      for(let i=0; i<doc.cart.length; i++){
        if(doc.cart[i].productID===productID){
          flag=true;
          doc.cart[i].quantity++;
          doc.save();
          break;
        }
      }
      if(!flag){
        Customer.updateOne(
          {username:customerUsername},
          {$push: {cart: {productID: productID, quantity: 1} } },
          function(err){
            console.log(err);
          }
        );
      }
    }
  );
  }else{
    if(!req.isAuthenticated())
    res.redirect('/login');
    else
    res.render('unauthorized.ejs', {user:req.user});
  }
});


// BOOKS

app.get('/books', function(req, res){
  if(req.isAuthenticated()){
    console.log(req.user.userType);
    if(req.user.userType!="Bookstore"){
      res.render('unauthorized.ejs', {user:req.user});
    }else{
    res.render('books.ejs', {user: req.user});
    }
  }else{
    res.redirect('/login');
  }
  
});
app.get('/books_addBookUniversalDB', function(req, res){
  res.render('booksAddBookUniversalDB.ejs', {user: req.user});
});
app.post('/books_addBookUniversalDB', function(req, res){
  console.log(req.body);
  const newBook= new Book({
    class: parseInt(req.body.class),
    board: req.body.board,
    subject: req.body.subject,
    name: req.body.name,
    publisher: req.body.publisher,
    author: req.body.author,
    price: parseInt(req.body.price)
  });
  newBook.save(function(err, doc){
    if(err){
      console.log(err);
    }else{
      console.log("Book added successfully");
      alert("Book added successfully");
      res.redirect('/books_addBookUniversalDB');
    }
  });
});

function bookstore_mydb_result(req, res, board, grade, resultArray){
  Bookstore.findOne({name:req.user.name}, function(err, docs){
    if(err){
      console.log("error");
    }
    console.log("found");
    console.log("length-");
    console.log(docs.bookdb.length);
    if(docs.bookdb.length===0){
      res.render('bookstore_mydb.ejs',{resultArray: resultArray, user: req.user});
    }
    for(let i=0; i<docs.bookdb.length; i++){
      var book_id = docs.bookdb[i].bookID;
      const ObjectId = require('mongodb').ObjectId; 
      var new_id = new ObjectId(book_id);
      let currIndex= i;
      console.log("id = ");
      console.log(new_id);
      Book.findOne({_id:new_id}, function(err, docs_book) {
        if (err) {
          console.log("error");
        }
        console.log(docs_book.board);
        console.log(docs_book.name);
        if(grade==""){
          if (docs_book.board == board) {
            console.log("condition approvec");
            console.log("buy price" + docs.bookdb[i].buyPrice);
            console.log("sell price" + docs.bookdb[i].sellPrice);
            resultArray.push({ _id: docs_book._id, class: docs_book.class, board: docs_book.board, subject: docs_book.subject, name: docs_book.name, publisher: docs_book.publisher, author: docs_book.author, buyPrice: docs.bookdb[i].buyPrice, sellPrice: docs.bookdb[i].sellPrice, quantity: docs.bookdb[i].quantity});
            console.log("pushed");
            console.log(resultArray.length)
          }
        }
        else{
          if (docs_book.board == board && docs_book.class == grade) {
            console.log("condition approvec");
            console.log("buy price" + docs.bookdb[i].buyPrice);
            console.log("sell price" + docs.bookdb[i].sellPrice);
            resultArray.push({ _id: docs_book._id, class: docs_book.class, board: docs_book.board, subject: docs_book.subject, name: docs_book.name, publisher: docs_book.publisher, author: docs_book.author, buyPrice: docs.bookdb[i].buyPrice, sellPrice: docs.bookdb[i].sellPrice, quantity: docs.bookdb[i].quantity});
            console.log("pushed");
            console.log(resultArray.length)
          }
        }
        if(currIndex===docs.bookdb.length-1){
          console.log("exiting!!!")
          console.log("calling fucntion")
          console.log("length")
          console.log("ejss.........")
          res.render('bookstore_mydb.ejs', {resultArray: resultArray, user: req.user, board: board, grade: grade});
        }
      });
    }
  });
}

app.get('/bookstore_myDB_CBSE', function(req, res){
  console.log("in get")
  var resultArray=[];
  const board = "CBSE";
  const grade = "";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/bookstore_myDB_CBSE_9', function(req, res){
  console.log("in get")
  console.log(req.user.name)
  var resultArray=[];
  const board = "CBSE";
  const grade = "9";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/bookstore_myDB_CBSE_10', function(req, res){
  console.log("in get")
  console.log(req.user.name)
  var resultArray=[];
  const board = "CBSE";
  const grade = "10";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/bookstore_myDB_CBSE_11', function(req, res){
  console.log("in get")
  console.log(req.user.name)
  var resultArray=[];
  const board = "CBSE";
  const grade = "11";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/bookstore_myDB_CBSE_12', function(req, res){
  console.log("in get")
  console.log(req.user.name)
  var resultArray=[];
  const board = "CBSE";
  const grade = "12";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/bookstore_myDB_ICSE', function(req, res){
  console.log("in get")
  console.log(req.user.name)
  var resultArray=[];
  const board = "ICSE";
  const grade = "";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/bookstore_myDB_ICSE_9', function(req, res){
  console.log("in get")
  console.log(req.user.name)
  var resultArray=[];
  const board = "ICSE";
  const grade = "9";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/bookstore_myDB_ICSE_10', function(req, res){
  console.log("in get")
  console.log(req.user.name)
  var resultArray=[];
  const board = "ICSE";
  const grade = "10";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/bookstore_myDB_ICSE_11', function(req, res){
  console.log("in get")
  console.log(req.user.name)
  var resultArray=[];
  const board = "ICSE";
  const grade = "11";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/bookstore_myDB_ICSE_12', function(req, res){
  console.log("in get")
  console.log(req.user.name)
  var resultArray=[];
  const board = "ICSE";
  const grade = "12";
  bookstore_mydb_result(req,res,board,grade,resultArray);
});

app.get('/book_signup_login', function(req, res){
  console.log("HELLOOOOOOOOOOOO");
  req.logout();
  console.log("Type of user: "+ typeof(req.user));
  console.log(req.user);
  if(req.user!= null)
    console.log("USER NOT NULL");
  else
    console.log("USER NULL");
  res.render('book_signup_login_new.ejs', {user: req.user});
  console.log("entered");
});

app.get('/search_books',function(req,res){
  console.log("get_booooooooooooooks")
  Bookstore.findOne({username:"abc@gmail.com"}, function(err, doc){
    if(err){
      console.log("error!!!!!!!!!!!!!!");
      console.log(err);
    }
    res.render('book_search.ejs',{resultArray: [], user: req.user});
  });
})

app.post('/search_books', function(req, res){
  console.log("booooooooooooooks");
  console.log(req.body.searchItem)

  Book.find({name:{$regex: '.*' + req.body.searchItem + '.*'}}, function(err, docs){
    if(err){
      console.log("error");
    }
    var resultArray=[];
    
    for(let i=0; i<docs.length; i++){
        resultArray.push({id:docs[i]._id , class: docs[i].class, board: docs[i].board, subject: docs[i].subject, name: docs[i].name, publisher: docs[i].publisher, author: docs[i].author, price: docs[i].price});
    }
    res.render('book_search.ejs', {resultArray: resultArray,user: req.user});
  });
});

app.post('/book_student_login', function(req, res){
  res.redirect('/search_books');
});

app.get('/bookstoreSignup', function(req, res){
  res.render('bookstoreSignup.ejs', {user : req.user});
});

app.post('/bookstoreSignup', function(req, res){
  User.findOne({username: req.body.username}, function(err, doc){
    if(doc){
      console.log("BOOKSTORE SIGNUP: User Already Exists");
      res.redirect('/bookstoreSignup');
    }else{
      const hashedPassword= bcrypt.hash(req.body.password, 10, function(err, hashedPassword){
        const user= new User({
          username: req.body.username,
          password: hashedPassword,
          userType: "Bookstore"
        });
        user.save();
      });
      Bookstore.findOne({username: req.body.username}, function(err, doc){
        if(!doc){
          const bookstore = new Bookstore({
            name: req.body.name,
            username: req.body.username,
            city: req.body.city,
            pincode: req.body.pincode,
            bookstoreNumber: req.body.bookstoreNumber
          });
          bookstore.save();
        }
      });
      res.redirect('/login');
    }
  });
});

app.post('/addToBookstoreDb', function(req, res){
  if(!req.isAuthenticated()){
    res.redirect('/book_signup_login');
  }
  const bookstoreUsername= req.user.username;
  const bookID= req.body.bookID;
  const quant= req.body.quantity;
  const buyPrice = req.body.buyPrice;
  const sellPrice = req.body.sellPrice;
  Bookstore.findOne(
    {username: bookstoreUsername},
    function(err, doc){
      console.log(bookstoreUsername)
      let flag= false;
      console.log(doc);
      for(let i=0; i<doc.bookdb.length; i++){
        if(doc.bookdb[i].bookID===bookID){
          console.log("quantity")
          console.log(quant)
          flag=true;
          const prev_quant = doc.bookdb[i].quantity;
          console.log(" prev quantity")
          console.log(prev_quant)
          // const myQuer = {quantity: prev_quant};
          // const newValue = {$set: {quantity: quant}};
          //updateOne(myQuer,newValue,function(err,res){})
          doc.bookdb[i].quantity=quant;
          doc.bookdb[i].buyPrice=buyPrice;
          doc.bookdb[i].sellPrice=sellPrice;
          console.log(doc.bookdb[i].quantity)
          doc.save();
          break;
        }
      }
      if(!flag){
        Bookstore.updateOne(
          {username:bookstoreUsername},
          {$push: {bookdb: {bookID: bookID, quantity: quant,buyPrice: buyPrice ,sellPrice: sellPrice} } },
          function(err){
            console.log(err);
          }
        );
      }
      res.redirect("/search_books");
    }
  );
});


app.get('/studentBookSearch', function(req, res){
  if(req.isAuthenticated() && req.user.userType==="Customer"){
    res.render('studentBookSearch.ejs', {resultArray:[], user: req.user});
  }else{
    if(!req.isAuthenticated()){
      res.redirect('/login');
    }else{
      res.render('unauthorized.ejs', {user:req.user});
    }
  }
  
});
app.post('/studentBookSearch', function(req, res){
  console.log("booooooooooooooks");
  console.log(req.body.searchItem)

  Book.find({name:{$regex: '.*' + req.body.searchItem + '.*'}}, function(err, docs){
    if(err){
      console.log("error");
    }
    var resultArray=[];
    
    for(let i=0; i<docs.length; i++){
        resultArray.push({id:docs[i]._id , class: docs[i].class, board: docs[i].board, subject: docs[i].subject, name: docs[i].name, publisher: docs[i].publisher, author: docs[i].author, price: docs[i].price});
    }
    res.render('studentBookSearch.ejs', {resultArray: resultArray,user: req.user});
  });
});
app.post('/studentAddToCart', function(req, res){
  if(!req.isAuthenticated()){
    res.redirect('/signup_login');
  }
  const customerUsername= req.user.username;
  const bookID= req.body.bookID;
  Customer.findOne(
    {username: customerUsername},
    function(err, doc){
      console.log(customerUsername)
      let flag= false;
      console.log(doc);
      for(let i=0; i<doc.bookCart.length; i++){
        if(doc.bookCart[i].bookID===bookID){
          flag=true;
          break;
        }
      }
      if(!flag){
        Customer.updateOne(
          {username:customerUsername},
          {$push: {bookCart: {bookID: bookID} } },
          function(err){
            console.log(err);
          }
        );
      }
    }
  );
});
app.get('/studentCart', function(req, res){
  if(!req.isAuthenticated()){
    res.redirect('/signup_login');
  }
  var productArray = []
  var cartItems= [];
  Customer.findOne(
    {username: req.user.username}, 
    function(err, doc){
      console.log("Cart Size: " + doc.bookCart.length);
      for(var i=0; i<doc.bookCart.length; i++){
        productArray.push({bookID: doc.bookCart[i].bookID})
      }
      console.log("Product Array Size: "+productArray.length);
      if(productArray.length===0)
        res.render('studentCart.ejs', {cartItems:cartItems, user:req.user});
      for(var i=0; i<productArray.length; i++){
        let currIndex= i;
        let productArrayLength= productArray.length;
        Book.findOne({_id: productArray[i].bookID}, function(err, doc){
          cartItems.push({
            name: doc.name,
            price: doc.price,
            class: doc.class,
            bookID: doc._id
          });
          console.log("Cart Items: "+ cartItems);
          if(currIndex===productArrayLength-1){
            console.log("Hellooooo")
            res.render('studentCart.ejs', {cartItems: cartItems, user: req.user});
          }
        });
      }
    }
  );
});
app.post('/studentCart', function(req, res){
  if(!req.isAuthenticated())  res.redirect('/studentCart');
  console.log("- - - - - - - Finding best bookstores for user: "+req.user.username);
  customerUsername= req.user.username;
  booksArray= [];
  Customer.findOne({username: customerUsername}, function(err, doc){
    //Making a list of books in the cart
    for(var i=0; i<doc.bookCart.length; i++){
      booksArray.push(doc.bookCart[i].bookID);
    }
    console.log(booksArray);
    Bookstore.find({}, function(err, docs){
      console.log("Here are the docs: ");
      console.log(docs);
      //Iterating through every bookstore and finding out the price of bundle
      bestBookstores= []
      for(var i=0; i<docs.length; i++){
        books=[]
        price=[]
        if(docs[i].city!=req.body.city)
          continue;
        var count=0;
        var totalPrice=0;
        for(var j=0; j<booksArray.length; j++){
          docs[i].bookdb.forEach((book)=>{
            if(book.bookID===booksArray[j]){
              count= count+1;
              totalPrice= totalPrice+ book.sellPrice;
              // console.log("bookid "+book.bookID);
              // Book.findOne({_id: book.bookID}, function(err, docs_book){
              //   console.log("bookname "+docs_book.name);
              //   books.push(docs_book.name)
              // });
              // price.push(book.sellPrice);
            }
          });
        }
        if(count!=booksArray.length) continue;
        bestBookstores.push({username: docs[i].name, totalPrice: totalPrice, books: books, price: price});
      }
      bestBookstores.sort((a, b) => a.totalPrice > b.totalPrice ? 1 : -1);
      console.log("best book store-")
      console.log(bestBookstores);
      res.render('studentBestBookstores.ejs', {bestBookstores: bestBookstores, user: req.user});
    });
  });
});
app.post('/removeFromStudentCart', function(req, res){
  console.log("Presenting the cart");
  Customer.findOne(
    {username: req.user.username},
    function(err, doc){
      if(err){
        console.log("ERROR ERROR");
      }
      cartItems = doc.bookCart;
      console.log("Cart Items: "+ cartItems);
      newCartItems= cartItems.filter(item=>{
        console.log(item.bookID);
        console.log(req.body.bookID);
        if(item.bookID===req.body.bookID)
          console.log("FOUND");
        return item.bookID!=req.body.bookID;
      });
      console.log(newCartItems);
      doc.bookCart= newCartItems;
      doc.save();
      res.redirect('/studentCart');
    }
  );
});

app.get('/contact', function(req, res){
  res.render('contact.ejs', {user: req.user});
});

app.listen(3000, function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Server started at port 3000");
    }      
});