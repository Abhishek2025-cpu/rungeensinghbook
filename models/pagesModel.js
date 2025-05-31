const mongoose = require("mongoose");
const pagesSchema = new mongoose.Schema ({
    
    delete_account_instruction:{
        type:String,
        required:true
    },
    terms_of_use:{
        type:String,
        required:true
    },
    privacy_policy:{
        type:String,
        required:true
    },
    about_us:{
        type:String,
        required:true
    }
},

{ timestamps: true });



module.exports = mongoose.model('Page', pagesSchema);