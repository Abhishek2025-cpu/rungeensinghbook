const express = require("express");
const multer = require("multer");
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const passport = require("passport");

// Import controllers and config
const apiController = require("../controllers/apiController");

// Initialize router
const api_route = express.Router();

// File upload utilities
const sanitizeFilename = (filename) => {
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  const sanitizedBaseName = baseName.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
  return `${sanitizedBaseName}`;
};

// Configure multer storage
const storage = multer.memoryStorage();

// Configure multer upload settings
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
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

// Authentication middleware
const auth = passport.authenticate('jwt', { session: false });

/**** API Routes ****/

// Authentication Routes
api_route.post('/checkregistereduser', apiController.CheckRegisteredUser);
api_route.post('/signup', apiController.Signup);
api_route.post('/signin', apiController.SignIn);
api_route.post('/signout', auth, apiController.signOut);
api_route.post('/deleteuser', auth, apiController.DeleteUser);

// OTP & Verification Routes
api_route.post('/get_signup_otp', apiController.GetUserOTP);
api_route.post('/otp_verification', apiController.OTPVerification);
api_route.post('/verify_user', apiController.VerifyUser);
api_route.post('/resend_otp', apiController.ResendOTP);

// Password Management Routes
api_route.post('/forgotpassword', apiController.ForgotPassword);
api_route.post('/get_forgotpassword_otp', apiController.GetForgotPasswordOTP);
api_route.post('/forgotpasswordverification', apiController.ForgotPasswordVerification);
api_route.post('/resetpassword', apiController.ResetPassword);
api_route.post('/changepassword', auth, apiController.ChangePassword);

// User Profile Routes
api_route.post('/getuser', auth, apiController.GetUser);
api_route.post('/usereditprofile', auth, apiController.EditUser);
api_route.post('/uploadimage', auth, upload.single('image'), compressImage, apiController.UploadImage);

// Category & Subcategory Routes
api_route.post('/getcategories', apiController.GetCategories);
api_route.post('/getsubcategories', apiController.GetSubcategories);
api_route.post('/getsubcategoriesbycategory', apiController.GetSubcategoryByCategory);

// Author Routes
api_route.post('/getauthors', apiController.GetAuthors);
api_route.post('/getauthordetails', apiController.GetAuthorDetails);

// Book Routes
api_route.post('/getbooks', apiController.GetBook);
api_route.post('/getpopularbooks', apiController.GetPopularBooks);
api_route.post('/gettrendingbooks', apiController.GetTrendingBooks);
api_route.post('/getbookdetails', apiController.GetBookDetails);
api_route.post('/getbookbyauthor', apiController.GetBookByAuthor);
api_route.post('/getbookbycategory', apiController.GetBookByCategory);
api_route.post('/getbookbysubcategory', apiController.GetBookBySubcategory);

// Favorite Book Routes
api_route.post('/addfavouritebook', auth, apiController.AddFavouriteBook);
api_route.post('/getfavouritebook', auth, apiController.GetFavouriteBook);
api_route.post('/removefavouritebook', auth, apiController.RemoveFavouriteBook);

// Subscription Routes
api_route.post('/getsubscriptionplan', apiController.GetSubscriptionPlan);
api_route.post('/usersubscription', auth, apiController.UserSubscriptionPlan);
api_route.post('/usersubscriptionrecord', auth, apiController.UserSubscriptionrecord);
api_route.post('/usersubscriptionvalidity', auth, apiController.UserSubscriptionPlanValidity);

// Content & Feature Routes
api_route.post('/getpages', apiController.GetPages);
api_route.post('/currency', apiController.GetCurrency);
api_route.post('/getnotification', auth, apiController.GetNotifications);

// Review Routes
api_route.post('/addreview', auth, apiController.AddReview);
api_route.post('/getreview', auth, apiController.GetReview);

// Download Routes
api_route.post('/downloadpdf', auth, apiController.DownloadPDF);
api_route.post('/downloadhistory', auth, apiController.DownloadHistory);

// Payment Routes
api_route.post('/payment_gateway', auth, apiController.PaymentMethod);

module.exports = api_route;
