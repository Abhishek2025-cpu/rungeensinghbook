require('dotenv').config();
const nodemailer = require('nodemailer');
const otpgenerator = require('otp-generator');
const sha256 = require("sha256");
const path = require('path');
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const SMTP = require("../models/SMTPModel");
const UserOTP = require("../models/userOtpModel");
const Notification = require("../models/notificationModel");
const CommonNotification = require("../models/commonNotificationModel");
const PasswordOTP = require("../models/passwordOTPModel");
const Category = require("../models/categoryModel");
const Subcategory = require("../models/subCategoryModel");
const Author = require("../models/authorModel");
const Book = require("../models/bookModel");
const Subscription = require("../models/subscriptionModel");
const Page = require("../models/pagesModel");
const UserSubscription = require("../models/userSubscriptionModel");
const Currency = require('../models/currencyModel');
const BookReview = require('../models/BookReviewModel');
const FavouriteBook = require('../models/favouriteBookModel');
const Downloadpdf = require('../models/downloadpdfModel');
const PaymentGateway = require('../models/paymentGatewayModel');
const admin = require('../config/firebase'); // Import the initialized Firebase instance
const { verifyAccess } = require('../config/verification');

// Function to send a notification with title and body using FCM
function sendPushNotification(registrationToken, title, body) {
    const message = {
        notification: {
            title: title,
            body: body
        },
        token: registrationToken
    };

    // Send the message to the device corresponding to the provided registration token
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}

// Check if user already exists with the email
const CheckRegisteredUser = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Check if user already exists with the email
            const emailExist = await User.findOne({ email: req.body.email });
            if (emailExist) {
                return res.json({ "data": { "success": 1, "message": "User already registered..!!*", "error": 0 } });
            } else {
                return res.json({ "data": { "success": 0, "message": "Please signup..!!", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Send OTP
const SendOTP = async (name, email, OTP) => {
    try {
        const smtp = await SMTP.findOne({});
        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: false,
            requireTLS: true,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: smtp.email,
                pass: smtp.password
            }
        });

        // Dynamically import the hbs module
        const { default: hbs } = await import('nodemailer-express-handlebars');
        const handlebarOptions = {
            viewEngine: {
                partialsDir: path.resolve('./views/mail-templates/user-auth/'),
                defaultLayout: false,
            },
            viewPath: path.resolve('./views/mail-templates/user-auth/'),
        };
        transporter.use('compile', hbs(handlebarOptions));

        // Define the path to your image file
        const imgPath = path.resolve('./public/assets/media/logos/ebook-logo.png');

        // Attach the image to the email
        const attachment = {
            filename: 'ebook-logo.png',
            path: imgPath,
            cid: 'logo' // use cid as the URL in the img src
        };

        const mailoptions = {
            from: smtp.email,
            template: "signupOTP",
            to: email,
            subject: 'E-book Registration Verification',
            context: {
                imgUrl: "assets/media/logos/ebook-logo.png",
                name: name,
                OTP: OTP
            },
            attachments: [attachment]
        }
        transporter.sendMail(mailoptions, function (error, info) {
            if (error) {
                console.warn(error);
            }
            else {
                console.log("message has been sent", info.response);
            }
        })
    } catch (error) {
        console.warn(error);
    }
}

// Signup
const Signup = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // hash the password
            const pass = sha256.x2(req.body.password);

            // Create a new user object
            const userData = new User({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                username: req.body.username,
                country_code: req.body.country_code,
                phone: req.body.phone,
                email: req.body.email,
                password: pass
            });
            const emailExist = await User.findOne({ email: req.body.email });
            // Check if user already exists with the email
            if (emailExist) {
                // Generate a new OTP
                let OTP = otpgenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

                // Send the OTP to the user's email
                SendOTP(emailExist.firstname, emailExist.email, OTP);

                // Delete the previous OTP record
                const delPastRecord = await UserOTP.deleteOne({ email: emailExist.email });

                // Create a new OTP record
                const otpMail = await UserOTP.create({
                    email: emailExist.email,
                    OTP: OTP
                });

                return res.json({ "data": { "success": 0, "message": "Email already exist.. Please verify OTP..!!*", "error": 1 } });
            }
            else {
                // Save the user data
                const saveUser = await userData.save();

                // Generate a new OTP
                let OTP = otpgenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

                // Send the OTP to the user's email
                SendOTP(saveUser.firstname, saveUser.email, OTP);

                // Delete the previous OTP record
                const delPastRecord = await UserOTP.deleteOne({ email: saveUser.email });

                // Create a new OTP record
                const otpMail = await UserOTP.create({
                    email: saveUser.email,
                    OTP: OTP
                });

                // Save the new device
                const newDevice = new Notification({
                    userId: saveUser._id,
                    registrationToken: req.body.registrationToken,
                    deviceId: req.body.deviceId,
                    is_active: 1
                });

                await newDevice.save();

                if (saveUser) {
                    return res.json({ "data": { "success": 1, "message": "User successfully registered, Please check your email for OTP..!!", "error": 0 } });
                }
                else {
                    return res.json({ "data": { "success": 0, "message": "User not registered..!!*", "error": 1 } });
                }
            }
        });
    }

    catch (error) {
        return res.json({ "data": { "success": 0, "message": error, "error": 1 } });
    }
}

// Get User OTP
const GetUserOTP = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const email = req.body.email;
            const findUser = await UserOTP.findOne({ email: email });
            if (findUser) {
                return res.json({ "data": { "success": 1, "message": "OTP Found", OTP: findUser.OTP, "error": 0 } });
            } else {
                return res.json({ "data": { "success": 0, "message": "OTP Not Found", "error": 1 } });
            }
        });
    }
    catch (error) {
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// Verify the OTP
const OTPVerification = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const email = req.body.email;

            // Find the user by email
            const findUser = await UserOTP.findOne({ email: email });

            if (findUser) {

                // Check if the OTP matches
                if (findUser.OTP == req.body.otp) {

                    // Update the user's verification status
                    const userEmail = await User.findOneAndUpdate({ email: email }, { $set: { is_verified: 1 } });

                    // Delete the matched OTP record
                    const DelMatched = await UserOTP.deleteOne({ email: userEmail.email });

                    // Check if the user is verified
                    if (userEmail.is_verified == 1) {

                        return res.json({ "data": { "success": 0, "message": "OTP not matched..!!*", "error": 1 } });
                    }
                    else {

                        // Create a new JWT token
                        const token = jwt.sign({ id: userEmail._id }, process.env.SESSION_SECRET);

                        // Send the response
                        return res.json({
                            "data": {
                                "success": 1,
                                message: "Successfully logged user..!!",
                                token: token,
                                userDetails: {
                                    id: userEmail._id,
                                    firstname: userEmail.firstname,
                                    lastname: userEmail.lastname,
                                    username: userEmail.username,
                                    email: userEmail.email,
                                    country_code: userEmail.country_code,
                                    phone: userEmail.phone,
                                    image: userEmail.image ? userEmail.image : "",
                                },
                                "error": "0"
                            }
                        });
                        // return res.json({ "data": { "success": 1, "message": "User successfully verified..!!", "error": 0 } });
                    }
                }
                else {
                    return res.json({ "data": { "success": 0, "message": "OTP not matched..!!*", "error": 1 } });
                }
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Email not found..!!*", "error": 1 } });
            }
        });
    } catch (error) {
        return res.json({
            "data": { "success": 0, "message": error, "error": 1 }
        });
    }
}

