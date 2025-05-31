const Currency = require('../models/currencyModel');
const Admin = require('../models/adminModel');

// Load Currency
const currency = async (req, res) => {
    try {
        const currencyData = await Currency.findOne({})
        const selectedCurrency = currencyData ? currencyData.currency : "";
        return res.render('currency', { selectedCurrency });
    } catch (error) {
        console.error('Error fetching currency:', error);
    }
}

// Set Currency
const currencydata = async (req, res) => {
    try {
        // Find admin by session ID directly instead of looping through all admins
        const admin = await Admin.findById(req.session.user_id);
        
        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('back');
        }

        if (admin.is_admin !== 1) {
            req.flash('error', 'You do not have permission to change currency settings');
            return res.redirect('back');
        }

        // Update or create currency setting
        await Currency.findOneAndUpdate(
            {}, // empty filter to match any doc
            { currency: req.body.currency },
            { upsert: true, new: true }
        );

        req.flash('success', 'Currency updated');
        return res.redirect('back');

    } catch (error) {
        console.error('Error updating currency:', error);
        req.flash('error', 'An error occurred while updating currency');
        return res.redirect('back');
    }
}

module.exports = {
    currency,
    currencydata
}