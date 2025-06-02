require('dotenv').config();
const fs = require("fs");
const path = require('path')
const bookImages = path.join('./public/assets/bookImages/');
var he = require('he');
const Book = require("../models/bookModel");
const Category = require("../models/categoryModel");
const Subcategory = require("../models/subCategoryModel");
const Author = require("../models/authorModel");
const Admin = require("../models/adminModel");
const Notification = require("../models/notificationModel");
const common_Notification = require("../models/commonNotificationModel");
const Downloadpdf = require('../models/downloadpdfModel');
const admin = require('../config/firebase');


// Load Book page
const loadBook = async (req, res) => {
    try {
        const category = await Category.find({});
        const subcategory = await Subcategory.find({}).populate('categoryId');
        const author = await Author.find({});
        res.render('addBook', { category: category, subcategory: subcategory, author: author });
    } catch (error) {
        console.log(error);
    }
}

// Add Book Details
const addBook = async (req, res) => {
    try {
        let loginData = await Admin.find({});
        const adminUser = loginData.find(admin => String(admin._id) === req.session.user_id);

        if (!adminUser || adminUser.is_admin !== 1) {
            req.flash('error', 'You have no access to add book, you are not super admin!');
            return res.redirect('back');
        }

        // Check if required files are present
        if (!req.files || !req.files.image || !req.files.pdf) {
            req.flash('error', 'Please upload both image and PDF files!');
            return res.redirect('back');
        }

        const bookData = new Book({
            access_type: req.body.access_type,
            name: req.body.name,
            language: req.body.language,
            description: req.body.description,
            categoryId: req.body.categoryId,
            subcategoryId: req.body.subcategoryDropdown,
            authorId: req.body.authorId,
            image: req.files.image[0].filename,
            pdf: req.files.pdf[0].filename,
            download: req.body.download === "on" ? 1 : 0,  // Convert to Number
            is_active: req.body.is_active === "on" ? 1 : 0  // Convert to Number
        });

        const savedBook = await bookData.save();

        if (!savedBook) {
            req.flash('error', 'Failed to add book');
            return res.redirect('/view-book');
        }

        // Get unique registration tokens
        const notifications = await Notification.find();
        const registrationTokens = [...new Set(
            notifications
                .filter(n => n.registrationToken)
                .map(n => n.registrationToken)
        )];

          // Only send notification if there are valid tokens
          if (registrationTokens.length > 0) {
            // Prepare notification content
            const title = `New E-Book Added: ${bookData.name}`;
            const body = `Check out our latest addition, ${bookData.name} now available for reading in our collection`;

            // Send push notification
            await sendPushNotification(registrationTokens, title, body);
          }

        // Save notification record
        await common_Notification.create({
            title: `New E-Book Added: ${bookData.name}`,
            description: `Check out our latest addition, ${bookData.name} now available for reading in our collection`,
            bookId: bookData._id
        });

        req.flash('success', 'Book added');
        res.redirect('/view-book');

    } catch (error) {
        console.error('Error adding book:', error);
        req.flash('error', 'An error occurred while adding the book');
        res.redirect('back');
    }
}

// Listing Book
const viewBook = async (req, res) => {
    try {
        let loginData = await Admin.findById({ _id: req.session.user_id });
        const category = await Category.find();
        const author = await Author.find();
        const book = await Book.find({}).sort({ updatedAt: -1 }).populate(['categoryId', 'subcategoryId', 'authorId']);
        if (book) {
            res.render('book', { book: book, loginData: loginData, category: category, author: author });
        } else {
            console.log("No books found");
            res.render('book', { book: [], loginData: loginData, category: category, author: author });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Error loading book list.");
    }
}


// Edit Book Details
const editBook = async (req, res) => {
    try {
        const id = req.query.id;
        const bookData = await Book.findById({ _id: id });
        const category = await Category.find({});
        const subcategory = await Subcategory.find({}).populate('categoryId');
        const author = await Author.find({});
        if (bookData) {
            res.render('editBook', { bookData: bookData, category: category, subcategory: subcategory, author: author });
        }
        else {
            res.render('editBook', { message: "Book not update..!!*" });
        }

    } catch (error) {
        console.log(error.message);
    }
}

// Update Book Details
const updateBook = async (req, res) => {
    try {
        const id = req.query.id;
        const admin = await Admin.findById(req.session.user_id);
        
        if (!admin || admin.is_admin !== 1) {
            req.flash('error', 'You have no access to edit book, You are not super admin!');
            return res.redirect('back');
        }

        const currentBook = await Book.findById(id);
        if (!currentBook) {
            req.flash('error', 'Book not found');
            return res.redirect('back');
        }

        const updateFields = {
            access_type: req.body.access_type,
            name: req.body.name,
            language: req.body.language,
            description: req.body.description,
            categoryId: req.body.categoryId,
            subcategoryId: req.body.subcategoryDropdown,
            authorId: req.body.authorId,
            download: req.body.download === "on" ? 1 : 0,
        };

        // Check if image is being updated
        if (req.files && req.files.image && req.files.image[0]) {
            if (currentBook.image && fs.existsSync(bookImages + currentBook.image)) {
                fs.unlinkSync(bookImages + currentBook.image);
            }
            updateFields.image = req.files.image[0].filename;
        }

        // Check if PDF is being updated  
        if (req.files && req.files.pdf && req.files.pdf[0]) {
            updateFields.pdf = req.files.pdf[0].filename;
        }

        await Book.findByIdAndUpdate(id, { $set: updateFields });
        req.flash('success', 'Book updated');
        res.redirect('/view-book');
    } catch (error) {
        console.log(error.message);
    }
}

// Set Book Status
const activeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await Book.findById(id);
        const is_active = req.body.is_active ? req.body.is_active : "false";
        if (!status) {
            return res.sendStatus(404);
        }
        status.is_active = !status.is_active;
        await status.save();
        res.redirect('/view-book');

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

// Delete Book
const deleteBook = async (req, res) => {
    try {
        const id = req.query.id;
        const currentBook = await Book.findById({ _id: id });

        if (currentBook) {
            // Delete book image file if it exists
            if (fs.existsSync(bookImages + currentBook.image)) {
                fs.unlinkSync(bookImages + currentBook.image);
            }

            // Delete the book
            const deleteBookResult = await Book.deleteOne({ _id: id });

            // Check if the book deletion was successful
            if (deleteBookResult.deletedCount > 0) {
                // Delete notifications related to the book
                const filterNotifications = { bookId: currentBook._id };
                await common_Notification.deleteMany(filterNotifications);

                const filterDownloadpdf = { bookId: currentBook._id };
                await Downloadpdf.deleteMany(filterDownloadpdf);

                res.redirect('/view-book'); // Or appropriate success response
                return; // Return to exit the function after successful deletion
            } else {
                throw new Error('Book not found or could not be deleted.');
            }
        } else {
            throw new Error('Book not found.');
        }
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).send("An error occurred while deleting the book.");
    }
}

// Send Notification 
function sendPushNotification(registrationTokens, title, body) {
    const message = {
        notification: {
            title: title,
            body: body
        },
        tokens: registrationTokens
    };

    admin.messaging().sendEachForMulticast(message)
        .then((response) => {
            console.log('Successfully sent message to all tokens:', response);
        })
        .catch((error) => {
            console.error('Error sending message:', error);
        });
}

module.exports = {
    loadBook,
    addBook,
    viewBook,
    editBook,
    updateBook,
    activeStatus,
    deleteBook
}