// Verify User
const VerifyUser = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const email = req.body.email;
            const user = await User.findOne({ email: email });
            if (user) {
                if (user.is_verified == 1) {
                    return res.json({ "data": { "success": 1, "message": "User is verified..!!", "error": 0 } });
                }
                else {
                    return res.json({ "data": { "success": 0, "message": "User is not verified..Check for OTP Verification..!!*", "error": 1 } });
                }
            } else {
                return res.json({ "data": { "success": 0, "message": "User not found..!!*", "error": 1 } });
            }
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

// Resend OTP
const ResendOTP = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const email = req.body.email;
            const user = await User.findOne({ email: email });
            if (user) {
                // Generate OTP
                let OTP = otpgenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

                // Send OTP
                SendOTP(user.firstname, user.email, OTP);

                // Delete past OTP record
                const delPastRecord = await UserOTP.deleteOne({ email: user.email });

                // Save new OTP
                const otpMail = await UserOTP.create({
                    email: user.email,
                    OTP: OTP
                });
                return res.json({ "data": { "success": 1, "message": "OTP sent successfully..!!", "error": 0 } });
            } else {
                return res.json({ "data": { "success": 0, "message": "User not found..!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Signin
const SignIn = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const { email, password, registrationToken, deviceId } = req.body;
            const hashedPassword = sha256.x2(password);

            // Find active and verified user
            const user = await User.findOne({
                email,
                active: "true",
                is_verified: 1
            });

            if (!user) {
                return res.json({ data: { success: 0, message: "Your account is deactivated by admin. Please signup again.", error: 1 } });
            }

            // Verify password
            if (user.password !== hashedPassword) {
                return res.json({ data: { success: 0, message: "Email and Password not correct.", error: 1 } });
            }

            // Handle device notification
            let userDevice = await Notification.findOne({
                userId: user._id,
                deviceId
            });

            if (userDevice) {
                // Update existing device
                userDevice.registrationToken = registrationToken;
                userDevice.is_active = 1;
                await userDevice.save();
            } else {
                // Create new device
                userDevice = new Notification({
                    userId: user._id,
                    registrationToken,
                    deviceId,
                    is_active: 1
                });
                await userDevice.save();
            }

            // Send notification
            const title = `Hey, ${user.username}`;
            const body = "You are SignIn Successfully!";
            await sendPushNotification(registrationToken, title, body);

            // Generate JWT token
            const token = jwt.sign(
                { id: user._id },
                process.env.SESSION_SECRET
            );

            // Send success response
            return res.json({
                data: {
                    success: 1,
                    message: "Successfully logged user!",
                    token,
                    userDetails: {
                        id: user._id,
                        firstname: user.firstname,
                        lastname: user.lastname,
                        username: user.username,
                        email: user.email,
                        country_code: user.country_code,
                        phone: user.phone,
                        image: user.image || "",
                    },
                    error: "0"
                }
            });
        });
    } catch (error) {
        console.error(error);
        return res.json({ data: { success: 0, message: "Error occurred. Please try again.", error: 1 } });
    }
}

// forgot password OTP
const ForgotPasswordOTP = async (name, email, OTP2) => {
    try {
        const smtp = await SMTP.findOne({});
        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: false,
            requireTLS: true,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: smtp.email,
                pass: smtp.password
            }
        });

         // Dynamically import the hbs module 
        const { default: hbs } = await import('nodemailer-express-handlebars');

        const handlebarOptions = {
            viewEngine: {
                partialsDir: path.resolve('./views/mail-templates/user-auth/'),
                defaultLayout: false,
            },
            viewPath: path.resolve('./views/mail-templates/user-auth'),
        };

        // use a template file with nodemailer
        transporter.use('compile', hbs(handlebarOptions));

        // Define the path to your image file
        const imgPath = path.resolve('./public/assets/media/logos/ebook-logo.png');

        // Attach the image to the email
        const attachment = {
            filename: 'ebook-logo.png',
            path: imgPath,
            cid: 'logo' // use cid as the URL in the img src
        };

        const mailoptions = {
            from: smtp.email,
            template: "forgotOTP",
            to: email,
            subject: 'E-book Forgot Password Verification',
            context: {
                imgUrl: "assets/media/logos/ebook-logo.png",
                name: name,
                OTP: OTP2
            },
            attachments: [attachment]
        }
        transporter.sendMail(mailoptions, function (error, info) {
            if (error) {
                console.warn(error);
            }
            else {
                console.log("message has been sent", info.response);
            }
        })
    } catch (error) {
        console.warn(error);
    }
}

