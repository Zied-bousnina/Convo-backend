const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = mongoose.Schema(
    {

        name: String,
        email: {
            type: String,
            trim:true,
            unique: true,
            // required: true,
        },
        uniqueId: {
            type: String,
            unique: true,
            required: true,
          },
        password: String,
        contactName:String,
        addressPartner:String,
        phoneNumber:String,
        role: {
            type: String,
            default: 'USER'

        },
        verified: {
            type: Boolean,
            default: false,
            required: true
        },
        firstLoginByThirdParty: {
            type: Boolean,
            default: false
        },
        googleId: {
            type: String,
            default: null,
          },
          linkedinId: {
            type: String,
            default: null,
          },
        address:
        {
            latitude: String,
            longitude: String,
        },
        avatar: String,
        activeToken: String,
        activeExpires: Date,
        isBlocked:{
            type: Boolean,
            default: false,
        },
        onligne:{
            type: Boolean,
            default: false,

        },
        siret:{
            type:String,
            // required:true
        },
        kbis:{
            type:String,
            // required:true

        },
        firstLogin:{
            type:Boolean,
            default:true

        },
        driverIsVerified :{
            type:Boolean,
            default:false


        },
        Newsocket: [
            {
                type:Object
            }

        ],
        VAT:{
            type:String,
            // required:true

        },



    },{
        timestamps: true
    }
)
// 🔹 Function to Generate Unique ID from `contactName` or `name`
const generateUniqueId = async function (contactName, name) {
    let baseName = contactName || name; // Use contactName if available, otherwise use name
    if (!baseName) return null; // If both are null, return null

    const parts = baseName.toLowerCase().split(" "); // Split words
    const initials = parts.map((word) => word.slice(0, 2)).join(""); // Take first 2 letters of each part
    let baseId = initials.charAt(0).toUpperCase() + initials.slice(1); // Capitalize first letter

    let uniqueId = baseId;
    let counter = 1;

    // Check if ID exists and increment if needed
    while (await mongoose.model("User").findOne({ uniqueId })) {
        uniqueId = `${baseId}${counter}`;
        counter++;
    }

    return uniqueId;
};

// 🔹 Middleware: Auto-generate `uniqueId` before saving
userSchema.pre("save", async function (next) {
    if (!this.uniqueId) {  // Generate uniqueId only if missing
        this.uniqueId = await generateUniqueId(this.contactName || this.name);
    }
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}
userSchema.methods.comparePassword = async function(password) {
    const result = await bcrypt.compareSync(password, this.password)
    return result
}
userSchema.methods.addAddress = async function (newAddress) {
    this.address = newAddress;
    await this.save();
  };
module.exports = mongoose.model('User', userSchema)
// userSchema.methods.getUserByEmail = async function(email) {
//     const user = await this.findOne({ email: email })
//     return user
//   }

// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) {
//         next()
//     }

//     const salt = await bcrypt.genSalt(10)
//     this.password = await bcrypt.hash(this.password, salt)
// })

