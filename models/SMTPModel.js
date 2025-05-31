const mongoose = require("mongoose");
const smtpSchema = new mongoose.Schema ({  
    host:{
        type:String,
        required:true
    },
    port:{
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
    encryption:{
        type:String,
        required:true 
    }
},
{ timestamps: true });
module.exports = mongoose.model('SMTP', smtpSchema);