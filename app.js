const express= require('express');
const ejs = require('ejs');
const mongoose= require('mongoose');
const bodyParser= require('body-parser');
const session= require('express-session');
const passport= require('passport');
const passportLocalMongoose= require('passport-local-mongoose');
const fs= require('fs');  //for image upload support
const multer= require('multer');  //for image upload support

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

app.get('/signup', function(req, res){
  res.render('signup.ejs',{});
});
app.post('/signup', function(req, res){
  Customer.register({username: req.body.username, name:req.body.name}, req.body.password, function(err, user){
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
      passport.authenticate("local")(req, res, function(){
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

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/seller');
});


app.get('/makeinindia', function(req, res){
  Seller.findOne({username:"weddingzeal@gmail.com"}, function(err, doc){
    res.render('makeinindia.ejs', {image: doc.products[0].img});
  });
  // res.render('makeinindia.ejs',{});
});
app.post('/makeinindia', function(req, res){
  Seller.find({"products.name":"Redmi 4"}, {products: {$elemMatch: {name: "Redmi 4"}}}, function(err, doc){
    res.render('makeinindia.ejs', {image: doc[0].products[0].img});
  });
});



app.listen(3000, function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Server started at port 3000");
    }
       
});