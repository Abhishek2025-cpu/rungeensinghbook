const mongoose = require("mongoose");
const userSchema = new mongoose.Schema ({

    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    country_code:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    image:{
        type:String
    },
    is_verified:{
        type:Number,
        default:0
    },
    active:{
        type:Boolean,
        default:true
    }
},

{ timestamps: true });


module.exports = mongoose.model('User',userSchema);
