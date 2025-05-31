const mongoose = require("mongoose");
const subscriptionplanSchema = new mongoose.Schema ({
    
    name:{
        type:String,
        required:true
    },
    duration:{
        type:String,
        required:true
    },
    duration_in_terms:{
        type:String,
        required:true
    },
    price:{
        type:String
    },
    is_active:{
        type:Number,
        default:0
    }
    
},

{ timestamps: true });

module.exports = mongoose.model('Subscriptionplan',subscriptionplanSchema);