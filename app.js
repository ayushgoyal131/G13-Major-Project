const express= require('express');
const ejs = require('ejs');
const mongoose= require('mongoose');
const bodyParser= require('body-parser');


const app = express();
mongoose.connect('mongodb://localhost:27017/wikiDB', {useNewUrlParser: true, useUnifiedTopology: true});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.render('index.ejs', {});
  })
 
  
app.get('/login', function(req, res){
    res.render('login.ejs',{});
})

app.get('/signup', function(req, res){
  res.render('signup.ejs',{});
})

app.get('/makeinindia', function(req, res){
  res.render('makeinindia.ejs',{});
})

app.listen(3000, function(req, res){
        console.log("Server started at port 3000");
});