// Get Forgot Password OTP
const GetForgotPasswordOTP = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const email = req.body.email;
            const findUser = await PasswordOTP.findOne({ email: email });
            if (findUser) {
                return res.json({ "data": { "success": 1, "message": "OTP Found", OTP: findUser.OTP, "error": 0 } });
            } else {
                return res.json({ "data": { "success": 0, "message": "OTP Not Found", "error": 1 } });
            }
        });
    } catch (error) {
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// Forgot Password
const ForgotPassword = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Find the user by email
            const email = req.body.email;
            // Find the user by email
            const EmailInfo = await User.findOne({ email: email });
            // Check if the user exists
            if (EmailInfo) {
                // Generate a new OTP
                let OTP2 = otpgenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

                // Send the OTP to the user's email
                ForgotPasswordOTP(EmailInfo.firstname, EmailInfo.email, OTP2);

                // Delete the previous OTP record
                const delPastRecord = await PasswordOTP.deleteOne({ email: EmailInfo.email });

                // Create a new OTP record
                const OTPMail = await PasswordOTP.create({
                    email: EmailInfo.email,
                    OTP: OTP2
                });
                return res.json({ "data": { "success": 1, "message": "Please check your email for OTP..!!", "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Email not matched..!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Forgot Password Verification
const ForgotPasswordVerification = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Find the user by email
            const email = req.body.email;
            const findUser = await PasswordOTP.findOne({ email: email });

            // Check if the user exists
            if (findUser) {

                // Check if the OTP matches
                if (findUser.OTP == req.body.otp) {

                    // Update the user's verification status
                    const userEmail = await PasswordOTP.findOneAndUpdate({ email: email }, { $set: { is_verified: 1 } });

                    // Check if the user is verified
                    if (userEmail.is_verified == 1) {

                        return res.json({ "data": { "success": 0, "message": "OTP not matched..try again..!!*", "error": 1 } });
                    }
                    else {
                        return res.json({ "data": { "success": 1, "message": "User verified successfully, Please set new password..!!", "error": 0 } });
                    }
                }
                else {
                    return res.json({ "data": { "success": 0, "message": "OTP not matched..try again..!!*", "error": 1 } });
                }
            }
            else {
                return res.json({ "data": { "success": 0, "message": "OTP expired...Try again for password reset", "error": 1 } });
            }
        });
    } catch (error) {
        return res.json({ "data": { "success": 0, "message": error, "error": 1 } });
    }
}

// Reset Password
const ResetPassword = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const email = req.body.email;
            const newpassword = req.body.newpassword;

            // Find the user by email
            const findEmail = await PasswordOTP.findOne({ email: email, is_verified: 1 });

            // Check if the user exists
            if (findEmail) {

                const EmailInfo = await User.findOne({ email: email });

                // Check if the user exists
                if (EmailInfo) {
                    // hash the password
                    const pass = sha256.x2(newpassword);
                    // Update the user's password
                    const SavePass = await User.findOneAndUpdate({ email: email }, { $set: { password: pass } });

                    // Check if the password is updated
                    if (SavePass) {
                        // Delete the matched OTP record
                        const DelMatched = await PasswordOTP.deleteOne({ email: SavePass.email });
                        return res.json({ "data": { "success": 1, "message": "Password Changed Successfully..!!", "error": 0 } });
                    }
                    else {
                        return res.json({ "data": { "success": 0, "message": "Reset password failed..!!*", "error": 1 } });
                    }
                }
                else {
                    return res.json({ "data": { "success": 0, "message": "email not found..!!*", "error": 1 } });
                }
            }
            else {
                return res.json({ "data": { "success": 0, "message": "OTP expired...Try again for password reset..!!*", "error": 1 } });
            }
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

// Upload Image
const UploadImage = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const image = req.file.filename;
            res.json({ "data": { "success": 1, "message": "Image upload successfully..!!", image: image, "error": 0 } });
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Edit User Profile
const EditUser = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Find the user by id
            const id = req.body.id;

            // Update the user's profile
            const editUser = await User.findByIdAndUpdate(id,
                {
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    country_code: req.body.country_code,
                    phone: req.body.phone,
                    image: req.body.image
                });

            if (editUser) {
                return res.json({ "data": { "success": 1, "message": "User updated successfully..!!", "error": 0 } });
            } else {
                return res.json({ "data": { "success": 0, "message": "User not updated..!!*", "error": 1 } });
            }
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

// Change Password
const ChangePassword = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Find the user by email
            const email = req.body.email;

            // hash the password
            const pass = sha256.x2(req.body.password);

            // Update the user's password
            const changePass = await User.findOneAndUpdate({ email: email }, { $set: { password: pass } });

            if (changePass) {
                return res.json({ "data": { "success": 1, "message": "Password changed successfully..!!", "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Password not changed..!!*", "error": 1 } });
            }
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

// Get User Profile
const GetUser = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Find the user by id
            const user = await User.findOne({ _id: req.body.userId });
            if (user) {
                res.json({
                    "data": {
                        "success": 1, "message": "User Found Successfully...!!",
                        user: {
                            id: user._id,
                            firstname: user.firstname,
                            lastname: user.lastname,
                            username: user.username,
                            email: user.email,
                            country_code: user.country_code,
                            phone: user.phone,
                            image: user.image ? user.image : ""
                        },
                        "error": 0
                    }
                })
            }
            else {
                return res.status(404).json({ "data": { "success": 0, "message": "User not found..!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Delete User
const DeleteUser = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Find the user by id
            const user = await User.findOne({ _id: req.body.userId });

            // Check if the user exists
            if (user) {

                let filterBooking = { userId: user._id };
                // Delete the user's booking data
                const BookingData = await UserSubscription.deleteMany(filterBooking).populate({ path: 'userSubscription' });

                let filterReview = { userId: user._id };
                // Delete the user's review data
                const ReviewData = await BookReview.deleteMany(filterReview).populate({ path: 'BookReview' });

                let filterNotification = { userId: user._id };
                // Delete the user's notification data
                const NotificationData = await Notification.deleteMany(filterNotification).populate({ path: 'Notification' });

                let filterDownloadpdf = { userId: user._id };
                // Delete the user's download pdf data
                const DownloadpdfData = await Downloadpdf.deleteMany(filterDownloadpdf).populate({ path: 'Downloadpdf' });

                let filterfavouriteBook = { userId: user._id };
                // Delete the user's favourite book data
                const favouriteBook = await FavouriteBook.deleteMany(filterfavouriteBook).populate({ path: 'FavouriteBook' });

                // Delete the user's account
                const delUser = await User.deleteOne({ _id: user._id });

                if (delUser || BookingData || ReviewData || NotificationData || DownloadpdfData || favouriteBook) {
                    res.json({ "data": { "success": 1, "message": "User Account has been deleted...!!", "error": 0 } });
                }
                else {
                    return res.json({ "data": { "success": 0, "message": "User Account has not been deleted...!!*", "error": 1 } });
                }
            }
        });
    } catch (error) {
        return res.json({ "success": 0, "message": "User not found...!!" });
    }
}

// Signout
const signOut = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const userId = req.body.userId;
            const deviceId = req.body.deviceId;
            const filter = { userId: userId, deviceId: deviceId };

            // Update the user's device status
            const updateDevice = await Notification.updateOne(filter, { $set: { is_active: false } });

            if (updateDevice) {
                res.json({ "data": { "success": 1, "message": "Signout Successfully..!!", "error": 0 } });
            } else {
                return res.json({ "data": { "success": 0, "message": "User not found..!!*", "error": 1 } });
            }
        });
    } catch (error) {
        return res.json({ "data": { "success": 0, "message": "Signout failed..!!*", "error": 1 } });
    }
}

