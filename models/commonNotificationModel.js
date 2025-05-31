const mongoose = require("mongoose");
const commonNotidicationSchema = new mongoose.Schema ({
    
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    bookId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }
},

{ timestamps: true });



module.exports = mongoose.model('commonNotification',commonNotidicationSchema);