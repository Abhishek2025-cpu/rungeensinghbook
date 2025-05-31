require('dotenv').config();
const sha256 = require("sha256");
const Admin = require("../models/adminModel");
const Category = require("../models/categoryModel");
const User = require("../models/userModel");
const Usersubscriptions = require("../models/userSubscriptionModel");
const { verifyAdminAccess } = require('../config/verification');

// Load Login Page
const loginLoad = async(req,res)=>{
    try {
        // check user is login or not
        if (req.session.user_id) {
            return res.redirect('/dashboard');
        }
        res.render('login');
    } catch (error) {
        console.log('error in loginLoad', error);
    }
}

// Load Dashboard
const loadDashboard = async(req,res)=>{
    try {
        await verifyAdminAccess(req, res, async () => {
            const category = await Category.find();
            res.render('dashboard',{category:category});
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Verify Admin
const VerifyAdmin = async (req, res) => {
    try {
        const password = sha256.x2(req.body.password);
        const email = req.body.email;
        const AdminData = await Admin.findOne({ email: email, password: password });
        if (AdminData) {
            req.session.user_id = AdminData._id;
            res.redirect('/dashboard');
        }
        else {
            res.render('login', { message: "Email and Passowrd not correct" });
        }
    } catch (error) {
        console.log(error.message);
    }
}

// Admin Profile
const adminProfile = async (req, res) => {
    try {
        const adminData = await Admin.findById(req.session.user_id);
        if (adminData) {
            res.render('profile', { admin: adminData });
        }
        else {
            console.log(error);
        }
    } catch (error) {
        console.log(error.message);
    }
}

// Update Profile
const editProfile = async (req, res) => {
    try {
        const id = req.session.user_id;
        if (!id) {
            req.flash('error', 'User session not found');
            return res.redirect('/login');
        }

        const updateData = {
            username: req.body.username,
            phone: req.body.phone
        };

        if (req.file) {
            updateData.image = req.file.filename;
        }

        const updateProfile = await Admin.findByIdAndUpdate(
            { _id: id },
            { $set: updateData },
            { new: true }
        );

        if (updateProfile) {
            req.flash('success', 'Profile updated successfully');
        } else {
            req.flash('error', 'Failed to update profile');
        }

        res.redirect('/profile');

    } catch (error) {
        console.log(error);
        req.flash('error', 'Something went wrong while updating profile');
        res.redirect('/profile');
    }
}

// Admin Logout
const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect("/login");
    } catch (error) {
        console.log(error.message);
    }
}

// Change Password
const changePassword = async (req, res) => {
    try {
        res.render('changePassword');
    } catch (error) {
        console.log(error.message);
    }
}

// Reset Admin Password
const resetAdminPassword = async (req, res) => {
    try {
        const oldpassword = sha256.x2(req.body.oldpassword);
        const newpassword = req.body.newpassword;
        const confirmPassword = req.body.cpassword;

        const id = req.session.user_id;
        const admin = await Admin.findOne({ _id: id, password: oldpassword });
        if (admin) {
            if (newpassword == confirmPassword) {
                const securePass = sha256.x2(newpassword);
                const adminInfo = await Admin.findByIdAndUpdate({ _id: id }, { $set: { password: securePass } });
                req.flash('success', 'Password updated successfully');
                res.redirect('/change-password');
            }
            else {
                res.render('changePassword', { message: "Confirm password not matched" });
            }
        }
        else {
            res.render('changePassword', { message: "old password not matched" });
        }
    } catch (error) {
        console.log(error.message);
    }

}

// View Users
const getUsers = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => { 
            let loginData = await Admin.find({});
            const user = await User.find().sort({ updatedAt: -1 });
            res.render("users", { users: user, loginData: loginData });
        });
    } catch (error) {
        console.log(error.message);
    }
}

// View All Transactions
const getAllTransactons = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => { 
            let loginData = await Admin.find({});
            const user = await Usersubscriptions.find().populate(['userId','subscriptionplanId']).sort({ updatedAt: -1 });
            res.render("orders", { users: user, loginData: loginData });
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Set User Status
const userStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const status = await User.findById(id);
        if (!status) {
            return res.sendStatus(404);
        }
        status.active = !status.active;
        await status.save();
        res.redirect('/users');
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}



module.exports = {
    loginLoad,
    loadDashboard,
    VerifyAdmin,
    logout,
    adminProfile,
    editProfile,
    changePassword,
    resetAdminPassword,
    getUsers,
    userStatus,
    getAllTransactons
}