// Get Categories
const GetCategories = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Fetch active categories
            let categories = await Category.find({ is_active: 1 });

            // Check if categories are found
            if (categories.length > 0) {

                const categoriesData = categories.map(category => ({
                    "_id": category._id,
                    "name": category.name,
                    "image": category.image
                }));

                res.json({ "data": { "success": 1, "message": "Category found successfully...!!", categoryDetails: categoriesData, "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Category not found...!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// Get Subcategories
const GetSubcategories = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Fetch active subcategories
            let subcategories = await Subcategory.find({ is_active: 1 }).populate('categoryId');

            // Check if subcategories are found
            if (subcategories.length > 0) {

                // Process each subcategory to return only required data
                const subcategoriesData = subcategories.map(subcategory => ({
                    "_id": subcategory._id,
                    "name": subcategory.name,
                    "categoryId": subcategory.categoryId._id,
                    "image": subcategory.image
                }));

                res.json({ "data": { "success": 1, "message": "Subcategory found successfully...!!", subcategoryDetails: subcategoriesData, "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Subcategory not found...!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// Get Subcategory By Category
const GetSubcategoryByCategory = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Check if categoryId is provided
            if (!req.body.categoryId) {
                return res.json({ "data": { "success": 0, "message": "CategoryId is required..!!*", "error": 1 } });
            }
            // Fetch subcategories by categoryId
            let subcategories = await Subcategory.find({ categoryId: req.body.categoryId, is_active: 1 }).populate('categoryId');

            // Check if subcategories are found
            if (subcategories.length > 0) {
                // Process each subcategory to return only required data
                const subcategoriesData = subcategories.map(subcategory => ({
                    "_id": subcategory._id,
                    "name": subcategory.name,
                    "categoryId": subcategory.categoryId._id,
                    "image": subcategory.image
                }));
                res.json({ "data": { "success": 1, "message": "Subcategory found successfully...!!", subcategoryDetails: subcategoriesData, "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Subcategory not found...!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// Remove HTML Attributes
const removeAttributes = (html) => {
    return html.replace(/<(\w+)(\s[^>]*)?>/g, '<$1>');
};

// Remove Non-Breaking Spaces
const removeNonBreakingSpaces = (html) => {
    return html.replace(/&nbsp;/g, '');  // Remove &nbsp;
};

// Get Authors
const GetAuthors = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Fetch active authors
            let author = await Author.find({ is_active: 1 });

            // Check if authors are found
            if (author.length > 0) {

                // Process each author to return only required data
                const authorData = author.map(author => ({
                    "_id": author._id,
                    "name": author.name,
                    "since_year": author.since_year,
                    "image": author.image,
                }));
                res.json({ "data": { "success": 1, "message": "Author found successfully...!!", authorDetails: authorData, "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Author not found...!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// Get Author By Category
const GetAuthorDetails = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Check if authorId is provided
            if (!req.body.authorId) {
                return res.json({ "data": { "success": 0, "message": "AuthorId is required...!!*", "error": 1 } });
            }

            // Fetch author by authorId
            let author = await Author.find({ _id: req.body.authorId, is_active: 1 });

            // Check if author is found
            if (author.length > 0) {

                // Process each author to return only required data
                const authorData = author.map(author => ({
                    "_id": author._id,
                    "name": author.name,
                    "since_year": author.since_year,
                    "description": removeNonBreakingSpaces(removeAttributes(author.description.replace(/\\/g, ''))),
                    "image": author.image,
                    "facebook_url": author.facebook_url,
                    "instagram_url": author.instagram_url,
                    "youtube_url": author.youtube_url,
                    "website_url": author.website_url
                }));

                res.json({ "data": { "success": 1, "message": "Author found successfully...!!", authorDetails: authorData, "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Author not found...!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// Get Books Review Rating
const GetBooksByReviewRating = async (limit = 5) => {
    try {
        // Fetch active books with author details
        let books = await Book.find({ is_active: 1 }).populate('categoryId', 'name image').populate('subcategoryId', 'name image').populate('authorId', 'name image since_year');

        // Process each book to calculate average rating
        const booksWithReviews = await Promise.all(books.map(async book => {
            // Find reviews for the book
            const reviews = await BookReview.find({ bookId: book._id });

            // Calculate average rating
            let totalRating = 0;
            if (reviews.length > 0) {
                totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
                totalRating /= reviews.length; // Calculate average rating
            }

            // Return book data with average rating
            return {
                "_id": book._id,
                "name": book.name,
                "image": book.image,
                "author": book.authorId,
                "averageRating": parseFloat(totalRating.toFixed(1))
                // "averageRating": totalRating.toFixed(1) // Include average rating in book data
            };
        }));

        // Sort books by average rating
        const sortedBooks = booksWithReviews.sort((a, b) => b.averageRating - a.averageRating);

        return sortedBooks;
    } catch (error) {
        // Handle errors
        console.error("An error occurred while fetching books by review rating:", error);
        return null; // Return null in case of error
    }
}

// Get Books By Review Rating With Filter
const GetBooksByReviewRatingWithFilter = async (filterId, filterType = 'author', limit = 5) => {
    try {
        let filter = {};
        if (filterType === 'author') {
            filter = { is_active: 1, authorId: filterId };
        } else if (filterType === 'category') {
            filter = { is_active: 1, categoryId: filterId };
        } else if (filterType === 'subcategory') {
            filter = { is_active: 1, subcategoryId: filterId };
        }
        // Fetch active books with author details
        let books = await Book.find(filter).populate('categoryId', 'name image').populate('subcategoryId', 'name image').populate('authorId', 'name image since_year');

        // Process each book to calculate average rating
        const booksWithReviews = await Promise.all(books.map(async book => {
            // Find reviews for the book
            const reviews = await BookReview.find({ bookId: book._id });

            // Calculate average rating
            let totalRating = 0;
            if (reviews.length > 0) {
                totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
                totalRating /= reviews.length; // Calculate average rating
            }

            // Return book data with average rating
            return {
                "_id": book._id,
                "name": book.name,
                "image": book.image,
                "author": book.authorId,
                "averageRating": parseFloat(totalRating.toFixed(1)) // Include average rating in book data
            };
        }));
        // Sort books by average rating
        const sortedBooks = booksWithReviews.sort((a, b) => b.averageRating - a.averageRating);
        return sortedBooks;
    } catch (error) {
        // Handle errors
        console.error("An error occurred while fetching books by review rating:", error);
        return null; // Return null in case of error
    }
}

// Get All Books
const GetBook = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const { categoryId, authorId, search } = req.body;

            // Constructing the filter object based on the provided criteria
            let filter = { is_active: 1 };
            if (categoryId) {
                if (Array.isArray(categoryId)) {
                    filter.categoryId = { $in: categoryId };
                } else {
                    filter.categoryId = categoryId;
                }
            }
            if (authorId) {
                if (Array.isArray(authorId)) {
                    filter.authorId = { $in: authorId };
                } else {
                    filter.authorId = authorId;
                }
            }
            if (search) filter.name = { $regex: search, $options: 'i' };

            // Finding books based on the constructed filter
            let books = await Book.find(filter).populate('authorId', 'name image since_year');

            // Process each book to calculate average rating
            const booksWithReviews = await Promise.all(books.map(async book => {
                // Find reviews for the book
                const reviews = await BookReview.find({ bookId: book._id });

                // Calculate average rating
                let totalRating = 0;
                if (reviews.length > 0) {
                    totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
                    totalRating /= reviews.length; // Calculate average rating
                }

                // Return book data with average rating
                return {
                    "_id": book._id,
                    "name": book.name,
                    "image": book.image,
                    "author": book.authorId,
                    "averageRating": parseFloat(totalRating.toFixed(1)) // Include average rating in book data
                };
            }));

            if (booksWithReviews && booksWithReviews.length > 0) {
                res.json({ "data": { "success": 1, "message": "Books found successfully...!!", "bookDetails": booksWithReviews, "error": 0 } });
            } else {
                res.json({ "data": { "success": 0, "message": "Books not found...!!", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ "data": { "success": 0, "message": "An error occurred while fetching books...!!", "error": 1 } });
    }
}

// Get Popular Books
const GetPopularBooks = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Fetch top 5 popular books
            const sortedBooks = await GetBooksByReviewRating(5); // Fetch top 5 popular books
            // Check if books are found
            if (sortedBooks && sortedBooks.length > 0) {
                res.json({ "data": { "success": 1, "message": "Books found successfully.", bookDetails: sortedBooks, "error": 0 } });
            } else {
                res.json({ "data": { "success": 0, "message": "Books not found.", "error": 1 } });
            }
        });
    } catch (error) {
        res.json({ "data": { "success": 0, "message": "An error occurred.", "error": 1 } });
    }
}

// Get Trending Books
const GetTrendingBooks = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Fetch randomly selected books
            let books = await Book.aggregate([
                { $match: { is_active: 1 } }, // Match only active books
                { $sample: { size: 5 } } // Randomly select 5 books
            ]);

            if (books.length > 0) {
                // Extract authorIds from the randomly selected books
                const authorIds = books.map(book => book.authorId);

                // Fetch author details for the extracted authorIds
                const authors = await Author.find({ _id: { $in: authorIds } }).select('name image since_year');

                // Create a map for faster lookup of author details by authorId
                const authorMap = new Map(authors.map(author => [author._id.toString(), author]));

                // Process each book to calculate average rating
                const booksWithRatings = await Promise.all(books.map(async book => {
                    // Find reviews for the book
                    const reviews = await BookReview.find({ bookId: book._id });

                    // Calculate average rating
                    let averageRating = 0;
                    if (reviews.length > 0) {
                        const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
                        averageRating = totalRating / reviews.length;
                    }

                    // Return book data with average rating
                    return {
                        _id: book._id,
                        name: book.name,
                        image: book.image,
                        author: authorMap.get(book.authorId.toString()),
                        //averageRating: averageRating.toFixed(1) // Include average rating in book data
                        averageRating: parseFloat(averageRating.toFixed(1)) // Include average rating in book data
                    };
                }));
                // Send the response with book details including author information and average ratings
                return res.json({ data: { success: 1, message: "Books found successfully.", bookDetails: booksWithRatings, error: 0 } });
            } else {
                // No books found
                return res.json({ data: { success: 0, message: "Books not found.", error: 1 } });
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ data: { success: 0, message: "Internal server error.", error: 1 } });
    }
}

// Get Book Details
const GetBookDetails = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Check if bookId is provided
            if (!req.body.bookId) {
                return res.json({ "data": { "success": 0, "message": "BookId is required...!!*", "error": 1 } });
            }

            // Fetch book details with author, category, subcategory, and reviews
            let books = await Book.find({ _id: req.body.bookId, is_active: 1 }).populate('categoryId', 'name image').populate('subcategoryId', 'name image').populate('authorId', 'name image since_year');

            // Check if book is found
            if (books.length > 0) {

                // Process each book to calculate average rating
                const bookData = books.map(async book => {

                    // Find reviews for the book
                    const reviews = await BookReview.find({ bookId: book._id }).populate('userId', 'name image');

                    // Calculate average rating
                    let totalRating = 0;
                    if (reviews.length > 0) {
                        totalRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length; // Calculate average rating
                    }

                    // Return book data with average rating and reviews
                    return {
                        "_id": book._id,
                        "access_type": book.access_type,
                        "name": book.name,
                        "language": book.language,
                        //"description" : book.description,
                        "description": removeNonBreakingSpaces(removeAttributes(book.description.replace(/\\/g, ''))),
                        "image": book.image,
                        "subcategory": book.subcategoryId,
                        "category": book.categoryId,
                        "author": book.authorId,
                        "pdf": book.pdf,
                        "download": book.download,
                        // "on_rent": book.on_rent,
                        // "rent_price": book.rent_price,
                        // "rent_time": book.rent_time + ' days',
                        "averageRating": parseFloat(totalRating.toFixed(1)),
                        "reviews": reviews.map(review => ({
                            "_id": review._id,
                            "userId": review.userId._id,
                            'bookId': review.bookId,
                            "description": review.description,
                            "rating": review.rating,
                            "date": review.date,
                        }))
                    };
                });
                const bookDetails = await Promise.all(bookData);
                res.json({ "data": { "success": 1, "message": "Book found successfully...!!", bookDetails: bookDetails, "error": 0 } });
            } else {
                return res.json({ "data": { "success": 0, "message": "Book not found...!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
        return res.json({ "data": { "success": 0, "message": "An error occurred...!!*", "error": 1 } });
    }
}

// Get Book By Author
const GetBookByAuthor = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Check if authorId is provided
            if (!req.body.authorId) {
                return res.json({ "data": { "success": 0, "message": "authorId is required...!!*", "error": 1 } });
            }

            // Fetch top 5 books by authorId sorted by rating
            const sortedBooks = await GetBooksByReviewRatingWithFilter(req.body.authorId, 'author', 5); // Fetch top 5 books by authorId sorted by rating

            // Check if books are found
            if (sortedBooks && sortedBooks.length > 0) {
                res.json({ "data": { "success": 1, "message": "Books found successfully.", bookDetails: sortedBooks, "error": 0 } });
            } else {
                res.json({ "data": { "success": 0, "message": "Books not found.", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
        return res.json({ "data": { "success": 0, "message": "An error occurred...!!*", "error": 1 } });
    }
}

// Get Book By Category
const GetBookByCategory = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Check if categoryId is provided
            if (!req.body.categoryId) {
                return res.json({ "data": { "success": 0, "message": "categoryId is required...!!*", "error": 1 } });
            }

            // Fetch top 5 books by categoryId sorted by rating
            const sortedBooks = await GetBooksByReviewRatingWithFilter(req.body.categoryId, 'category', 5); // Fetch top 5 books by authorId sorted by rating

            // Check if books are found
            if (sortedBooks && sortedBooks.length > 0) {
                res.json({ "data": { "success": 1, "message": "Books found successfully.", bookDetails: sortedBooks, "error": 0 } });
            } else {
                res.json({ "data": { "success": 0, "message": "Books not found.", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
        return res.json({ "data": { "success": 0, "message": "An error occurred...!!*", "error": 1 } });
    }
}

// Get Book By Subcategory
const GetBookBySubcategory = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Check if subcategoryId is provided
            if (!req.body.subcategoryId) {
                return res.json({ "data": { "success": 0, "message": "subcategoryId is required...!!*", "error": 1 } });
            }
            // Fetch top 5 books by subcategoryId sorted by rating
            const sortedBooks = await GetBooksByReviewRatingWithFilter(req.body.subcategoryId, 'subcategory', 5); // Fetch top 5 books by authorId sorted by rating
            // Check if books are found
            if (sortedBooks && sortedBooks.length > 0) {
                res.json({ "data": { "success": 1, "message": "Books found successfully.", bookDetails: sortedBooks, "error": 0 } });
            } else {
                res.json({ "data": { "success": 0, "message": "Books not found.", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
        return res.json({ "data": { "success": 0, "message": "An error occurred...!!*", "error": 1 } });
    }
}

// Add Book Review
const AddFavouriteBook = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const userId = req.body.userId;
            const bookId = req.body.bookId;

            // Check if the favorite book already exists
            const existingFavourite = await FavouriteBook.findOne({ userId, bookId });

            // Add the favorite book if it does not exist
            if (!existingFavourite) {
                const addFavourite = new FavouriteBook({ userId, bookId });
                const saveFavourite = await addFavourite.save();

                // Check if the favorite book is added
                if (saveFavourite) {
                    return res.json({ "data": { "success": 1, "message": "Favourite Book Added Successfully", "error": 0 } });
                } else {
                    return res.json({ "data": { "success": 0, "message": "Favourite Book Not Added", "error": 1 } });
                }
            } else {
                return res.json({ "data": { "success": 0, "message": "Favourite Book Already Exists", "error": 1 } });
            }
        });
    } catch (error) {
        console.error("An error occurred while adding favorite book:", error);
        return res.status(500).json({ "data": { "success": 0, "message": "Internal Server Error", "error": 1 } });
    }
}

// Get Favorite Books
const GetFavouriteBook = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const userId = req.body.userId;
            // Fetch user's favorite books
            const favouriteBooks = await FavouriteBook.find({ userId }).populate('bookId', 'name image');

            if (favouriteBooks.length > 0) {
                // Fetch books sorted by review rating
                const sortedBooks = await GetBooksByReviewRating();

                // Map favorite books with average rating
                const favouriteBookData = favouriteBooks.map(favourite => {
                    // Find the corresponding book details in sortedBooks
                    const bookDetails = sortedBooks.find(book => book._id.toString() === favourite.bookId._id.toString());
                    return {
                        userId: favourite.userId,
                        bookDetails: {
                            _id: bookDetails._id,
                            name: bookDetails.name,
                            image: bookDetails.image,
                            author: bookDetails.author,
                            averageRating: bookDetails.averageRating
                        }
                    };
                });

                return res.json({ data: { success: 1, message: "Favorite Books Found", favouriteBookDetails: favouriteBookData, error: 0 } });
            } else {
                return res.json({ data: { success: 0, message: "Favorite Books Not Found", error: 1 } });
            }
        });
    } catch (error) {
        return res.status(500).json({ data: { success: 0, message: "Internal Server Error", error: 1 } });
    }
}

// Remove Favorite Book
const RemoveFavouriteBook = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Get userId and bookId from the request body
            const userId = req.body.userId;
            const bookId = req.body.bookId;

            // Check if the favorite book exists
            const existingFavourite = await FavouriteBook.findOne({ userId, bookId });

            // Remove the favorite book if it exists
            if (existingFavourite) {
                const removeFavourite = await FavouriteBook.deleteOne({ userId, bookId });
                if (removeFavourite.deletedCount > 0) {
                    return res.json({ "data": { "success": 1, "message": "Favorite Book Removed Successfully", "error": 0 } });
                } else {
                    return res.json({ "data": { "success": 0, "message": "Favorite Book Not Removed", "error": 1 } });
                }
            } else {
                return res.json({ "data": { "success": 0, "message": "Favorite Book Not Found", "error": 1 } });
            }
        });
    } catch (error) {
        console.error("An error occurred while removing favorite book:", error);
        return res.status(500).json({ "data": { "success": 0, "message": "Internal Server Error", "error": 1 } });
    }
}

// Get Subscription Plan
const GetSubscriptionPlan = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Fetch active subscription plans
            let subscriptions = await Subscription.find().sort({ price: 1 });

            // Check if subscription plans are found
            if (subscriptions.length > 0) {

                // Process each subscription plan to return only required data
                const subscriptionData = subscriptions.map(subscription => ({
                    "_id": subscription._id,
                    "name": subscription.name,
                    "duration": subscription.duration,
                    "duration_in_terms": subscription.duration_in_terms,
                    "price": subscription.price,
                    "image": subscription.image,
                    "is_active": subscription.is_active
                }));

                res.json({ "data": { "success": 1, "message": "Subscription Plan found successfully...!!", subscriptionDetails: subscriptionData, "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Subscription Plan not found...!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// Get Pages
const GetPages = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Fetch all pages
            let pages = await Page.find();

            // Check if pages are found
            if (pages.length > 0) {

                // Process each page to return only required data
                const pagesData = pages.map(page => ({
                    "_id": page._id,
                    "delete_account_instruction": removeNonBreakingSpaces(removeAttributes(page.delete_account_instruction.replace(/\\/g, ''))),
                    "terms_of_use": removeNonBreakingSpaces(removeAttributes(page.terms_of_use.replace(/\\/g, ''))),
                    "privacy_policy": removeNonBreakingSpaces(removeAttributes(page.privacy_policy.replace(/\\/g, ''))),
                    "about_us": removeNonBreakingSpaces(removeAttributes(page.about_us.replace(/\\/g, '')))
                }));

                res.json({ "data": { "success": 1, "message": "Pages found successfully...!!", pagesDetails: pagesData, "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Pages not found...!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// Get Payment method
const PaymentMethod = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
        const paymentMethods = await PaymentGateway.find({});
        if (paymentMethods) {
            const paymentData = paymentMethods.map(payment => {
                let enabledMethods = {};
                
                if (payment.paypal_is_enable === 1) {
                    enabledMethods.paypal = {
                        "paypal_is_enable": payment.paypal_is_enable,
                        "paypal_mode": payment.paypal_mode,
                        "paypal_merchant_Id": payment.paypal_mode == "testMode" ? payment.paypal_testmode_merchant_Id : payment.paypal_livemode_merchant_Id,
                        "paypal_tokenization_key": payment.paypal_mode == "testMode" ? payment.paypal_testmode_tokenization_key : payment.paypal_livemode_tokenization_key,
                        "paypal_public_key": payment.paypal_mode == "testMode" ? payment.paypal_testmode_public_key : payment.paypal_livemode_public_key,
                        "paypal_private_key": payment.paypal_mode == "testMode" ? payment.paypal_testmode_private_key : payment.paypal_livemode_private_key
                    };
                }

                if (payment.stripe_is_enable === 1) {
                    enabledMethods.stripe = {
                        "stripe_is_enable": payment.stripe_is_enable,
                        "stripe_test_mode": payment.stripe_mode,
                        "stripe_publishable_key": payment.stripe_mode == "testMode" ? payment.stripe_testmode_publishable_key : payment.stripe_livemode_publishable_key,
                        "stripe_secret_key": payment.stripe_mode == "testMode" ? payment.stripe_testmode_secret_key : payment.stripe_livemode_secret_key
                    };
                }

                if (payment.razorpay_is_enable === 1) {
                    enabledMethods.razorpay = {
                        "razorpay_is_enable": payment.razorpay_is_enable,
                        "razorpay_mode": payment.razorpay_mode,
                        "razorpay_key_Id": payment.razorpay_mode == "testMode" ? payment.razorpay_testmode_key_Id : payment.razorpay_livemode_key_Id,
                        "razorpay_key_secret": payment.razorpay_mode == "testMode" ? payment.razorpay_testmode_key_secret : payment.razorpay_livemode_key_secret
                    };
                }

                if (payment.direct_bank_transfer_is_enable === 1) {
                    enabledMethods.direct_bank_transfer = {
                        "direct_bank_transfer_is_enable": payment.direct_bank_transfer_is_enable,
                        "direct_bank_transfer_bank_name": payment.direct_bank_transfer_bank_name,
                        "direct_bank_transfer_account_name": payment.direct_bank_transfer_account_name,
                        "direct_bank_transfer_account_number": payment.direct_bank_transfer_account_number,
                        "direct_bank_transfer_iban": payment.direct_bank_transfer_iban,
                        "direct_bank_transfer_swift_code": payment.direct_bank_transfer_swift_code,
                        "direct_bank_transfer_bank_address": payment.direct_bank_transfer_bank_address,
                        "direct_bank_transfer_instructions": payment.direct_bank_transfer_instructions,
                        "direct_bank_transfer_currency": payment.direct_bank_transfer_currency
                    };
                }

                if (payment.cash_on_delivery_is_enable === 1) {
                    enabledMethods.cash_on_delivery = {
                        "cash_on_delivery_is_enable": payment.cash_on_delivery_is_enable
                    };
                }

                return enabledMethods;
            });
            res.json({ "data": { "success": 1, "message": "Payment Gateway found successfully..!!", paymentMethod: paymentData, "error": 0 } });
        }
        else {
            return res.json({ "data": { "success": 0, "message": "Payment Gateway not found..!!*", "error": 1 } });
        }
        });
    } catch (error) {
        console.log(error);
    }
}

// Puchase Subscription Plan
const UserSubscriptionPlan = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const { userId, subscriptionplanId, paymentmode, transactionId, paymentstatus, paymentdate, price } = req.body;

            // Check if subscription plan exists
            const subscriptionPlan = await Subscription.findById(subscriptionplanId);
            if (!subscriptionPlan) {
                return res.json({ "data": { "success": 0, "message": "Subscription plan not found.", "error": 1 } });
            }

            // Check if the payment date is not in the past
            const paymentDateParts = paymentdate.split('-');
            const paymentDate = new Date(parseInt(paymentDateParts[2]), parseInt(paymentDateParts[1]) - 1, parseInt(paymentDateParts[0]));
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);  // Set current date to midnight for accurate comparison
            if (paymentDate < currentDate) {
                return res.json({ "data": { "success": 0, "message": "Payment date cannot be in the past.", "error": 1 } });
            }

            // Check if the user already has an active subscription
            const existingSubscriptions = await UserSubscription.find({ userId });
            for (const subscription of existingSubscriptions) {
                const existingExpirationDate = new Date(subscription.expirationdate.split('-').reverse().join('-'));
                if (existingExpirationDate > currentDate) {
                    return res.json({ "data": { "success": 0, "message": "You cannot purchase a new subscription plan before the expiry date of the current plan.", "error": 1 } });
                }
            }

            // Calculate end date of subscription
            const endDate = new Date(paymentDate);
            const duration = parseInt(subscriptionPlan.duration);
            const durationTerms = subscriptionPlan.duration_in_terms.toLowerCase();

            if (durationTerms === 'day' || durationTerms === 'days') {
                endDate.setDate(endDate.getDate() + duration);
            } else if (durationTerms === 'month' || durationTerms === 'months') {
                endDate.setMonth(endDate.getMonth() + duration);
            } else if (durationTerms === 'year' || durationTerms === 'years') {
                endDate.setFullYear(endDate.getFullYear() + duration);
            } else {
                return res.json({ "data": { "success": 0, "message": `Invalid duration terms: ${subscriptionPlan.duration_in_terms}`, "error": 1 } });
            }

            const formattedExpirationDate = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

            // Create new subscription with expiration date
            const addSubscription = new UserSubscription({
                userId,
                subscriptionplanId,
                paymentmode,
                transactionId,
                paymentstatus,
                paymentdate,
                price,
                expirationdate: formattedExpirationDate
            });

            // Save user subscription plan
            const userPlan = await addSubscription.save();

            res.json({ "data": { "success": 1, "message": "Subscription plan purchased successfully.", "error": 0 } });
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ "data": { "success": 0, "message": "Internal server error", "error": 1 } });
    }
}

// Get User Subscription Plan Records
const UserSubscriptionrecord = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            if (!req.body.userId) {
                return res.json({ "data": { "success": 0, "message": "UserId is required..!!*", "error": 1 } });
            }
            const subscriptionRecords = await UserSubscription.find({ userId: req.body.userId }).populate('subscriptionplanId', 'name duration duration_in_terms price').sort({ createdAt: -1 });
            if (subscriptionRecords.length > 0) {
                const subscriptionsData = subscriptionRecords.map(subscriptionRecord => ({
                    "_id": subscriptionRecord._id,
                    "userId": subscriptionRecord.userId,
                    "subscriptionplanDetails": subscriptionRecord.subscriptionplanId,
                    "paymentmode": subscriptionRecord.paymentmode,
                    "transactionId": subscriptionRecord.transactionId,
                    "paymentstatus": subscriptionRecord.paymentstatus,
                    "paymentdate": subscriptionRecord.paymentdate,
                    "price": subscriptionRecord.price,
                    "expirationdate": subscriptionRecord.expirationdate
                }));
                res.json({ "data": { "success": 1, "message": "User Subscriptionplan record retrived successfully..!!", subscriptionDetails: subscriptionsData, "error": 0 } });
            } else {
                return res.json({ "data": { "success": 0, "message": "User Subscriptionplan record not found..!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ "data": { "success": 0, "message": "An error occurred..!!*", "error": 1 } });
    }
}

// Subscription Plan Validity
const UserSubscriptionPlanValidity = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const { userId } = req.body;

            if (!userId) {
                return res.json({ "data": { "success": 0, "message": "UserId is required..!!*", "error": 1 } });
            }

            // Fetch the latest subscription record
            const subscriptionRecord = await UserSubscription.findOne({ userId })
                .populate('subscriptionplanId')
                .sort({ createdAt: -1 });

            if (!subscriptionRecord) {
                return res.json({ "data": { "success": 0, "message": "Subscription record not found..!!*", "error": 1 } });
            }

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);  // Set current date to midnight for accurate comparison

            // Fetch subscription plan details
            const subscriptionPlan = subscriptionRecord.subscriptionplanId;
            if (!subscriptionPlan) {
                return res.json({ "data": { "success": 0, "message": "Subscription plan not found..!!*", "error": 1 } });
            }

            // Parse payment date string into a Date object
            const paymentDateParts = subscriptionRecord.paymentdate.split('-');
            const paymentDate = new Date(parseInt(paymentDateParts[2]), parseInt(paymentDateParts[1]) - 1, parseInt(paymentDateParts[0]));

            // Calculate end date of subscription based on duration from subscription plan
            const endDate = new Date(paymentDate);
            const duration = parseInt(subscriptionPlan.duration);
            const durationTerms = subscriptionPlan.duration_in_terms.toLowerCase();

            if (isNaN(duration)) {
                return res.json({ "data": { "success": 0, "message": "Invalid duration value..!!*", "error": 1 } });
            }

            switch (durationTerms) {
                case 'day':
                case 'days':
                    endDate.setDate(endDate.getDate() + duration);
                    break;
                case 'month':
                case 'months':
                    endDate.setMonth(endDate.getMonth() + duration);
                    break;
                case 'year':
                case 'years':
                    endDate.setFullYear(endDate.getFullYear() + duration);
                    break;
                default:
                    return res.json({ "data": { "success": 0, "message": "Invalid duration terms..!!*", "error": 1 } });
            }

            // Calculate days left
            let daysLeft = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
            daysLeft = Math.max(0, daysLeft); // Ensure days left is not negative

            // Format expiration date as "DD-MM-YYYY"
            const formattedExpirationDate = endDate.toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            }).replace(/\//g, '-');

            const subscriptionData = {
                "_id": subscriptionRecord._id,
                "userId": subscriptionRecord.userId,
                "subscriptionplanDetails": {
                    "_id": subscriptionPlan._id,
                    "name": subscriptionPlan.name,
                    "duration": subscriptionPlan.duration,
                    "duration_in_terms": subscriptionPlan.duration_in_terms,
                    "price": subscriptionPlan.price
                },
                "paymentdate": subscriptionRecord.paymentdate,
                "expirationDate": formattedExpirationDate,
                "daysLeft": daysLeft
            };

            return res.json({ "data": { "success": 1, "message": "Your Subscription plan validity..!!", subscriptionDetails: subscriptionData, "error": 0 } });
        });
    } catch (error) {
        console.log(error);
        res.json({ "data": { "success": 0, "message": "An error occurred..!!*", "error": 1 } });
    }
}

// Get Currency
const GetCurrency = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            // Fetch all currency
            let getCurrency = await Currency.find();

            // Check if currency are found
            if (getCurrency.length > 0) {
                const currencyData = getCurrency.map(currency => ({
                    "_id": currency._id,
                    "currency": currency.currency,
                }));
                return res.json({ "data": { "success": 1, "message": "Currency found Successfully..!!", currencydetails: currencyData, "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Currency not found !!*", "error": 1 } });
            }
        });
    } catch (error) {
        return res.json({ "data": { "success": 0, "message": "Currency not found !!*", "error": 1 } });
    }
}

