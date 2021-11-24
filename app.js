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

const app = express();

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
  cart: [{sellerID:String, productName:String, quantity: Number}]
});
const SellerSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  products: [{name:String, quantity:Number, price:Number , img: { data: Buffer, contentType: String }} ]
});
CustomerSchema.plugin(passportLocalMongoose);
SellerSchema.plugin(passportLocalMongoose);

const Customer = mongoose.model("Customer", CustomerSchema);
const Seller= mongoose.model("Seller", SellerSchema);

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
    req.logout();
    res.render('login.ejs',{});
});
app.post('/login', function(req, res){

  const customer= new Customer({
      username: req.body.username,
      password: req.body.password
  });
  
  req.login(customer, function(err){
    if(err){
      console.log(err);
      res.redirect('/login');
    }else{
      passport.authenticate("customerLocal")(req, res, function(){
        console.log("Success");
        res.redirect('/makeinindia');
      });
    }
  });
});

app.get('/signup', function(req, res){
  res.render('signup.ejs',{});
});
app.post('/signup', function(req, res){
  Customer.register({username: req.body.username, name:req.body.name}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect('/signup');
    }else{
      passport.authenticate("customerLocal")(req, res, function(){
        console.log("Success");
        res.redirect('/login');
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
app.post('/seller', upload.single('userPhoto'), function(req, res){
  console.log(JSON.stringify(req.file));
  Seller.findOneAndUpdate(
    {username: req.user.username}, 
    { $push: {products: {name: req.body.name, quantity: req.body.quantity, img: {data: fs.readFileSync(req.file.path), contentType: "image/png" } }}},
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

  var cartItems= [];
  console.log("HIIIIIIII");
  Customer.findOne({username: req.user.username}, function(err, doc){
    async function sellerFunc() {
      console.log(doc.cart.length);
      for(var i=0; i<doc.cart.length; i++){
        var sellerID= doc.cart[i].sellerID;
        var productName= doc.cart[i].productName;
        var quantity= doc.cart[i].quantity;
        try{
          await Seller.findById(sellerID, function(err, sellerDoc){
            async function findProductFunction(){
              let obj = await sellerDoc.products.find(o => o.name === productName);
              console.log(obj.name);
              cartItems.push({image: obj.img, name: obj.name, quantity: quantity});
            }
            findProductFunction();
            console.log("hi");
          }).clone();
        }catch(e){
          console.log("Error is HERE");
          console.log(e); 
        }
      }
      console.log(cartItems.length);
      console.log("BYEEE"); 
      // console.log(cartItems);
      res.render('cart.ejs', {cartItems: cartItems});
      // console.log(cartItems);
    }
    sellerFunc();
    
  });
      
});

app.get('/cart/deliveryAddress',function(req, res){
  res.render('deliveryAdd.ejs',{});
});

app.get('/cart/payment',function(req, res){
  res.render('payment.ejs',{});
});


app.get('/orders', function(req, res){
  res.render('orders.ejs', {});
})
app.get('/orders/cancelled-orders', function(req, res){
  res.render('order_cancel.ejs', {});
})
app.get('/track_order', function(req, res){
  res.render('track_order.ejs', {});
})

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
  Seller.find({"products.name":req.body.searchItem}, {products: {$elemMatch: {name: req.body.searchItem}}}, function(err, docs){
    var resultArray=[];
    console.log(docs);
    
    for(let i=0; i<docs.length; i++){
      for(let j=0; j<docs[i].products.length; j++){
        resultArray.push({id:docs[i]._id , name: docs[i].products[j].name, image: docs[i].products[j].img});
      }
    }
    res.render('makeinindia.ejs', {resultArray: resultArray});
  });
});

app.post('/addToCart', function(req, res){
  if(!req.isAuthenticated()){
    res.redirect('/login');
  }
  const username= req.user.username;
  const sellerID= req.body.id;
  const productName= req.body.name;
    
    // ADDING PRODUCT TO USER CART
    var flag= false;
    var newcart=[];
    Customer.findOne({username:username}, function(err, doc){
        newcart= doc.cart;
        for(var i=0; i<newcart.length; i++){
          if(newcart[i].sellerID===sellerID && newcart[i].productName===productName){
            flag=true;
            console.log("Product already exists in the cart");
            newcart[i].quantity++;
            break;
          }
        }
        if(flag==false){
          console.log("Product doesn't exist in the cart");
          newcart.push({sellerID: sellerID, productName: productName, quantity:1});
        }

        console.log("Cart", newcart);

        Customer.findOneAndUpdate({username:username}, {$set:{cart: newcart}}, function(err, docs){
          if(err){
            console.log(err);
          }else{
            console.log("Cart Updated successfully");
          }
          res.redirect('/cart');
        });
    });

    

    
});


app.listen(3000, function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Server started at port 3000");
    }      
});