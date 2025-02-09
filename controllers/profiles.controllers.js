const profileModels = require("../models/profile.models")
const profileInputValidator = require("../validations/profile2")
const cloudinary = require('../utils/uploadImage');
const userModel = require("../models/userModel");
const logActivity = require("../utils/logger"); // Import logger

const skipProfile = async (req, res) => {
  try {
      // Assuming profileModels is your Mongoose model for profiles
      const profile = await profileModels.findOne({ user: req.user.id });

      if (!profile) {
          // If a profile doesn't exist, create an empty one
          const data = await profileModels.create({ user: req.user.id });
          res.status(200).json({ data, success: true });
      } else {
          // Profile already exists
          res.status(200).json({ message: "Profile already exists", success: true });
      }
  } catch (error) {
      res.status(500).json({ message: "An error occurred", error: error.message });
  }
}
const FindAllProfile = async(req, res)=>{
    // res.send('ok')
    try {
        const data = await profileModels.find().populate('user', ["name", "email", "role"])
        res.status(200).json(data)

    } catch (error) {
        res.status(500).json({message: "error"})

    }
}
const AddProfile = async (req, res) => {
  const { isValid, errors } = profileInputValidator(req.body);

  try {
      if (!isValid) {
          await logActivity("Failed to Add Profile", req.user.id, { reason: "Validation failed", errors });
          res.status(404).json(errors);
      } else {
          if (req.files?.avatar?.size > 0) {
              const result = await cloudinary.uploader.upload(req.files.avatar.path, {
                  public_id: `${req.user.id}_profile`,
                  width: 500,
                  height: 500,
                  crop: 'fill',
              });

              req.body.avatar = result.secure_url;
          }

          const profile = await profileModels.findOne({ user: req.user.id });

          if (!profile) {
              const telExist = await profileModels.findOne({ tel: req.body.tel });

              if (telExist) {
                  errors.tel = "Tel already exists";
                  await logActivity("Failed to Add Profile", req.user.id, { reason: "Tel already exists", tel: req.body.tel });
                  res.status(404).json(errors);
              } else {
                  req.body.user = req.user.id;
                  const data = await profileModels.create(req.body);

                  await logActivity("Created Profile", req.user.id, req.body);
                  res.status(200).json({ data, success: true });
              }
          } else {
              if (profile.tel !== req.body.tel) {
                  const telExist = await profileModels.findOne({ tel: req.body.tel });

                  if (telExist) {
                      errors.tel = "Tel already exists";
                      await logActivity("Failed to Update Profile", req.user.id, { reason: "Tel already exists", tel: req.body.tel });
                      res.status(404).json(errors);
                  } else {
                      const result = await profileModels.findOneAndUpdate(
                          { user: req.user.id },
                          req.body,
                          { new: true }
                      );

                      await logActivity("Updated Profile", req.user.id, req.body);
                      res.status(200).json(result);
                  }
              } else {
                  const result = await profileModels.findOneAndUpdate(
                      { user: req.user.id },
                      req.body,
                      { new: true }
                  );

                  await logActivity("Updated Profile", req.user.id, req.body);
                  res.status(200).json(result);
              }
          }
      }
  } catch (error) {
      await logActivity("Error in AddProfile", req.user.id, { error: error.message });
      res.status(500).json({ message1: "error2", message: error.message });
  }
};

