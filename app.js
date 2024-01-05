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
const socket = require('socket.io');
const userModel = require('./models/userModel.js');
const CategorieModel = require('./models/Categorie.model.js');
const DemandeModel = require('./models/Demande.model.js');
const devisModel = require('./models/devis.model.js');

const PORT = process.env.PORT || 5001;
let server = app.listen(PORT, async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.log(err.message);
  }
  console.log(`Listening on ${PORT}`);
});
const io = socket(server, {
  pingTimeout: 6000,
  cors: {
    "Access-Control-Allow-Origin": "*",
    origin: "*",
    // credentials: true,
  },
});

global.onlineUsers = new Map();
const onlineUsers2 = new Map();
io.on("connection", (socket) => {
  console.log(`a user connected ${socket}`);
  global.chatSocket = socket;

  socket.on("add-user", (userId) => {
    // onlineUsers.set(userId, socket.id);
    onlineUsers2.set(userId, {  location: null });
  });
  socket.on("offline_client", (userIDD) => {
    // console.log("user disconnected ID",userIDD);
    socket.broadcast.emit('offline', userIDD);
  }
  );
  socket.on("enRoute", (userId)=> {
    console.log("enRoute_on",userId)
    const user = onlineUsers2.get(userId.userId);
    // if (user) {
    //   user.enRoute = true; // Assuming you have an enRoute property in the user object
    //   onlineUsers2.set(userId.userId, user);
    // }

    console.log(userId)
    // Broadcast the enRoute status to all connected clients
    socket.broadcast.emit('userEnRoute', { userId: userId.userId, enRoute: userId.enRoute });
  })
  socket.on('locationUpdate', async(location) => {
    // console.log('Received location update:', location);

    // Update the location in the onlineUsers2 Map
    const user = onlineUsers2.get(location.userId);
    if (user) {
      user.location = location;
      onlineUsers2.set(location.userId, user);
    }
    // try {
    //   // const {  address } = req.body; // Assuming you send userId and newAddress in the request body

    //   // Find the user by userId
    //   const user = await userModel.findById(location?.userId);

    //   if (!user) {
    //     return
    //   }

    //   // Call the addAddress method to update the user's address
    //   const u =await user.addAddress({
    //     latitude: location.location.latitude,
    //   longitude: location.location.longitude

    //   });
    //   // console.log(u)

    //   // res.json({ message: 'Address updated successfully.', user:u });
    // } catch (error) {
    //   console.error(error);
    //   console.log(error)
    //   // res.status(500).json({ error: 'Internal Server Error' });
    // }
    // console.log("Map :: ::   :  : : : : : : ", location)

    // Broadcast the location to all connected clients
    socket.broadcast.emit('newLocation', location);
  });
  let userid;
  socket.on("clientData",async (userId) => {
    console.log("data",userId)
    userid=userId;
    userid = userId?.user;
    try {
      // Find the user by ID
      const user = await userModel.findById(userid);

      if (!user) {
        // return res.status(404).json({ message: 'User not found' });
      }

      // Toggle the online status
      user.onligne = true;

      // Save the updated user
      await user.save();

      // Respond with the updated user object or just a success message
      // res.status(200).json({ message: 'User status updated successfully', user: user });
    } catch (error) {
      console.error(error);
      // res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  socket.on("clientData2", (userId) => {
    console.log("data2",userId)
  });
  socket.on('disconnect', async() => {
    console.log('User disconnected');
    console.log("userConnected_id", userid)
    socket.broadcast.emit('offline', userid);
    if(!userid){return;}
    try {
      // Find the user by ID
      const user = await userModel.findById(userid);

      if (!user) {
        // return res.status(404).json({ message: 'User not found' });
      }

      // Toggle the online status
      user.onligne = false;

      // Save the updated user
      await user.save();

      // Respond with the updated user object or just a success message
      // res.status(200).json({ message: 'User status updated successfully', user: user });
    } catch (error) {
      console.error(error);
      // res.status(500).json({ message: 'Internal Server Error' });
    }
    // Remove the user from the onlineUsers Map when they disconnect
    onlineUsers.forEach((userData, userId) => {
      if (userData.socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    });
    // console.log("data disconnected",userId)
  });
  console.log(global.onlineUsers)

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("new message", async (devis) => {
    try {
        console.log("devis", devis);
        var data = devis.data;
        let cat ;
        if(data?.categorie) {
           cat = await CategorieModel.findById(data?.categorie);
        }
        let missio
        if(data?.mission) {
           missio = await DemandeModel.findById(data?.mission);
        }
        const devis1 = await devisModel.findById(data?._id).populate("categorie").populate("mission").populate("partner")
        console.log(devis1)
        if (!data.partner) {
            if(missio?.driverIsAuto) {
              const usersToBroadcast = await userModel.find({ role: { $nin: ["PARTNER", "ADMIN"] } });
            usersToBroadcast.forEach((user) => {
                user.Newsocket.push({
                 ...devis1?._doc
                });
                user.save();
            });
            socket.broadcast.emit("message recieved", devis1);
            return;
          }else{
        const user = await userModel.findById(missio?.driver);
        if (!user) {
            console.error("User not found");
            return;
        }
        user.Newsocket.push({
          ...devis1?._doc
        });
        await user.save();
        socket.in(devis.partner).emit("message recieved", devis1);
        socket.broadcast.emit("message recieved", devis1);
          }
        }
        const user = await userModel.findById(data.partner);
        if (!user) {
            console.error("User not found");
            return;
        }
        user.Newsocket.push({
         ...devis1?._doc
        });
        await user.save();
        socket.broadcast.emit("message recieved", devis1);
        console.log(socket)
      } catch (error) {
        console.error("Error handling new message:", error);
      }
  });
  socket.on('error', (error) => {
    console.error('Socket error:', error);
});

  // when the partner accept the devis
  socket.on("accept devis", async (devis) => {
    console.log(devis)
    try {
        var data = devis;
        let cat ;
        if(data?.categorie) {
           cat = await CategorieModel.findById(data?.categorie);
        }
        let missio
        if(data?.mission) {
           missio = await DemandeModel.findById(data?.mission);
        }
        const devis1 = await devisModel.findById(data?._id).populate("categorie").populate("mission").populate("partner")
        console.log(devis1)
        devis1.status = "Accepted";
        await devis1.save();
        console.log(devis1)

            if(missio?.driverIsAuto) {
              const usersToBroadcast = await userModel.find({ role: { $nin: ["PARTNER"] } });
            usersToBroadcast.forEach((user) => {
                user.Newsocket.push({
                 ...devis1?._doc
                });
                user.save();
            });

            socket.broadcast.emit("message recieved", devis1);
            return;
          }else{
        const user = await userModel.findById(missio?.driver);
        if (!user) {
            console.error("User not found");
            return;
        }
        user.Newsocket.push({
          ...devis1?._doc
        });
        socket.broadcast.emit("message recieved", devis1);
        console.log("driver", devis1)
        await user.save();
        socket.in(devis.partner).emit("message recieved", devis1);
          }

        const user = await userModel.findById(data.partner);
        if (!user) {
            console.error("User not found");
            return;
        }
        user.Newsocket.push({
         ...devis1?._doc
        });
        await user.save();
        socket.broadcast.emit("message recieved", devis1);
        console.log(socket)
      } catch (error) {
        console.error("Error handling new message:", error);
      }
  });
  socket.on("join chat", (room) => {
    socket.join(room);
  });



  socket.off("setup", () => {
    socket.leave(userData._id);
  });
});

// io.listen(  "https://convoyage.onrender.com")

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  app.use(passport.initialize())
  require('./security/passport')(passport)
  // connectDB();

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