// Import required modules
require('dotenv').config();
const express = require("express");
const multer = require("multer");
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const bodyParser = require('body-parser');
const session = require('express-session');
const auth = require("../middleware/auth.js");

// Initialize express router
const admin_route = express();

// Configure middleware
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));
admin_route.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: true, 
    rolling: true, 
    cookie: { maxAge: 24 * 60 * 60 * 1000 } 
}));

// Configure view engine
admin_route.set('view engine', 'ejs');
admin_route.set('views', [
    path.join('./', '/views/admin/'), 
    path.join('./', '/views/layout/')
]);
admin_route.use(express.static('public'));

// File upload utilities
const sanitizeFilename = (filename) => {
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    const sanitizedBaseName = baseName.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    return `${sanitizedBaseName}`;
};

// Configure multer
const storage = multer.memoryStorage();

// Configure multer for book uploads
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image and PDF files are allowed!'), false);
        }
    }
});

// Image compression middleware
const compressImage = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const uploadDir = path.join(__dirname, '../public/assets/userImages');
        await fs.mkdir(uploadDir, { recursive: true });

        const originalName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}-${originalName}.webp`;
        const filePath = path.join(uploadDir, fileName);

        await sharp(req.file.buffer)
            .resize(800)
            .withMetadata({
                density: 72,
            })
            .toFormat(sharp.format.webp, {
                quality: 50,
            })
            .toFile(filePath);

        req.file.filename = fileName;
        req.file.path = filePath;

        next();
    } catch (error) {
        console.error('Error compressing image:', error);
        next(error);
    }
};


// Book files processing middleware
const processBookFiles = async (req, res, next) => {
    if (!req.files) return next();

    try {
        // Process image file
        if (req.files.image && req.files.image[0]) {
            const imageFile = req.files.image[0];
            const uploadDir = path.join(__dirname, '../public/assets/bookImages');
            await fs.mkdir(uploadDir, { recursive: true });

            const originalName = sanitizeFilename(imageFile.originalname);
            const fileName = `${Date.now()}-${originalName}.webp`;
            const filePath = path.join(uploadDir, fileName);

            await sharp(imageFile.buffer)
                .resize(800)
                .withMetadata({
                    density: 72,
                })
                .toFormat(sharp.format.webp, {
                    quality: 50,
                })
                .toFile(filePath);

            req.files.image[0].filename = fileName;
            req.files.image[0].path = filePath;
        }

        // Process PDF file
        if (req.files.pdf && req.files.pdf[0]) {
            const pdfFile = req.files.pdf[0];
            const uploadDir = path.join(__dirname, '../public/assets/bookImages');
            await fs.mkdir(uploadDir, { recursive: true });
        
            const originalName = sanitizeFilename(pdfFile.originalname);
            const fileName = `${Date.now()}-${originalName}.pdf`;
            const filePath = path.join(uploadDir, fileName);
        
            await fs.writeFile(filePath, pdfFile.buffer);
        
            req.files.pdf[0].filename = fileName;
            req.files.pdf[0].path = filePath;
        }
        next();
    } catch (error) {
        console.error('Error processing book files:', error);
        next(error);
    }
};


// Import controllers
const adminController = require("../controllers/adminController");
const CurrencyController = require("../controllers/currencyController");
const CategoryController = require("../controllers/categoryController");
const SubCategoryController = require("../controllers/subCategoryController.js");
const AuthorController = require("../controllers/authorController.js");
const BookController = require("../controllers/bookController.js");
const SubscriptionController = require("../controllers/subscriptionplanController");
const NotificationController = require("../controllers/notificationController");
const PageController = require("../controllers/pageController");
const SMTPController = require("../controllers/SMTPController");
const BookReviewController = require("../controllers/bookReviewController");
const PaymentGatewayController = require("../controllers/paymentGatewayController");
const VerificationController = require("../controllers/verificationController");

// Admin authentication routes
admin_route.get('/', auth.isLogout, adminController.loginLoad);
admin_route.get('/login', auth.isLogout, adminController.loginLoad);
admin_route.post('/login', adminController.VerifyAdmin);
admin_route.get('/logout', auth.isLogin, adminController.logout);

// Admin dashboard routes
admin_route.get('/dashboard', auth.isLogin, adminController.loadDashboard);
admin_route.get('/profile', auth.isLogin, adminController.adminProfile);
admin_route.post('/profile', upload.single('image'), compressImage, adminController.editProfile);
admin_route.get('/change-password', auth.isLogin, adminController.changePassword);
admin_route.post('/change-password', auth.isLogin, adminController.resetAdminPassword);

// User management routes
admin_route.get('/users', auth.isLogin, adminController.getUsers);
admin_route.post('/users/:id/toggle', adminController.userStatus);
admin_route.get('/orders', auth.isLogin, adminController.getAllTransactons);

// Currency routes
admin_route.get('/currency', auth.isLogin, CurrencyController.currency);
admin_route.post('/currency', CurrencyController.currencydata);

// Category routes      
admin_route.get('/add-category', auth.isLogin, CategoryController.categoryLoad);
admin_route.post('/add-category', upload.single('image'), compressImage, CategoryController.addCategory);
admin_route.get('/view-category', auth.isLogin, CategoryController.viewCategory);
admin_route.get('/edit-category', auth.isLogin, CategoryController.editCategory);
admin_route.post('/edit-category', upload.single('image'), compressImage, CategoryController.UpdateCategory);
admin_route.post('/update-is-active/:id/toggle', CategoryController.activeStatus);
admin_route.get('/delete-category', auth.isLogin, CategoryController.deleteCategory);

// Subcategory routes
admin_route.get('/add-subcategory', auth.isLogin, SubCategoryController.subcategoryLoad);
admin_route.post('/add-subcategory', upload.single('image'), compressImage, SubCategoryController.addSubCategory);
admin_route.get('/view-subcategory', auth.isLogin, SubCategoryController.viewSubcategory);
admin_route.get('/edit-subcategory', auth.isLogin, SubCategoryController.editSubcategory);
admin_route.post('/edit-subcategory', upload.single('image'), compressImage, SubCategoryController.UpdateSubategory);
admin_route.post('/subcategory-is-active/:id/toggle', SubCategoryController.activeStatus);
admin_route.get('/delete-subcategory', auth.isLogin, SubCategoryController.deleteSubcategory);

// Author routes
admin_route.get('/add-author', auth.isLogin, AuthorController.authorLoad);
admin_route.post('/add-author', upload.single('image'), compressImage, AuthorController.addAuthor);
admin_route.get('/view-author', auth.isLogin, AuthorController.viewAuthor);
admin_route.get('/edit-author', auth.isLogin, AuthorController.editAuthor);
admin_route.post('/edit-author', upload.single('image'), compressImage, AuthorController.updateAuthor);
admin_route.post('/author-is-active/:id/toggle', AuthorController.activeStatus);
admin_route.get('/delete-author', auth.isLogin, AuthorController.deleteAuthor);

// Book routes
var cpUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]);
admin_route.get('/add-book', auth.isLogin, BookController.loadBook);
admin_route.post('/add-book', cpUpload, processBookFiles, BookController.addBook);
admin_route.get('/view-book', auth.isLogin, BookController.viewBook);
admin_route.get('/edit-book', auth.isLogin, BookController.editBook);
admin_route.post('/edit-book', cpUpload, processBookFiles, BookController.updateBook);
admin_route.post('/book-is-active/:id/toggle', BookController.activeStatus);
admin_route.get('/delete-book', auth.isLogin, BookController.deleteBook);

// Subscription routes
admin_route.get('/add-subscription', auth.isLogin, SubscriptionController.subscriptionplanLoad);
admin_route.post('/add-subscription', auth.isLogin, SubscriptionController.addSubscription);
admin_route.get('/view-subscription', auth.isLogin, SubscriptionController.viewSubscription);
admin_route.post('/plan-is-active/:id/toggle', SubscriptionController.activeStatus);
admin_route.get('/edit-subscription', auth.isLogin, SubscriptionController.editSubscription);
admin_route.post('/edit-subscription', auth.isLogin, SubscriptionController.updateSubscription);
admin_route.get('/delete-subscription', auth.isLogin, SubscriptionController.deleteSubscription);

// Notification routes
admin_route.get('/send-notification', auth.isLogin, NotificationController.loadNotification);
admin_route.post('/send-notification', NotificationController.addNotification);

// Page routes
admin_route.get('/add-page', auth.isLogin, PageController.pageLoad);
admin_route.post('/add-page', auth.isLogin, PageController.addPages);

// SMTP routes
admin_route.get('/smtp-email', auth.isLogin, SMTPController.smtpLoad);
admin_route.post('/smtp-email', SMTPController.setSMTP);

// Book review routes
admin_route.get('/book-review', auth.isLogin, BookReviewController.loadBookReview);
admin_route.post('/review-status/:id/toggle', BookReviewController.reviewStatus);
admin_route.get('/delete-bookReviews', auth.isLogin, BookReviewController.deleteBookReview);

// Payment gateway routes
admin_route.get('/payment-gateway', auth.isLogin, PaymentGatewayController.loadPayment);
admin_route.post('/payment-gateway', PaymentGatewayController.addPaymentMethod);

// Verification routes
admin_route.get('/verification', auth.isLogin, VerificationController.loadVerification);
admin_route.post('/verification', VerificationController.keyVerification);
admin_route.post('/revoke', VerificationController.revokeKey);

// Catch-all route
admin_route.get('*', function (req, res) {
    res.redirect('/');
});

module.exports = admin_route;