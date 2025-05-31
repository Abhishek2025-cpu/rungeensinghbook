const Admin = require("../models/adminModel");

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            const admin = await Admin.findById(req.session.user_id);
            if (admin) {
                res.locals.user = admin;
                next(); // Move next() inside the if block
            } else {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/'); // Redirect in case of an error
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect('/dashboard');
        } else {
            next(); // Move next() inside the else block
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/'); // Redirect in case of an error
    }
}

module.exports = { isLogin, isLogout }

// const Admin = require("../models/adminModel");
// const isLogin = async(req,res,next)=>{
//     try {
//         if (req.session.user_id) {
//             const admin = await Admin.findById({_id:req.session.user_id});
//             res.locals.user = admin;
//             } else {
//             res.redirect('/');
//         }
//         next();
//     } catch (error) {
//         console.log(error.message);
//     }
// }


// const isLogout = async(req,res,next)=>{
//     try {
//         if (req.session.user_id) {
//             res.redirect('/ebook/dashboard');
//         } 
//         next();
//     } catch (error) {
//         console.log(error.message);
//     }
// }



// module.exports = { isLogin, isLogout}