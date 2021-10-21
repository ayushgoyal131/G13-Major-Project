const express= require('express');
const ejs = require('ejs');
const mongoose= require('mongoose');
const bodyParser= require('body-parser');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/majorProjectDB', {useNewUrlParser: true, useUnifiedTopology: true});
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

const CustomerSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String
});

const Customer = mongoose.model("Customer", CustomerSchema);



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

  console.log(req.body);

  var name= req.body.name;
  var username= req.body.username;
  var password = req.body.password;

  console.log("Here: ", name, username, password);

  Customer.findOne({ username: username}, function (err, docs) {
    if (err){
        console.log(err);
    }
    else{
        if(docs){
          console.log("User already exists");
        }else{
          var cust= new Customer({name: name, username: username, password: password});
          cust.save();
        }
    }
  });


});

app.post('/login', function(req, res){

  var username= req.body.username;
  var password = req.body.password;

  Customer.findOne({ username: username}, function (err, docs) {
    if (err){
        console.log(err);
    }
    else{
        if(docs){
          if(password===docs.password){
            console.log("Login Successful");
          }else{
            console.log("Incorrect password");
          }
        }else{
          console.log("User doesn't exist");
        }
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