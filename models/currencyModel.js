const mongoose = require('mongoose');

const CurrencySchema = mongoose.Schema({
    currency: {
        type: String,
        required: true
    }
},
    {
        timestamps: true
    });

module.exports = mongoose.model('Currency',CurrencySchema);