const EditProfile = async (req, res) => {
  try {
      const profile = await profileModels.findOne({ user: req.user.id });

      if (!profile) {
          await logActivity("Failed to Edit Profile", req.user.id, { reason: "Profile not found" });
          return res.status(404).json({ error: "Profile not found" });
      }

      const { tel, avatar, address, city, country, postalCode, bio } = req.body;

      if (tel) {
          const telExist = await profileModels.findOne({ tel });
          if (telExist && telExist.user.toString() !== req.user.id) {
              await logActivity("Failed to Edit Profile", req.user.id, { reason: "Tel already exists", tel });
              return res.status(404).json({ error: "Tel already exists" });
          }
          profile.tel = tel;
      }

      if (req.files?.avatar?.size > 0) {
          const result = await cloudinary.uploader.upload(req.files.avatar.path, {
              public_id: `${req.user.id}_profile`,
              width: 500,
              height: 500,
              crop: 'fill',
          });

          profile.avatar = result.secure_url;
      }

      if (address) profile.address = address;
      if (city) profile.city = city;
      if (country) profile.country = country;
      if (postalCode) profile.postalCode = postalCode;
      if (bio) profile.bio = bio;

      const updatedProfile = await profile.save();

      await logActivity("Updated Profile", req.user.id, {
          tel,
          address,
          city,
          country,
          postalCode,
          bio,
          avatar: profile.avatar
      });

      res.status(200).json(updatedProfile);
  } catch (error) {
      await logActivity("Error in EditProfile", req.user.id, { error: error.message });
      res.status(500).json({ error: "Internal Server Error" });
  }
};
const EditProfileV_WEB = async (req, res) => {
  console.log(req.body);

  try {
      let profile = await profileModels.findOne({ user: req.user.id });

      if (!profile) {
          profile = new profileModels({ user: req.user.id });
      }

      const { tel, address, city, country, postalCode, name, email } = req.body;

      if (name) {
          try {
              const user = await userModel.findById(req.user.id);
              if (!user) {
                  await logActivity("Failed to Edit Profile", req.user.id, { reason: "User not found" });
                  return res.status(404).json({ error: "User not found" });
              }

              user.name = name;
              await user.save();
          } catch (error) {
              console.error(error);
              await logActivity("Error in EditProfileV_WEB", req.user.id, { error: error.message });
              return res.status(500).json({ error: "Internal Server Error" });
          }
      }

      if (email) {
          try {
              const emailExist = await userModel.findOne({ email });

              if (emailExist && emailExist._id.toString() !== req.user.id) {
                  await logActivity("Failed to Edit Profile", req.user.id, { reason: "Email already exists", email });
                  return res.status(400).json({ error: "Email already exists" });
              } else {
                  const user = await userModel.findById(req.user.id);

                  if (!user) {
                      await logActivity("Failed to Edit Profile", req.user.id, { reason: "User not found" });
                      return res.status(404).json({ error: "User not found" });
                  }

                  user.email = email;
                  await user.save();
              }
          } catch (error) {
              console.error(error);
              await logActivity("Error in EditProfileV_WEB", req.user.id, { error: error.message });
              return res.status(500).json({ error: "Internal Server Error" });
          }
      }

      if (tel) {
          const telExist = await profileModels.findOne({ tel });
          if (telExist && telExist.user.toString() !== req.user.id) {
              await logActivity("Failed to Edit Profile", req.user.id, { reason: "Tel already exists", tel });
              return res.status(404).json({ error: "Tel already exists" });
          }
          profile.tel = tel;
      }

      if (req.files?.avatar?.size > 0) {
          const result = await cloudinary.uploader.upload(req.files.avatar.path, {
              public_id: `${req.user.id}_profile`,
              width: 500,
              height: 500,
              crop: 'fill',
          });

          profile.avatar = result.secure_url;
      }

      if (address) profile.address = address;
      if (city) profile.city = city;
      if (country) profile.country = country;
      if (postalCode) profile.postalCode = postalCode;

      const updatedProfile = await profile.save();

      await logActivity("Updated Profile - Web", req.user.id, {
          name,
          email,
          tel,
          address,
          city,
          country,
          postalCode,
          avatar: profile.avatar
      });

      res.status(200).json(updatedProfile);
  } catch (error) {
      console.error(error);
      await logActivity("Error in EditProfileV_WEB", req.user.id, { error: error.message });

      res.status(500).json({ error: "Internal Server Error", error2: error.message });
  }
};

// const AddProfile = async(req, res)=>{

//     const {isValid, errors} = profileInputValidator(req.body)
//     const telExist = await profileModels.find({tel: req.body.tel})



//    try {
//     if(!isValid) {
//         res.status(404).json(errors)
//     }else{

//         if(req.files?.avatar?.size>0){
//             const result = await cloudinary.uploader.upload(req.files.avatar.path, {
//                 public_id: `${req.user.id}_profile`,
//                 width: 500,
//                 height: 500,
//                 crop: 'fill',
//             });
//             req.body.avatar = result.secure_url
//         }
//


