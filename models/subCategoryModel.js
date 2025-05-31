const mongoose = require("mongoose");
const subcategorySchema = new mongoose.Schema ({

    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    is_active:{
        type:Number,
        default:0
    }
    
},

{ timestamps: true });

module.exports = mongoose.model('Subcategory',subcategorySchema);