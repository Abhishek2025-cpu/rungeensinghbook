const Admin = require("../models/adminModel");
const BookReview = require('../models/BookReviewModel');

// Load Book Review
const loadBookReview = async (req, res) => {
    try {
        let loginData = await Admin.find({});
        const bookReviews = await BookReview.find()
            .populate('bookId', 'name image')
            .populate('userId','firstname lastname image');
        res.render('bookReview', { bookReview: bookReviews, loginData: loginData });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error loading book reviews.");
    }
}

// Delete Book Review
const deleteBookReview = async (req, res) => {
    try {
        const id = req.query.id;
        await BookReview.deleteOne({ _id: id });
        res.redirect('/book-review');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Failed to delete review.");
    }
}

// Set Book Review Status
const reviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await BookReview.findById(id);
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
