const fs = require("fs");
const path = require('path')
const userimages = path.join('./public/assets/userImages/');
const Subscription = require("../models/subscriptionModel");
const Admin = require("../models/adminModel");
const Currency = require("../models/currencyModel");
const { verifyAdminAccess } = require('../config/verification');

// Load Subscription Plan
const subscriptionplanLoad = async(req,res)=>{
    try {
        res.render('addSubscription');
    } catch (error) {
        console.log(error.message);
    }
}

// Add Subscription Plan
const addSubscription = async (req, res) => {
    try {
        let loginData = await Admin.findById({_id: req.session.user_id, is_admin: 1});
        if(!loginData){
            req.flash('error', 'You are not super admin !! *');
            return res.redirect('back');
        }
        const subscriptionData = new Subscription({
            name: req.body.name,
            duration:req.body.duration,
            duration_in_terms: req.body.duration_in_terms,
            price: req.body.price,
            is_active:req.body.is_active == "on" ? 1 : 0
        });
        const saveSubscription = await subscriptionData.save();
        if (saveSubscription) {
            req.flash('success', 'Subscription added');
            return res.redirect('/view-subscription');
        }
        else {
            req.flash('error', 'Subscription not added');
            return res.redirect('view-subscription');
        }
    } catch (error) {
        console.log(error.message);
    }
}

// View Subscription Plan
const viewSubscription = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => { 
            let loginData = await Admin.findById({_id: req.session.user_id, is_admin: 1});
            const currencyData = await Currency.findOne({});
            const subscriptions = await Subscription.find({}).sort({price: 1});
            if (subscriptions) {
                res.render('subscription', { subscription: subscriptions ,loginData: loginData, currencyData: currencyData });
            }
            else {
                console.log(error.message);
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Set Subscription Plan Status
const activeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await Subscription.findById(id);
        const is_active = req.body.is_active ? req.body.is_active : "false";
        if (!status) {
            return res.sendStatus(404);
        }
        status.is_active = !status.is_active;
        await status.save();
        res.redirect('/view-subscription');

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

// Edit Subscription Plan
const editSubscription = async (req, res) => {
    try {
        const id = req.query.id;
        const editData = await Subscription.findById({ _id: id });
        if (editData) {
            res.render('editSubscription', { subscription: editData });
        }
        else {
            res.render('editSubscription', { message: "Subscription not added..!!*" });
        }

    } catch (error) {
        console.log(error.message);
    }
}

// Update Subscription Plan
const updateSubscription = async(req,res)=>{
    try {
        // Find admin by session ID directly instead of looping through all admins
        const admin = await Admin.findById(req.session.user_id);
        
        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('back');
        }

        if (admin.is_admin !== 1) {
            req.flash('error', 'You do not have permission to edit subscriptions. Only super admins can edit subscriptions.');
            return res.redirect('back');
        }

        const id = req.body.id;
        const updateData = {
            name: req.body.name,
            duration: req.body.duration,
            duration_in_terms: req.body.duration_in_terms,
            price: req.body.price
        };

        await Subscription.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        req.flash('success', 'Subscription updated');
        res.redirect('/view-subscription');
    } catch (error) {
        console.log(error.message);
    }
}

// Delete Subscription Plan
const deleteSubscription = async(req,res)=>{
    try {
        const id = req.query.id;
        const delSubscription = await Subscription.deleteOne({ _id: id });
        res.redirect('/view-subscription');
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = { 
    subscriptionplanLoad, 
    addSubscription, 
    viewSubscription, 
    activeStatus, 
    editSubscription, 
    updateSubscription, 
    deleteSubscription 
}