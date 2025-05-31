const Admin = require("../models/adminModel");
const SMTP = require("../models/SMTPModel");
const { verifyAdminAccess } = require('../config/verification');

// Load SMTP
const smtpLoad = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => { 
            const smtp = await SMTP.findOne({});
            res.render('SMTP', { smtp: smtp });
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Set SMTP
const setSMTP = async (req, res) => {
    try {
        // Find admin directly by session ID
        const admin = await Admin.findById(req.session.user_id);

        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('back');
        }

        if (admin.is_admin !== 1) {
            req.flash('error', 'You do not have permission to update SMTP settings. Only super admins can perform this action.');
            return res.redirect('back');
        }

        const smtpData = {
            host: req.body.host,
            port: req.body.port,
            email: req.body.email,
            password: req.body.password,
            encryption: req.body.encryption
        };

        let smtp = await SMTP.findOne();

        if (!smtp) {
            // Create new SMTP settings if none exist
            smtp = new SMTP(smtpData);
        } else {
            // Update existing SMTP settings
            Object.assign(smtp, smtpData);
        }

        await smtp.save();
        req.flash('success', 'SMTP updated');
        res.redirect('back');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Error updating SMTP settings');
        res.redirect('back');
    }
}

module.exports = { smtpLoad, setSMTP }