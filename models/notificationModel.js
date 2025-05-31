const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema ({
    
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    registrationToken:{
        type:String,
        required:true
    },
    deviceId:{
        type:String,
        required:true
    },
    is_active:{
        type:Boolean,
        default:false
    }
},

{ timestamps: true });



module.exports = mongoose.model('Notification',notificationSchema);