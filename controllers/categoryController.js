const fs = require("fs");
const path = require('path')
const userimages = path.join('./public/assets/userImages/');
const Category = require("../models/categoryModel");
const Admin = require("../models/adminModel");


// Load Category
const categoryLoad = async (req, res) => {
    try {
        res.render('addCategory');
    } catch (error) {
        console.log(error.message);
    }
}

// Add Category
const addCategory = async (req, res) => {
    try {
        // Get admin user data
        const admin = await Admin.findById(req.session.user_id);
        
        if (!admin) {
            req.flash('error', 'Admin user not found');
            return res.redirect('back');
        }

        // Check if user is super admin
        if (admin.is_admin !== 1) {
            req.flash('error', 'You do not have permission to add categories. Super admin access required.');
            return res.redirect('back');
        }

        // Validate required fields
        if (!req.body.name || !req.file) {
            req.flash('error', 'Category name and image are required');
            return res.redirect('back');
        }

        // Create new category
        const categoryData = new Category({
            name: req.body.name,
            image: req.file.filename,
            is_active: req.body.is_active === "on" ? 1 : 0
        });

        // Save category
        const savedCategory = await categoryData.save();

        if (savedCategory) {
            req.flash('success', 'Category added');
            return res.redirect('/view-category');
        } else {
            req.flash('error', 'Failed to add category');
            return res.redirect('/view-category');
        }

    } catch (error) {
        console.error('Error adding category:', error);
        req.flash('error', 'An error occurred while adding the category');
        return res.redirect('back');
    }
}

// View Category
const viewCategory = async (req, res) => {
    try {
       
            let loginData = await Admin.findById({_id: req.session.user_id});
            const allCategory = await Category.find({}).sort({ updatedAt: -1 });
            if (allCategory) {
                res.render('category', { category: allCategory, loginData: loginData});
            }
            else {
                console.log(error.message);
            }

    } catch (error) {
        console.log(error.message);
    }
}

// Edit Category
const editCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const editData = await Category.findById({ _id: id });
        if (editData) {
            res.render('editCategory', { category: editData });
        }
        else {
            res.render('editCategory', { message: "Category not added..!!*" });
        }

    } catch (error) {
        console.log(error.message);
    }
}

// Update category
const UpdateCategory = async (req, res) => {
    try {
        // Find admin by session ID directly instead of looping through all admins
        const admin = await Admin.findById(req.session.user_id);

        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('back');
        }

        if (admin.is_admin !== 1) {
            req.flash('error', 'You do not have permission to edit categories. Super admin access required.');
            return res.redirect('back');
        }

        const id = req.body.id;
        const currentCategory = await Category.findById(id);

        if (!currentCategory) {
            req.flash('error', 'Category not found');
            return res.redirect('back');
        }

        // Build update object
        const updateData = {
            name: req.body.name
        };

        // Handle image update if new file uploaded
        if (req.file) {
            // Delete old image if it exists
            if (currentCategory.image && fs.existsSync(userimages + currentCategory.image)) {
                fs.unlinkSync(userimages + currentCategory.image);
            }
            updateData.image = req.file.filename;
        }

        // Update category
        await Category.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        req.flash('success', 'Category updated');
        return res.redirect('/view-category');

    } catch (error) {
        console.error('Error updating category:', error);
        req.flash('error', 'An error occurred while updating the category');
        return res.redirect('back');
    }
}

// Set Category Status
const activeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await Category.findById(id);
        const is_active = req.body.is_active ? req.body.is_active : "false";
        if (!status) {
            return res.sendStatus(404);
        }
        status.is_active = !status.is_active;
        await status.save();
        res.redirect('/view-category');
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

// Delete Category
const deleteCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const currentCategory = await Category.findById(id);
        if (currentCategory) {
            if (fs.existsSync(userimages + currentCategory.image)) {
                fs.unlinkSync(userimages + currentCategory.image)
            }
        }
        const delCategory = await Category.deleteOne({ _id: id });
        res.redirect('/view-category');
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    categoryLoad,
    addCategory,
    viewCategory,
    editCategory,
    UpdateCategory,
    activeStatus,
    deleteCategory
}