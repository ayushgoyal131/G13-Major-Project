const express= require('express');
const ejs = require('ejs');
const mongoose= require('mongoose');
const bodyParser= require('body-parser');
const session= require('express-session');
const passport= require('passport');
const passportLocalMongoose= require('passport-local-mongoose');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

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

const CustomerSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String
});
const SellerSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  products: [{name:String, quantity:Number, img: { data: Buffer, contentType: String }} ]
});
CustomerSchema.plugin(passportLocalMongoose);
SellerSchema.plugin(passportLocalMongoose);

const Customer = mongoose.model("Customer", CustomerSchema);
const Seller= mongoose.model("Seller", SellerSchema);
passport.use(Customer.createStrategy());
passport.serializeUser(Customer.serializeUser());
passport.deserializeUser(Customer.deserializeUser());

passport.use(Customer.createStrategy());
passport.serializeUser(Seller.serializeUser());
passport.deserializeUser(Seller.deserializeUser());

app.get('/', function (req, res) {
    console.log("Entered homepage");
    res.render('index.ejs', {});
});
 

app.get('/login', function(req, res){
    res.render('login.ejs',{});
})

app.get('/signup', function(req, res){
  res.render('signup.ejs',{});
})

app.post('/signup', function(req, res){
  Customer.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect('/signup');
    }else{
      passport.authenticate("local")(req, res, function(){
        console.log("Success");
      });
    }
  });
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
      passport.authenticate("local")(req, res, function(){
        console.log("Success");
      });
    }
  });


});

app.get('/seller/login', function(req, res){
  res.render('sellerlogin.ejs',{});
})

app.get('/seller/signup', function(req, res){
res.render('sellersignup.ejs',{});
})

app.post('/seller/signup', function(req, res){

  Seller.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect('/seller/signup');
    }else{
      passport.authenticate("local")(req, res, function(){
        console.log("Success");
      }); 
    }
  });

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
    passport.authenticate("local")(req, res, function(){
      console.log("Success");
    });
  }
});


});

app.get('/makeinindia', function(req, res){
  res.render('makeinindia.ejs',{});
})



app.listen(3000, function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Server started at port 3000");
    }
       
});