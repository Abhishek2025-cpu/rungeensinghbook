const fs = require("fs");
const path = require('path')
var he = require('he');
const userimages = path.join('./public/assets/userImages/');
const Author = require("../models/authorModel");
const Admin = require("../models/adminModel");
const { verifyAdminAccess } = require('../config/verification');

// Load Author
const authorLoad = async(req,res)=>{
    try {
        res.render('addAuthor');
    } catch (error) {
        console.log(error.message);
    }
}

// Add Author
const addAuthor = async (req, res) => {
    try {
        let loginData = await Admin.findById({_id: req.session.user_id, is_admin: 1});
            if(!loginData){
                req.flash('error', 'You have no access to add author , You are not super admin !! *');
                return res.redirect('back');
            }
            const authorData = new Author({
                name: req.body.name,
                since_year: req.body.since_year,
                image:req.file.filename,
                description:req.body.description,
                facebook_url:req.body.fb_url,
                instagram_url:req.body.ig_url,
                youtube_url:req.body.yt_url,
                website_url:req.body.website_url,
                is_active:req.body.is_active == "on" ? 1 : 0
                });
                const saveAuthor = await authorData.save();
                if (saveAuthor) {
                    req.flash('success', 'Author added');
                    return res.redirect('/view-author');
                }
                else {
                    req.flash('error', 'Author not added..!!*');
                    return res.redirect('/view-author');
                }
        } catch (error) {
            console.log(error.message);
        }
}   

// View Author
const viewAuthor = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => {
        let loginData = await Admin.findById({_id: req.session.user_id});
        const author = await Author.find({}).sort({updatedAt: -1});
            if (author) {
                res.render('author', { authorList: author ,loginData: loginData });
            }
            else {
                req.flash('error', 'Author not found..!!*');
                return res.redirect('/view-author');
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Edit Author
const editAuthor = async (req, res) => {
    try {
        const id = req.query.id;
        const editData = await Author.findById({ _id: id });
        if (editData) {
            res.render('editAuthor', { author: editData});
        }
        else {
            res.render('editAuthor', { message: "Author not added..!!*" });
        }

    } catch (error) {
        console.log(error.message);
    }
}

// Update Author
const updateAuthor = async(req,res)=>{
    try {
        // Find admin by ID directly instead of getting all admins
        const admin = await Admin.findById(req.session.user_id);

        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('back');
        }

        if (admin.is_admin !== 1) {
            req.flash('error', 'You have no access to edit author, you are not super admin!');
            return res.redirect('back');
        }

        const id = req.body.id;
        const currentAuthor = await Author.findById(id);

        if (!currentAuthor) {
            req.flash('error', 'Author not found');
            return res.redirect('back');
        }

        // Build update object
        const updateData = {
            name: req.body.name,
            since_year: req.body.since_year, 
            description: req.body.description,
            facebook_url: req.body.fb_url,
            instagram_url: req.body.ig_url,
            youtube_url: req.body.yt_url,
            website_url: req.body.website_url
        };

        // Handle image update if new file uploaded
        if (req.file) {
            if (currentAuthor.image && fs.existsSync(userimages + currentAuthor.image)) {
                fs.unlinkSync(userimages + currentAuthor.image);
            }
            updateData.image = req.file.filename;
        }

        await Author.findByIdAndUpdate(id, { $set: updateData });

        req.flash('success', 'Author updated');
        return res.redirect('/view-author');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Error updating author');
        return res.redirect('back');
    }
}

// Set Author Status
const activeStatus = async(req,res)=>{
    try {
        const { id } = req.params;
        const status = await Author.findById(id);
        const is_active = req.body.is_active ? req.body.is_active : "false";
        if (!status) {
            return res.sendStatus(404);
        }
        status.is_active = !status.is_active;
        await status.save();
        res.redirect('/view-author');

    } catch (err) {

        console.error(err);
        res.sendStatus(500);

    }
}

// Delete Author
const deleteAuthor = async(req,res)=>{
    try {
        const id = req.query.id;
        const currentAuthor = await Author.findById(id);
        if (currentAuthor) {
            if (fs.existsSync(userimages + currentAuthor.image))
            {
                fs.unlinkSync(userimages + currentAuthor.image)
            }
        }
        const delAuthor = await Author.deleteOne({ _id: id });
        res.redirect('/view-author');
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    authorLoad,
    addAuthor,
    viewAuthor,
    editAuthor,
    updateAuthor,
    activeStatus,
    deleteAuthor
}