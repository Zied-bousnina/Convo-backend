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
const profileRoutes = require('./routes/profiles.route.js');
const chatRoutes = require('./routes/chat.route.js');
const BasicInfoRoutes = require('./routes/BasicInfo.js');
const Todo = require('./routes/calendar.Routes.js');
const connectDB = require('./config/db.js');
const formData = require('express-form-data');
const morgan = require('morgan');
var app = express();
const session = require('express-session');
const http = require('http');
const socket = require('socket.io');
const userModel = require('./models/userModel.js');
const CategorieModel = require('./models/Categorie.model.js');
const DemandeModel = require('./models/Demande.model.js');
const devisModel = require('./models/devis.model.js');
const cron = require('node-cron');
const PORT = process.env.PORT || 5001;
// const PORT = process.env.PORT || 5001;
const cors = require('cors');
var mailer = require('./utils/mailer');
const { generateEmailTemplatePartnerApproval, generateEmailTemplateMissionDelayed } = require('./utils/mail.js');
const chatModel = require('./models/chat.model.js');
const { updateAllUsersUniqueId } = require('./controllers/users.controller.js');
let server = app.listen(PORT, async (req, res) => {
  try {
    await connectDB();
  } catch (err) {

  }

});
// cron.schedule('0 * * * *', async () => {
//   // Check and update status for all 'confirmée' missions
//   const confirmeeMissions = await devisModel.find({ status: 'Confirmée' }).populate("mission");
//   const confirmeedevis = await DemandeModel.find({ status: 'Confirmée' });
//   const Affectéeemission = await DemandeModel.find({ status: 'Affectée' }) .populate("driver")
//   const AffectéeDevis = await devisModel.find({ status: 'Affectée' }).populate({
//     path: 'mission',
//     populate: {
//       path: 'driver',
//     }
//   });;

//   confirmeeMissions.forEach(async (mission) => {
//       const twoHoursInMillis = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
//       const currentTime = new Date();
//       const timeDifference = currentTime - mission.mission.dateDepart;
//

//       // If more than 2 hours have passed, update the status to 'En retard'
//       if (timeDifference >= twoHoursInMillis) {
//           mission.status = 'En retard';
//           await mission.save();
//       }
//   });
//   AffectéeDevis.forEach(async (mission) => {
//     const twoHoursInMillis = 24* 60 * 60 * 1000; // 2 hours in milliseconds
//     const currentTime = new Date();
//     const timeDifference = currentTime - mission.mission.dateDepart;

//     // If more than 2 hours have passed, update the status to 'En retard'
//     if (timeDifference >= twoHoursInMillis) {
//       mailer.send({
//         to: ["zbousnina@yahoo.com", mission?.mission?.driver.email],
//         subject: "Important: Mission Delayed Notification",
//         html: generateEmailTemplateMissionDelayed(mission?.mission?.driver?.name,mission?.mission?.postalAddress, mission?.mission?.postalDestination),
//       }, (err) => {});
//     }
// });
// Affectéeemission.forEach(async (mission) => {
//   const twoHoursInMillis = 24* 60 * 60 * 1000; // 2 hours in milliseconds
//   const currentTime = new Date();
//   const timeDifference = currentTime - mission.dateDepart;

//   // If more than 2 hours have passed, update the status to 'En retard'
//   if (timeDifference >= twoHoursInMillis) {
//     mailer.send({
//       to: ["zbousnina@yahoo.com", mission?.driver.email],
//       subject: "Important: Mission Delayed Notification",
//       html: generateEmailTemplateMissionDelayed(mission?.driver?.name,mission?.postalAddress, mission?.postalDestination),
//     }, (err) => {});
//   }
// });
// confirmeedevis.forEach(async (mission) => {
//   const twoHoursInMillis = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
//   const currentTime = new Date();
//   const timeDifference = currentTime - mission.dateDepart;

//   // If more than 2 hours have passed, update the status to 'En retard'
//   if (timeDifference >= twoHoursInMillis) {
//       mission.status = 'En retard';
//       await mission.save();
//   }
// });
// });
const io = socket(server, {
  pingTimeout: 6000,
  cors: {
    "Access-Control-Allow-Origin": "*",
    origin: "*",
    // credentials: true,
  },
});
app.set("socketio", io);

global.onlineUsers = new Map();
const onlineUsers2 = new Map();

