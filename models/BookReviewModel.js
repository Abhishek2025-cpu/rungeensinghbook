const mongoose = require("mongoose");
const BookReviewSchema = new mongoose.Schema ({

    bookId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    description:{
        type:String,
        required:true
    },
    date:{
        type:String,
        required:true
    },
    time:{
        type:String,
        required:true
    },
    rating:{
        type: Number,
        required: true
    },
    is_active:{
        type: Boolean,
        default: true       
    }
    
},

{ timestamps: true });



module.exports = mongoose.model('BookReview',BookReviewSchema);
