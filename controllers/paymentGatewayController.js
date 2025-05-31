const Payment = require("../models/paymentGatewayModel");
const Admin = require("../models/adminModel");
const { verifyAdminAccess } = require('../config/verification');

// Load payment method page
const loadPayment = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => { 
            const payment = await Payment.findOne();
            res.render('paymentGateway', { payment: payment });
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Add payment method
const addPaymentMethod = async (req, res) => {
    try {
        let loginData = await Admin.find({});
        for (let i in loginData) {
            if (String(loginData[i]._id) === req.session.user_id) {
                if (loginData[i].is_admin == 1) {
                    const paymentRecord = await Payment.find();
                    const isPaypalEnabled = req.body.paypal_is_enable == "on";
                    const isStripeEnabled = req.body.stripe_is_enable == "on";
                    const isRazorpayEnabled = req.body.razorpay_is_enable == "on";
                    const isCashOnDeliveryEnabled = req.body.cash_on_delivery_is_enable == "on";

                    const paymentData = {
                        paypal_is_enable: isPaypalEnabled ? 1 : 0,
                        paypal_mode: isPaypalEnabled ? req.body.paypal_mode : "testMode",
                        paypal_testmode_merchant_Id: isPaypalEnabled ? req.body.paypal_testmode_merchant_Id : "",
                        paypal_testmode_tokenization_key: isPaypalEnabled ? req.body.paypal_testmode_tokenization_key : "",
                        paypal_testmode_public_key: isPaypalEnabled ? req.body.paypal_testmode_public_key : "",
                        paypal_testmode_private_key: isPaypalEnabled ? req.body.paypal_testmode_private_key : "",
                        paypal_livemode_merchant_Id: isPaypalEnabled ? req.body.paypal_livemode_merchant_Id : "",
                        paypal_livemode_tokenization_key: isPaypalEnabled ? req.body.paypal_livemode_tokenization_key : "",
                        paypal_livemode_public_key: isPaypalEnabled ? req.body.paypal_livemode_public_key : "",
                        paypal_livemode_private_key: isPaypalEnabled ? req.body.paypal_livemode_private_key : "",
                        
                        stripe_is_enable: isStripeEnabled ? 1 : 0,
                        stripe_mode: isStripeEnabled ? req.body.stripe_mode : "testMode",
                        stripe_testmode_publishable_key: isStripeEnabled ? req.body.stripe_testmode_publishable_key : "",
                        stripe_testmode_secret_key: isStripeEnabled ? req.body.stripe_testmode_secret_key : "",
                        stripe_livemode_publishable_key: isStripeEnabled ? req.body.stripe_livemode_publishable_key : "",
                        stripe_livemode_secret_key: isStripeEnabled ? req.body.stripe_livemode_secret_key : "",
                        
                        razorpay_is_enable: isRazorpayEnabled ? 1 : 0,
                        razorpay_mode: isRazorpayEnabled ? req.body.razorpay_mode : "testMode",
                        razorpay_testmode_key_Id: isRazorpayEnabled ? req.body.razorpay_testmode_key_Id : "",
                        razorpay_testmode_key_secret: isRazorpayEnabled ? req.body.razorpay_testmode_key_secret : "",
                        razorpay_livemode_key_Id: isRazorpayEnabled ? req.body.razorpay_livemode_key_Id : "",
                        razorpay_livemode_key_secret: isRazorpayEnabled ? req.body.razorpay_livemode_key_secret : "",
                        
                        cash_on_delivery_is_enable: isCashOnDeliveryEnabled ? 1 : 0,
                    };

                    if (paymentRecord.length <= 0) {
                        const payment_method = new Payment(paymentData);
                        const saveMethod = await payment_method.save();
                        if (saveMethod) {
                            res.redirect('/payment-gateway');
                        } else {
                            res.render('paymentGateway', { message: "Payment Method Not Added" });
                        }
                    } else {
                        const payment_method = await Payment.findOneAndUpdate(
                            {}, 
                            { $set: paymentData },
                            { new: true }
                        );
                        if (payment_method) {
                            res.redirect('/payment-gateway');
                        } else {
                            res.render('paymentGateway', { message: "Payment Method Not Updated" });
                        }
                    }
                } else {
                    req.flash('error', 'You have no access to add payment method , You are not super admin !! *');
                    return res.redirect('back');
                }
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadPayment,
    addPaymentMethod
}