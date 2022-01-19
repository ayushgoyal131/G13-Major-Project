const express= require('express');
const ejs = require('ejs');
const mongoose= require('mongoose');
const bodyParser= require('body-parser');
const session= require('express-session');
const passport= require('passport');
const passportLocalMongoose= require('passport-local-mongoose');
const fs= require('fs');  //for image upload support
const multer= require('multer');  //for image upload support
var LocalStrategy = require('passport-local').Strategy;
const fetch = require("isomorphic-fetch");

const app = express();

//for captcha
const request = require('request');
const { post } = require('request');
app.use(express.urlencoded({extended:false}));
app.use(express.json());

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname + 'public'));

app.use(session({
  secret:"our little secret",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/majorProjectDB', {useNewUrlParser: true, useUnifiedTopology: true});
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());



// app.use(multer({dest: './uploads/',
//   rename: function(fieldname, filename){
//     return filename;
//   },
// }));

const CustomerSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  cart: [{productID: String, quantity: Number}]
});
const SellerSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  productIDs: [String]
});
CustomerSchema.plugin(passportLocalMongoose);
SellerSchema.plugin(passportLocalMongoose);

const ProductSchema = new mongoose.Schema({
  name: String,
  quantity: String,
  price: Number,
  img: { data: Buffer, contentType: String },
  sellerUsername: String
});

const Customer = mongoose.model("Customer", CustomerSchema);
const Seller= mongoose.model("Seller", SellerSchema);
const Product = mongoose.model("Product", ProductSchema);

passport.use('customerLocal', new LocalStrategy(Customer.authenticate()));
passport.use('sellerLocal', new LocalStrategy(Seller.authenticate()));
passport.serializeUser(function(user, done) { 
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  if(user!=null)
    done(null,user);
});

// passport.use(Customer.createStrategy());
// passport.serializeUser(Customer.serializeUser());
// passport.deserializeUser(Customer.deserializeUser());
// passport.use(Seller.createStrategy());
// passport.serializeUser(Seller.serializeUser());
// passport.deserializeUser(Seller.deserializeUser());

app.get('/', function (req, res) {
    console.log("Entered homepage");
    res.render('index.ejs', {});
});
 

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




app.get('/seller',  function(req, res){
  if(req.isAuthenticated()){
    const username= req.user.username;
    
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
    
  }else{
    res.redirect('/seller/login');
  }
});

app.get('/seller/dashboard', function(req, res){
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



app.get('/cart',function(req, res){
  if(!req.isAuthenticated()){
    res.redirect('/login');
  }
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
        res.render('cart.ejs', {cartItems:cartItems});
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
            res.render('cart.ejs', {cartItems: cartItems});
          }
        });
      }
    }
  );
});

app.get('/deliveryAddress',function(req, res){
  res.render('checkout_address.ejs',{});
});

app.post('/deliveryAddress',function(req,res){
  res.render('checkout_address.ejs',{})
});

app.get('/payment',function(req, res){
  res.render('checkout_payment.ejs',{})
});

app.post('/payment',function(req,res){
  res.render('checkout_payment.ejs',{})
});

app.get('/pay',function(req, res){
  res.render('payment.ejs',{})
});

app.get('/checkout_review_payment',function(req,res){
  res.render('checkout_review_payment.ejs',{})
});

app.post('/checkout_review_payment',function(req,res){
  res.render('checkout_review_payment.ejs',{})
});

app.get('/place_order',function(req,res){
  res.render('payment_success.ejs',{})
});

app.post('/place_order',function(req,res){
  res.render('payment_success.ejs',{})
});


app.get('/orders', function(req, res){
  res.render('orders.ejs', {});
});

app.get('/order-details', function(req, res){
  res.render('order-details.ejs', {});
});

app.get('/wishlist', function(req, res){
  res.render('wishlist.ejs', {});
});



app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/seller');
});

app.get('/makeinindia', function(req, res){
  Seller.findOne({username:"weddingzeal@gmail.com"}, function(err, doc){
    res.render('makeinindia.ejs', {resultArray: []});
  });
  // res.render('makeinindia.ejs',{});
});
app.post('/makeinindia', function(req, res){
  Product.find({name:req.body.searchItem}, function(err, docs){
    var resultArray=[];
    
    for(let i=0; i<docs.length; i++){
        resultArray.push({id:docs[i]._id , name: docs[i].name, price: docs[i].price, image: docs[i].img});
    }
    res.render('makeinindia.ejs', {resultArray: resultArray});
  });
});

app.post('/addToCart', function(req, res){
  if(!req.isAuthenticated()){
    res.redirect('/login');
  }
  const customerUsername= req.user.username;
  const productID= req.body.productID;
  
  Customer.updateOne(
    {username:customerUsername},
    {$push: {cart: {productID: productID, quantity: 1} } },
    function(err){
      console.log(err);
    }
  );

});

app.get('/register', function(req, res){
  res.render('register.ejs', {});
});

app.get('/contact', function(req, res){
  res.render('contact.ejs', {});
});

app.listen(3000, function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Server started at port 3000");
    }      
});