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
        googleId: {
            type: String,
            default: null
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

        }


    },{
        timestamps: true
    }
)


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

