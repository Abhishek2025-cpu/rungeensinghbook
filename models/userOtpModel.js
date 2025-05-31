const mongoose = require("mongoose");
const UserOTPSchema = new mongoose.Schema ({

    
    email:{
        type:String,
        required:true
    },
    OTP:{
        type:Number
    }
},

{ timestamps: true });


module.exports = mongoose.model('UserOTP',UserOTPSchema);