// Add Review
const AddReview = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            const AddReviw = new BookReview({
                bookId: req.body.bookId,
                userId: req.body.userId,
                description: req.body.description,
                date: req.body.date,
                time: req.body.time,
                rating: req.body.rating
            });

            // Save review
            const reviewData = await AddReviw.save();
            if (reviewData) {
                return res.json({ "data": { "success": 1, "message": "Book review added!!", "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Book review not added..!!*", "error": 1 } });
            }
        });
    } catch (error) {
        return res.json({ "data": { "success": 0, "message": "Book review not added !!*", "error": 1 } });
    }
}

// Get Review
const GetReview = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            let reviews = await BookReview.find({ is_active: true, bookId: req.body.bookId }).populate('bookId').populate('userId', 'image username');
            if (reviews.length > 0) {
                let books = await Book.find({ _id: req.body.bookId });
                if (books.length > 0) {
                    const bookData = books.map(book => ({
                        "_id": book._id,
                        "name": book.name,
                        "image": book.image,
                        "reviews": reviews.map(review => ({
                            "_id": review._id,
                            "userDetails": {
                                "_id": review.userId._id,
                                "name": review.userId.username,
                                "image": review.userId.image
                            },
                            "bookId": review.bookId._id,
                            "description": review.description,
                            "rating": review.rating,
                            "date": review.date,
                        }))
                    }));
                    return res.json({ "data": { "success": 1, "message": "Book review found!!", "bookReviewDetails": bookData, "error": 0 } });
                }
            } else {
                return res.json({ "data": { "success": 0, "message": "Book review not found..!!*", "error": 1 } });
            }
        });
    } catch (error) {
        return res.json({ "data": { "success": 0, "message": "Book review not found..!!*", "error": 1 } });
    }
}

