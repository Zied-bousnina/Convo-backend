var express = require('express');
var path = require('path');
// var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config()
var indexRouter = require('./routes/index');
const mongoose = require('mongoose')

const userRoutes = require('./routes/userRoutes.js');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// connect to db =
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("connected to db"))
.catch(err=>console.log(err))
app.use('/api', indexRouter);
app.use('/api/users', userRoutes);


module.exports = app;
