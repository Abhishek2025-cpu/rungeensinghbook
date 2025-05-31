const Notification = require("../models/notificationModel");
const common_Notification = require("../models/commonNotificationModel");
const Admin = require("../models/adminModel");
require('dotenv').config();
const admin = require('../config/firebase'); 
const { verifyAdminAccess } = require('../config/verification');

// Load Notification Page
const loadNotification = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => { 
            res.render('notification');
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Add Notification
const addNotification = async (req, res) => {
    try {
        // Find admin directly by session ID
        const admin = await Admin.findById(req.session.user_id);

        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('back');
        }

        if (admin.is_admin !== 1) {
            req.flash('error', 'You do not have permission to send notifications. Only super admins can perform this action.');
            return res.redirect('back');
        }

        // Create and save notification
        const notificationData = new common_Notification({
            title: req.body.title,
            description: req.body.description
        });
        await notificationData.save();

        // Get unique registration tokens
        const notifications = await Notification.find();
        const registrationTokens = [...new Set(
            notifications
                .filter(n => n.registrationToken)
                .map(n => n.registrationToken)
        )];

        // Send push notification
        if (registrationTokens.length > 0) {
            await sendPushNotification(
                registrationTokens,
                notificationData.title,
                notificationData.description
            );
        }

        req.flash('success', 'Notification sent successfully');
        res.redirect('back');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Error sending notification');
        res.redirect('back');
    }
}

// Firebase Push Notification to all users
// function sendPushNotifications(serverKey, deviceTokens, title, body) {
//     const fcm = new FCM(serverKey);
  
//     const message = {
//       notification: {
//         title: title,
//         body: body,
//       },
//     };
  
//     deviceTokens.forEach((token) => {
//       // Set the recipient's device token in the 'to' field of the message
//       message.to = token;
  
//       fcm.send(message, function(err, response) {
//         if (err) {
//           console.log(`Failed to send notification to ${token}:`, err);
//         } else {
//           console.log(`Notification sent to ${token}:`, response);
//         }
//       });
//     });
// }

// Function to send a notification with title and body using FCM
// function sendPushNotification() {

//     const registrationTokens = ['eU9FdhoaTjqH9TtKVRcTG4:APA91bGdSMupzVRdl6lzfGyjd2sx7mYcTyXtN9VSie3eoiNDLjPnhMvtL3Jch6Xhzr44IjRjgCZkkuL33DNhBWSLjZsXMkcBoXlImpNJfRVqUHdJ3RCgSru8eYPX0D3crSkLlvBZTl20',
//         'cfvcMuGNSRyj-ZPz5bnKTO:APA91bEM0C2VTueaO0LSN3bRur0YmcJH7NkVNe_QFoc48ExzMTCzfnQRZ_bvq3iHHzwmmsYP32-aCekwC0g--8z699Fx66w1cxp_xDgr6QpZJwx5mOR5Btxe21YJH3uc2Hw5qzHWnKAZ',
//         'e7Ynr4oBRHmcxuzBVMO2TT:APA91bGnayQqKCwKstwHCAbjKkB99EiwOllG8YZQ5fI6wTWpY2ffyPDv2IhbLq5fMOC-YkHu3V8WduCWXSHg1iZi7WEANh02BXxnHlqUtmUdWkQH4JUjx3sCzYmWfpetePSWHMKoKJgp'
//     ];  
//       const message = {
//         notification: {
//             title: "title",
//             body: "body"
//         },
//         tokens: registrationTokens
//     };
//     // Send the message to all devices corresponding to the provided registration tokens
//     admin.messaging().sendMulticast(message)
//       .then((response) => {
//         console.log('Successfully sent message to all tokens:', response);
//       })
//       .catch((error) => {
//         console.log('Error sending message:', error);
//       });
// }

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
    loadNotification,
    addNotification
}