// Download PDF
const DownloadPDF = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            if (!req.body.userId || !req.body.bookId) {
                return res.json({ "data": { "success": 0, "message": "UserId and BookId are required..!!*", "error": 1 } });
            }
            const findBook = await Book.findOne({ _id: req.body.bookId });
            if (findBook) {
                const checkpdf = await Downloadpdf.findOne({ userId: req.body.userId, bookId: req.body.bookId }); console.log(checkpdf);

                if (checkpdf) {
                    return res.json({ "data": { "success": 0, "message": "PDF already downloaded..!!*", "error": 1 } });
                } else {
                    const savepdf = new Downloadpdf({
                        userId: req.body.userId,
                        bookId: req.body.bookId,
                    });
                    const pdfData = await savepdf.save();
                    if (pdfData) {
                        return res.json({ "data": { "success": 1, "message": "PDF successfully downloaded!!", "error": 0 } });
                    } else {
                        return res.json({ "data": { "success": 0, "message": "PDF not downloaded..!!*", "error": 1 } });
                    }
                }
            } else {
                return res.json({ "data": { "success": 0, "message": "Book not found..!!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.error(error);
        return res.json({ "data": { "success": 0, "message": "PDF not downloaded !!*", "error": 1 } });
    }
}

// Download History
const DownloadHistory = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            //let downloads = await Downloadpdf.find({ userId: req.body.userId }).populate('bookId', 'name image pdf authoId'); 
            let downloads = await Downloadpdf.find({ userId: req.body.userId }).populate({ path: 'bookId', populate: { path: 'authorId' } }).select('name image pdf authorId');

            if (downloads.length > 0) {

                const downloadsData = downloads.map(download => ({
                    "_id": download._id,
                    "bookDetails": {
                        "_id": download.bookId._id,
                        "name": download.bookId.name,
                        "image": download.bookId.image,
                        "pdf": download.bookId.pdf,
                        "author": {
                            "_id": download.bookId.authorId._id,
                            "name": download.bookId.authorId.name,
                            "image": download.bookId.authorId.image,
                            "since_year": download.bookId.authorId.since_year
                        }
                    }
                }));
                return res.json({ "data": { "success": 1, "message": "Download history found Successfully..!!", downloadDetails: downloadsData, "error": 0 } });
            }
            else {
                return res.json({ "data": { "success": 0, "message": "Download history not found !!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// Get Notifications
const GetNotifications = async (req, res) => {
    try {
        await verifyAccess(req, res, async () => {
            let notifications = await CommonNotification.find().populate('bookId', 'name image');
            if (notifications.length > 0) {
                const notificationsData = notifications.map(notification => {
                    if (notification.bookId) { // Include book details only if bookId exists
                        return {
                            "_id": notification._id,
                            "title": notification.title,
                            "description": notification.description,
                            "date": notification.createdAt.toLocaleDateString(),
                            "bookDetails": {
                                "_id": notification.bookId._id,
                                "name": notification.bookId.name,
                                "image": notification.bookId.image
                            }
                        };
                    } else {
                        return { // Return only essential notification details without bookDetails
                            "_id": notification._id,
                            "title": notification.title,
                            "description": notification.description,
                            "date": notification.createdAt.toLocaleDateString()
                        };
                    }
                });
                return res.json({ "data": { "success": 1, "message": "Notifications found Successfully..!!", notificationDetails: notificationsData, "error": 0 } });
            } else {
                return res.json({ "data": { "success": 0, "message": "Notifications not found !!*", "error": 1 } });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    CheckRegisteredUser,
    SendOTP,
    Signup,
    GetUserOTP,
    OTPVerification,
    VerifyUser,
    ResendOTP,
    SignIn,
    ForgotPasswordOTP,
    GetForgotPasswordOTP,
    ForgotPassword,
    ForgotPasswordVerification,
    ResetPassword,
    UploadImage,
    EditUser,
    ChangePassword,
    GetUser,
    DeleteUser,
    signOut,
    GetCategories,
    GetSubcategories,
    GetSubcategoryByCategory,
    GetAuthors,
    GetAuthorDetails,
    GetBook,
    GetBooksByReviewRating,
    GetBooksByReviewRatingWithFilter,
    GetPopularBooks,
    GetTrendingBooks,
    GetBookDetails,
    GetBookByAuthor,
    GetBookByCategory,
    GetBookBySubcategory,
    AddFavouriteBook,
    GetFavouriteBook,
    RemoveFavouriteBook,
    GetSubscriptionPlan,
    PaymentMethod,
    GetPages,
    GetCurrency,
    UserSubscriptionPlan,
    UserSubscriptionrecord,
    UserSubscriptionPlanValidity,
    AddReview,
    GetReview,
    DownloadPDF,
    DownloadHistory,
    GetNotifications
}