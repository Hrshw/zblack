const jwt = require("jsonwebtoken");
const Register = require("../database/userschema");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.redirect("/login");
        }
        const verifyUser = await jwt.verify(token, process.env.SECRET_KEY);
        const user = await Register.findOne({ _id: verifyUser._id });
        if (!user) {
            return res.redirect("/login");
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.log(error);
        if (error.name === "JsonWebTokenError") {
            return res.redirect("/login");
        }
        res.status(500).send("Server Error");
    }
};

module.exports = auth;
