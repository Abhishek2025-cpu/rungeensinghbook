const fs = require("fs");
const path = require('path')
const userimages = path.join('./public/assets/userImages/');
const Category = require("../models/categoryModel");
const Subcategory = require("../models/subCategoryModel");
const Admin = require("../models/adminModel");
const { verifyAdminAccess } = require('../config/verification');

// Subcaegory Load
const subcategoryLoad = async(req,res)=>{
    try {
        const category = await Category.find({});
        res.render('addSubcategory',{category:category});
    } catch (error) {
        console.log(error.message);
    }
}

// Add Subcategory
const addSubCategory = async (req, res) => {
    try {
        // Find admin by ID instead of getting all admins
        const admin = await Admin.findById(req.session.user_id);
        
        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('back');
        }

        if (admin.is_admin !== 1) {
            req.flash('error', 'You do not have permission to add subcategories. Only super admins can perform this action.');
            return res.redirect('back');
        }

        const category = await Category.find();

        // Validate required fields
        if (!req.body.name || !req.file || !req.body.categoryId) {
            res.render('addSubcategory', { 
                message: "Please fill all required fields",
                category: category 
            });
            return;
        }

        const subcategoryData = new Subcategory({
            name: req.body.name.trim(),
            image: req.file.filename,
            categoryId: req.body.categoryId,
            is_active: req.body.is_active === "on" ? 1 : 0
        });

        await subcategoryData.save();

        req.flash('success', 'Subcategory added');
        res.redirect('/view-subcategory');

    } catch (error) {
        console.log(error.message);
    }
}

// View Subcategory
const viewSubcategory = async (req, res) => {
    try {
        await verifyAdminAccess(req, res, async () => {
        let loginData = await Admin.findById({_id: req.session.user_id});
            const subcategories = await Subcategory.find({}).sort({updatedAt: -1}).populate('categoryId');
            if (subcategories) {
                res.render('subcategory', { subcategory: subcategories ,loginData: loginData });
            } else {
                console.log(error.message);
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

// Edit Subcategory
const editSubcategory = async (req, res) => {
    try {
        const id = req.query.id;
        const category = await Category.find();
        const editData = await Subcategory.findById({ _id: id });
        if (editData) {
            res.render('editSubcategory', { subcategory: editData,category : category });
        }
        else {
            res.render('editSubcategory', { message: "Subcategory not added..!!*" });
        }

    } catch (error) {
        console.log(error.message);
    }
}

// Update Subcategory
const UpdateSubategory = async(req,res)=>{
    try {
        // Find admin directly by session ID
        const admin = await Admin.findById({_id:req.session.user_id});

        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('back');
        }

        if (admin.is_admin !== 1) {
            req.flash('error', 'You have no access to edit Subcategory, You are not super admin!');
            return res.redirect('back');
        }

        const id = req.body.id;
        const currentSubcategory = await Subcategory.findById(id);

        if (!currentSubcategory) {
            req.flash('error', 'Subcategory not found');
            return res.redirect('back');
        }

        const updateData = {
            name: req.body.name,
            categoryId: req.body.categoryId
        };

        if (req.file) {
            // Delete old image if exists
            if (fs.existsSync(userimages + currentSubcategory.image)) {
                fs.unlinkSync(userimages + currentSubcategory.image);
            }
            updateData.image = req.file.filename;
        }

        await Subcategory.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        req.flash('success', 'Subcategory updated');
        res.redirect('/view-subcategory');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Error updating subcategory');
        res.redirect('back');
    }
}

// Set Subcategory Status
const activeStatus = async(req,res)=>{
    try {
        const { id } = req.params;
        const status = await Subcategory.findById(id);
        const is_active = req.body.is_active ? req.body.is_active : "false";
        if (!status) {
            return res.sendStatus(404);
        }
        status.is_active = !status.is_active;
        await status.save();
        res.redirect('/view-subcategory');
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

// Delete Subcategory
const deleteSubcategory = async(req,res)=>{
    try {
        const id = req.query.id;
        const currentSubcat = await Subcategory.findById(id);
        if (currentSubcat) {
            if (fs.existsSync(userimages + currentSubcat.image))
            {
                fs.unlinkSync(userimages + currentSubcat.image)
            }
        }
        const delsubCat = await Subcategory.deleteOne({ _id: id });
        res.redirect('/view-subcategory');
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    subcategoryLoad,
    addSubCategory,
    viewSubcategory,
    editSubcategory,
    UpdateSubategory,
    activeStatus,
    deleteSubcategory
}