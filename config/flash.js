// Exporting the flash messages to be used in the views
module.exports.setflash = (req, res, next) => {
    res.locals.flash = {
        'success': req.flash('success'),
        'error': req.flash('error')
    }
    next()
}