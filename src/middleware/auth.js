const jwt = require("jsonwebtoken");
const Register = require("../database/userschema");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        console.log(token)
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        const user = await Register.findOne({_id:verifyUser._id});
        console.log(user)

        next();
    } catch (error) {
        res.status(401).send(error);
    }
}

module.exports = auth;