const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema ({

    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique: true,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number,
        default:0
    }

});



module.exports = mongoose.model('Admin',adminSchema);
