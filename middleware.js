module.exports.requireLoggedInUser = (req, res, next) => {
    !req.session.userId && req.url !== "/petition/login" && req.url !== "/petition/register" ?
        res.redirect("/petition/register")
        :
        next();
}

module.exports.requireLoggedOutUser = (req, res, next) => {
    req.session.userId ? res.redirect("/petition") : next();
}

module.exports.requireNoSignature = (req, res, next) => {
    req.session.hasSigned ? res.redirect("/petition/thanks") : next();
}

module.exports.requireSignature = (req, res, next) => {
    !req.session.hasSigned ? res.redirect("/petition") : next();
}

module.exports.requireFromRegister = (req, res, next) => {
    !req.session.fromRegister ? res.redirect("/petition/thanks") : next();
}