var express = require('express');
var path = require('path');
// var cookieParser = require('cookie-parser');
require('colors');
var logger = require('morgan');
require('dotenv').config()
var indexRouter = require('./routes/index');
const mongoose = require('mongoose')
const passport = require('passport');
const userRoutes = require('./routes/userRoutes.js');
const BasicInfoRoutes = require('./routes/BasicInfo.js');
const connectDB = require('./config/db.js');
const formData = require('express-form-data');
const morgan = require('morgan');
var app = express();

const http = require('http');
const socket = require('socket.io')

const server = http.createServer(app)
const io = socket(server,{
  pingTimeout: 6000,
    cors: {
      origin: '*'
    }
}) //in case server and client run on different urls

// io.on("connection", (socket) => {
//   console.log(`a user connected ${socket.id}`);

//   socket.on("send_message", (data) => {
//     socket.broadcast.emit("receive_message", data);
//   });
// });
io.on("connection", (socket) => {
  console.log(`a user connected ${socket}`);

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });
  socket.on("new message", (devis) => {
    console.log("devis",devis)
    var data = devis.data;

      // if (data?.sender == devis.partner) return;
      socket.in(devis.partner).emit("message recieved", data)
      socket.broadcast.emit("message recieved", data);

      ;

  });

  socket.on("join chat", (room) => {
    socket.join(room);
  });



  socket.off("setup", () => {
    socket.leave(userData._id);
  });
});
io.listen(5000)

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  app.use(passport.initialize())
  require('./security/passport')(passport)
  connectDB();

  app.use(formData.parse());


  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

app.use(express.json());
app.use(express.urlencoded({extended: false}));

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
app.use('/api/basicInfo', BasicInfoRoutes);


module.exports = app;