//         profileModels.findOne({user: req.user.id})
//         .then(async (profile)=>{
//             if(!profile){
//                 if(!(telExist.tel === req.body.tel)){

//                     req.body.user = req.user.id
//                     const data = await profileModels.create(req.body)
//                     // const data = await profileModels.find({user: req.user.id}).populate('user', ['name', 'email', 'role'])
//                     res.status(200).json( {data,success: true})
//                     // res.status(200).json({message: "success"})
//                 }else{
//                     errors.tel = "tel already exist"
//                     res.status(404).json(errors)
//                 }
//             }else{
//                 // if(!(telExist1[0].tel === req.body.tel)){

//                     await profileModels.findOneAndUpdate(
//                         {user: req.user.id},
//                         req.body,
//                         {new: true}
//                         ).then(result=>{
//                             var tel = result.tel
//                             res.status(200).json(result)
//                         }).catch(async (err)=>{
//                             const telExist1 = await profileModels.find({tel: req.body.tel})
//
//
//                             if(telExist1[0]?.tel === req.body.tel) {
//                                 errors.tel = "tel already exist"
//                                 res.status(404).json(errors)
//                             }else{

//                                 res.status(500).json({message: "error"})
//                             }

//                         })
//                     // }else{
//                     //     errors.tel = "tel already exist"
//                     //     res.status(404).json(errors)
//                     // }
//                     }
//                 })


//     }

//    } catch (error) {
//     res.status(500).json({message1: "error2", message: error.message})

//    }
// }
// const AddProfile = async(req, res)=>{
//     const {isValid, errors} = profileInputValidator(req.body)
//    try {
//     if(!isValid) {
//         res.status(404).json(errors)
//     }else{
//
//         const telExist = await profileModels.find({tel: req.body.tel})

//         profileModels.findOne({user: req.user.id})
//         .then(async (profile)=>{
//             if(!profile){
//                 if(!(telExist.tel === req.body.tel)){

//                     req.body.user = req.user.id
//                     await profileModels.create(req.body)
//                     res.status(200).json({message: "success"})
//                 }else{
//                     errors.tel = "tel already exist"
//                     res.status(404).json(errors)
//                 }
//             }else{
//                 // if(!(telExist1[0].tel === req.body.tel)){

//                     await profileModels.findOneAndUpdate(
//                         {user: req.user.id},
//                         req.body,
//                         {new: true}
//                         ).then(result=>{
//                             var tel = result.tel
//                             res.status(200).json(result)
//                         }).catch(async (err)=>{
//                             const telExist1 = await profileModels.find({tel: req.body.tel})
//
//                             if(telExist1[0]?.tel === req.body.tel) {
//                                 errors.tel = "tel already exist"
//                                 res.status(404).json(errors)
//                             }else{

//                                 res.status(500).json({message: "error"})
//                             }

//                         })
//                     // }else{
//                     //     errors.tel = "tel already exist"
//                     //     res.status(404).json(errors)
//                     // }
//                     }
//                 })


//     }

//    } catch (error) {
//     res.status(500).json({message: "error2"})

//    }
// }

const findSingleProfile = async(req, res)=>{
    var userId = req.query.id;

    try {
       const data = await profileModels.find({user: req.user.id}).populate('user')
       res.status(200).json(...data)

    } catch (error) {
        res.status(500).json({message: error.message})

    }
}

const DeleteProfile = async (req, res) => {
  try {
      const userId = req.params.id;
      const deleteProfile = await profileModels.findByIdAndDelete(userId);

      if (!deleteProfile) {
          await logActivity("Failed to Delete Profile", req.user.id, { reason: "Profile not found", userId });
          return res.status(404).json({ message: "Profile not found" });
      }

      await logActivity("Deleted Profile", req.user.id, { userId });

      res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
      await logActivity("Error in DeleteProfile", req.user.id, { error: error.message });

      res.status(500).send("Server error");
  }
};

module.exports = {
    FindAllProfile,
    AddProfile,
    findSingleProfile,
    DeleteProfile,
    EditProfile,
    skipProfile,
    EditProfileV_WEB
}

