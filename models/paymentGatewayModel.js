const mongoose = require("mongoose");
const paymentGatewaySchema = new mongoose.Schema ({
    paypal_is_enable:{
        type:Number,
        default:0
    },
    paypal_mode:{
        type: String,
        enum: ["testMode", "liveMode"],
        default: "testMode"
    },
    paypal_testmode_merchant_Id:{
        type:String,
        default: "",
        trim: true
    },
    paypal_testmode_tokenization_key:{
        type:String,
        default: "",
        trim: true
    },
    paypal_testmode_public_key:{
        type:String,
        default: "",
        trim: true
    },
    paypal_testmode_private_key:{
        type:String,
        default: "",
        trim: true
    },
    paypal_livemode_merchant_Id:{
        type:String,
        default: "",
        trim: true
    },
    paypal_livemode_tokenization_key:{
        type:String,
        default: "",
        trim: true
    },
    paypal_livemode_public_key:{
        type:String,
        default: "",
        trim: true
    },
    paypal_livemode_private_key:{
        type:String,
        default: "",
        trim: true
    },
    stripe_is_enable:{
        type:Number,
        default:0
    },
    stripe_mode:{
        type: String,
        enum: ["testMode", "liveMode"],
        default: "testMode"
    },
    stripe_testmode_publishable_key:{
        type:String,
        default: "",
        trim: true
    },
    stripe_testmode_secret_key:{
        type:String,
        default: "",
        trim: true
    },
    stripe_livemode_publishable_key:{
        type:String,
        default: "",
        trim: true
    },
    stripe_livemode_secret_key:{
        type:String,
        default: "",
        trim: true
    },
    razorpay_is_enable:{
        type:Number,
        default:0
    },
    razorpay_mode:{
        type: String,
        enum: ["testMode", "liveMode"],
        default: "testMode"
    },
    razorpay_testmode_key_Id:{
        type:String,
        default: "",
        trim: true
    },
    razorpay_testmode_key_secret:{
        type:String,
        default: "",
        trim: true
    },
    razorpay_livemode_key_Id:{
        type:String,
        default: "",
        trim: true
    },
    razorpay_livemode_key_secret:{
        type:String,
        default: "",
        trim: true
    },
    cash_on_delivery_is_enable:{
        type:Number,
        default:0
    }
},
{ timestamps: true });
module.exports = mongoose.model('PaymentGateway',paymentGatewaySchema);