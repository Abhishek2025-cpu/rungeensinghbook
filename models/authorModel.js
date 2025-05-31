const mongoose = require("mongoose");
const authorSchema = new mongoose.Schema ({
    
    name:{
        type:String,
        required:true
    },
    since_year:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    facebook_url:{
        type:String
    },
    instagram_url:{
        type:String
    },
    youtube_url:{
        type:String
    },
    website_url:{
        type:String
    },
    is_active:{
        type:Number,
        default:0
    }
    
},

{ timestamps: true });

module.exports = mongoose.model('Author',authorSchema);