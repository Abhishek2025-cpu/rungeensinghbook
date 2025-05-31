const mongoose = require("mongoose");
const userSubscriptionSchema = new mongoose.Schema ({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    subscriptionplanId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscriptionplan'
    },
    paymentmode: {
        type: String,
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    paymentstatus: {
        type: String,
        required: true
    },
    paymentdate:{
        type:String,
        required:true
    },
    price:{
        type:String,
        required:true
    },
    expirationdate:{
        type:String 
    }
},

{ timestamps: true });


module.exports = mongoose.model('userSubscription',userSubscriptionSchema);
