const mongoose = require("mongoose");
const bookSchema = new mongoose.Schema ({
    access_type:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    language:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    subcategoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory'
    },
    authorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author'
    },
    image:{
        type:String,
        required:true
    },
    pdf: {
        type: String,
        required: true
    },
    download: {
        type:Number,
        default:0
    },
    is_active:{
        type:Number,
        default:1
    }


},
    { timestamps: true });



module.exports = mongoose.model('Book',bookSchema);