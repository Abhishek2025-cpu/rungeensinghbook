const Admin = require("../models/adminModel");
const BookReview = require('../models/BookReviewModel');
const { verifyAdminAccess } = require('../config/verification');

// Load Book Review
const loadBookReview = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => { 
            let loginData = await Admin.find({});
            const bookReviews = await BookReview.find().populate('bookId', 'name image').populate('userId','firstname lastname image');
            res.render('bookReview', { bookReview : bookReviews, loginData: loginData});
        });
    } catch (err) {
        console.log(err);
    }
}

// Delete Book Review
const deleteBookReview = async(req,res)=>{
    try {
        const id = req.query.id;
        const delBookReview= await BookReview.deleteOne({ _id: id });
        res.redirect('/book-review');
    } catch (error) {
        console.log(error.message);
    }
}

// Set Book Review Status
const reviewStatus = async(req,res)=>{
    try {
        const { id } = req.params;
        const status = await BookReview.findById(id);
        const is_active = req.body.is_active ? req.body.is_active : "false";
        if (!status) {
            return res.sendStatus(404);
        }
        status.is_active = !status.is_active;
        await status.save();
        res.redirect('/book-review');
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

module.exports = {
    loadBookReview,
    deleteBookReview,
    reviewStatus
}