io.on("connection", (socket) => {

  global.chatSocket = socket;




    // Join a chat room
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);

    });

    // Handle sending a new message
    socket.on("sendMessage", async ({ recieverId, userId, content }) => {

      try {
        const message =content

        const chat = await chatModel.findOne({
          $or: [
            { admin: userId, partner: recieverId },
            { admin: recieverId, partner: userId },
          ],
        }).populate([
          { path: "admin", select: "name email" },
          { path: "partner", select: "name email" },
        ]);

        if (chat) {
          // chat.messages.push(message); // Add the new message
          // chat.lastMessage = message.content; // Update the last message
          // chat.lastMessageTimestamp = message.timestamp; // Update the timestamp

          // await chat.save(); // Save the chat with the new message

          socket.broadcast.emit("newMessage", {...message, recieverId})
          // io.to(recieverId).emit("newMessage", message); // Emit the new message event
        } else {
          console.error("Chat not found");
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });


  socket.on("readMessages", async ({ recieverId, userId }) => {

    try {
      const chat = await chatModel.findOne({
        $or: [
          { admin: userId, partner: recieverId },
          { admin: recieverId, partner: userId },
        ],
      });
      if (!chat) {
        console.error("Chat not found:", recieverId);
        return;
      }

      let updated = false;
      chat.messages.forEach((message) => {
        if (!message.read && message.sender.toString() !== userId) {
          message.read = true;
          updated = true;
        }
      });

      if (updated) {
        await chat.save();
      }

      io.to(recieverId).emit("messagesRead", { recieverId, reader: userId });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  });



  // socket.on('disconnect', () => {

  // });

  socket.on("add-user", (userId, currentLocation) => {

    if (onlineUsers2.has(userId)) {
        // User already exists, delete the existing entry
        onlineUsers2.delete(userId);
    }
    // Add the new entry
    onlineUsers2.set(userId, { location: currentLocation });
    let newLocationData = {
      userId: userId,
      location: currentLocation
  };
  onlineUsers2.forEach((userData, userId) => {

    socket.broadcast.emit('newLocation', {
        userId: userId,
        location: {latitude: userData.location?.latitude, longitude: userData.location?.longitude}
    });
});

});

socket.on("getOnlineUserss",(data)=> {

  onlineUsers2.forEach((userData, userId) => {

    socket.broadcast.emit("getonline")

    socket.broadcast.emit('newLocation', {
        userId: userId,
        location: {latitude: userData.location?.latitude, longitude: userData.location?.longitude}
    });
  });
});

  socket.on("offline_client", (userIDD) => {

    socket.broadcast.emit('offline', userIDD);
  }
  );
  socket.on("enRoute", (userId)=> {

    const user = onlineUsers2.get(userId.userId);
    // if (user) {
    //   user.enRoute = true; // Assuming you have an enRoute property in the user object
    //   onlineUsers2.set(userId.userId, user);
    // }


    // Broadcast the enRoute status to all connected clients
    socket.broadcast.emit('userEnRoute', { userId: userId.userId, enRoute: userId.enRoute });
  })
  socket.on('locationUpdate', async(location) => {


    // Update the location in the onlineUsers2 Map
    const user = onlineUsers2.get(location.userId);
    if (user) {
      user.location = location;
      onlineUsers2.set(location.userId, user);
    }


    socket.broadcast.emit('newLocation', location);
  });
  let userid;
  socket.on("clientData",async (userId) => {

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

  });
  socket.on('disconnect', async() => {

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
    onlineUsers2.forEach((userData, userId) => {
      if (userData.socketId === socket.id) {
        onlineUsers2.delete(userId);

      }
    });

  });

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });


  socket.on('error', (error) => {
    console.error('Socket error:', error);
});
socket.on("new message", async (devis) => {
  try {

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
      const devis2 = await devisModel.findById(data?._id)
  .populate({
    path: 'mission',
    select: '_id postalAddress postalDestination distance driverIsAuto driver'
  })
  .populate({
    path: 'partner',
    select: '_id contactName email phoneNumber'
  })
  .populate({
    path: 'categorie',
    select: '_id description unitPrice'
  });


      if (!data.partner) {
          if(missio?.driverIsAuto) {
            const usersToBroadcast = await userModel.find({ role: { $nin: ["PARTNER", "ADMIN"] } });
          usersToBroadcast.forEach((user) => {
              user.Newsocket.push({
               ...devis2?._doc
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
        ...devis2?._doc
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
       ...devis2?._doc
      });
      await user.save();
      socket.broadcast.emit("message recieved", devis1);

    } catch (error) {
      console.error("Error handling new message:", error);
    }
});

socket.on("new mission", async (mission) => {

  try {
      const data = mission;

      // const doc = { ...data, newMissionPartner: true };
      const missio = await DemandeModel.findById(data?.demande?._id)
          .populate("categorie")
          .populate("mission")
          .populate("user");
      const missio2 = await DemandeModel.findById(data?.demande?._id)
  .populate({
    path: 'mission',
    select: '_id postalAddress postalDestination distance driverIsAuto driver'
  })
  .populate({
    path: 'user',
    select: '_id contactName email phoneNumber'
  })
  .populate({
    path: 'categorie',
    select: '_id description unitPrice'
  });
  const doc = { ...missio2?._doc, newMissionPartner: true };
      // Broadcast to users who are not PARTNER
      // const usersToBroadcast = await userModel.find({ role: { $nin: ["PARTNER"] } });
      // usersToBroadcast.forEach((user) => {

      //     user.Newsocket.push({ ...doc });
      //     user.save();
      // });

      // Broadcast to the driver or ADMIN
      const user = await userModel.findOne({
          $or: [
              // { _id: missio?.driver },
              { role: "ADMIN" }
          ]
      });

      if (!user) {
          console.error("User not found");
          return;
      }


      user.Newsocket.push({ ...doc });
      await user.save();
      socket.broadcast.emit("message received", missio?._doc);

      // Broadcast to the partner
      const partnerUser = await userModel.findById(data.partner);
      if (partnerUser) {

          partnerUser.Newsocket.push({ ...doc });
          await partnerUser.save();
          socket.in(data.partner).emit("message received", missio);
      }
      socket.broadcast.emit("Admin notification", {...doc});
  }
  catch (error) {
    console.error(`Error in sending message : ${error}`);
  }
});

socket.on("refuse devis", async (devis) => {
    // await handleDevisStatusChange(devis, "rejected");
    try {
      const data = devis;
      let cat;
      if (data?.categorie) {
          cat = await CategorieModel.findById(data?.categorie);
      }

      let missio;
      if (data?.mission) {
          missio = await DemandeModel.findById(data?.mission);
          await DemandeModel.findByIdAndUpdate(data?.mission?._id, { status: "refusée" });
      }

      const devis1 = await devisModel.findById(data?._id)
          .populate("categorie")
          .populate("mission")
          .populate("partner");
          const devis2 = await devisModel.findById(data?._id)
  .populate({
    path: 'mission',
    select: '_id postalAddress postalDestination distance driverIsAuto driver'
  })
  .populate({
    path: 'partner',
    select: '_id contactName email phoneNumber'
  })
  .populate({
    path: 'categorie',
    select: '_id description unitPrice'
  });


      devis1.status = 'refusée';
      await devis1.save();

      const doc = { ...devis2?._doc, PartnerAccepted: 'rejected' };

      // Broadcast to users who are not PARTNER
      // const usersToBroadcast = await userModel.find({ role: { $nin: ["PARTNER"] } });
      // usersToBroadcast.forEach((user) => {

      //     user.Newsocket.push({ ...doc });
      //     user.save();
      // });

      // Broadcast to the driver or ADMIN
      const user = await userModel.findOne({
          $or: [
              { _id: missio?.driver },
              { role: "ADMIN" }
          ]
      });


      if (!user) {
          console.error("User not found");
          return;
      }


      user.Newsocket.push({ ...doc });
      await user.save();
      socket.broadcast.emit("message received", devis1);

      // Broadcast to the partner
      const partnerUser = await userModel.findById(data.partner);
      if (partnerUser) {

          partnerUser.Newsocket.push({ ...doc });
          await partnerUser.save();
          socket.in(data.partner).emit("message received", devis1);
      }
      socket.broadcast.emit("Admin notification", {...doc});
  } catch (error) {
      console.error("Error handling new message:", error);
  }
});

socket.on("accept devis", async (devis) => {

    // await handleDevisStatusChange(devis, "Accepted");
    try {
      const data = devis;
      let cat;
      if (data?.categorie) {
          cat = await CategorieModel.findById(data?.categorie);
      }

      let missio;
      if (data?.mission) {
          missio = await DemandeModel.findById(data?.mission);
          await DemandeModel.findByIdAndUpdate(data?.mission?._id, { status: "Confirmée" });
      }

      const devis1 = await devisModel.findById(data?._id)
          .populate("categorie")
          .populate("mission")
          .populate("partner");
          const devis2 = await devisModel.findById(data?._id)
  .populate({
    path: 'mission',
    select: '_id postalAddress postalDestination distance driverIsAuto driver'
  })
  .populate({
    path: 'partner',
    select: '_id contactName email phoneNumber'
  })
  .populate({
    path: 'categorie',
    select: '_id description unitPrice'
  });


      devis1.status = 'Confirmée';
      await devis1.save();

      const doc = { ...devis2?._doc, PartnerAccepted: 'Accepted' };

      if(missio?.driverIsAuto) {


      // Broadcast to users who are not PARTNER
      // const usersToBroadcast = await userModel.find({ role: { $nin: ["PARTNER", "ADMIN"] } });
      // usersToBroadcast.forEach((user) => {

      //     user.Newsocket.push({ ...doc });
      //     user.save();
      // });
    }
      // Broadcast to the driver or ADMIN
      const user = await userModel.findOne({
          $or: [
              // { _id: missio?.driver },
              { role: "ADMIN" }
          ]
      });

      if (!user) {
          console.error("User not found");
          return;
      }


      user.Newsocket.push({ ...doc });
      socket.broadcast.emit("message received", devis1);
      await user.save();

      // Broadcast to the partner
      const partnerUser = await userModel.findById(data.partner);
      if (partnerUser) {

          partnerUser.Newsocket.push({ ...doc });
          await partnerUser.save();
          socket.in(data.partner).emit("message received", devis1);
      }
      socket.broadcast.emit("Admin notification", {...doc});
  } catch (error) {
      console.error("Error handling new message:", error);
  }
});

socket.on("validate_me", async (devis) => {

  // output
//   -----------------------------------------------------------------------------------
// { userId: '659aea02d1eb35004e61c65a', role: 'ADMIN' }
// -----------------------------------------------------------------------------------

    // await handleDevisStatusChange(devis, "Accepted");
    try {
      const admin = await userModel.findOne({
        role:"ADMIN"
      });
      const user = await userModel.findById(devis?.userId);
      if (!user) {
          console.error("User not found");
          return;
      }
      admin.Newsocket.push({...devis,
        _id:user?._id,
        validate_me:true,
        driver:{
           name:user?.name,
           email:user?.email,

        } });
        socket.broadcast.emit("validate_me", {
          ...devis,
          _id:user?._id,
          validate_me:true,
         driver:{
            name:user?.name,
            email:user?.email,
            _id:user?._id

         }

        },

        );
      await admin.save();


  } catch (error) {
      console.error("Error handling new message:", error);
  }
});

  socket.on("join chat", (room) => {
    socket.join(room);
  });
  socket.on("MissionAccepted",()=> {

    socket.broadcast.emit("MissionAccepted")
  })



  socket.off("setup", () => {
    socket.leave(userData._id);
  });
});

// io.listen(  "https://convoyage.onrender.com")

const corsOptions = {
  origin: 'https://carvoy-7.vercel.app', // Allow only your frontend
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization,X-Requested-With',
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Allow preflight requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://carvoy-7.vercel.app"); // Set allowed origin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(session({
  secret: process.env.SECRET_KEY, // Changez ceci par une valeur secrète
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Réglez `secure: true` si vous utilisez HTTPS
}));
  app.use(passport.initialize())
  app.use(passport.session());
  require('./security/passport')(passport)
  // connectDB();

  app.use(formData.parse());


  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(logger('dev'));

app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// connect to db =
mongoose.connect(process.env.MONGO_URI)
.then(()=>{console.log("connected to db")


})
.catch(err=>console.log(err))
app.use('/api', indexRouter);
app.use('/api/users', userRoutes);
app.use('/api/basicInfo', BasicInfoRoutes);
app.use('/api/Todo', Todo);
app.use('/api/profile', profileRoutes);
app.use('/api/chats', chatRoutes);
app.get('/send-email-test', (req, res) => {
  mailer.send({
    to: ["zbousnina@yahoo.com"], // Example recipient
    subject: "Test mail",
    html: "<h1>Test</h1>", // Email content
  }, (err) => {
    if (err) {
      console.error('Error sending email:', err);
      return res.status(500).json({ success: false, message: 'Email sending failed', error: err });
    }

    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  });
});

module.exports = app;