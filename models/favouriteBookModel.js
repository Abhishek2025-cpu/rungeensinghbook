const mongoose = require("mongoose");
const favouriteBookSchema = new mongoose.Schema ({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    bookId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }
},

{ timestamps: true });

module.exports = mongoose.model('FavouriteBook',favouriteBookSchema);