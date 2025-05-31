const mongoose = require("mongoose");
const PassowrdOTPSchema = new mongoose.Schema ({

    
    email:{
        type:String,
        required:true
    },
    OTP:{
        type:Number
    },
    is_verified:{
        type:Number,
        default:0
    }
},

{ timestamps: true });


module.exports = mongoose.model('PasswordOTP',PassowrdOTPSchema);