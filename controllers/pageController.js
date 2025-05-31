const Admin = require("../models/adminModel");
const Page = require("../models/pagesModel");
const { verifyAdminAccess } = require('../config/verification');

// Load Page
const pageLoad = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => { 
            const pages = await Page.findOne({});
            res.render('page', { pages: pages });
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Add Pages Content
const addPages = async (req, res) => {
    try {
        // Find admin directly by session ID
        const admin = await Admin.findById(req.session.user_id);

        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('back');
        }

        if (admin.is_admin !== 1) {
            req.flash('error', 'You do not have permission to update pages. Only super admins can perform this action.');
            return res.redirect('back');
        }

        const pageData = {
            delete_account_instruction: req.body.delete_account_instruction,
            terms_of_use: req.body.terms_of_use,
            privacy_policy: req.body.privacy_policy,
            about_us: req.body.about_us
        };

        let page = await Page.findOne();

        if (!page) {
            // Create new page if none exists
            page = new Page(pageData);
        } else {
            // Update existing page
            Object.assign(page, pageData);
        }

        await page.save();
        req.flash('success', 'Pages updated successfully');
        res.redirect('/add-page');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Error updating pages');
        res.redirect('back');
    }
}

module.exports = {
    pageLoad,
    addPages
}