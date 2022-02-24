const express = require("express");
const app = express();
const helmet = require("helmet");
const db = require("./database/db");
const cookieSession = require("cookie-session");
const { engine } = require("express-handlebars");
const { requireLoggedInUser, requireLoggedOutUser } = require("./middleware");

// ROUTES
const registerLoginRoutes = require("./routes/register_login_routes");
const petitionThanksRoutes = require("./routes/petition_thanks_routes");
const signersRoutes = require("./routes/signers_routes");
const profileEditRoutes = require("./routes/profile_edit_routes");

app.use(helmet());

app.use(cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
        httpOnly: true
    })
);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));

// ***** HOME *****
app.get("/", requireLoggedOutUser, (req, res) => {
    return res.render("home");
})

// ***** LOGIN and REGISTER ROUTES *****
app.use("/petition", registerLoginRoutes);

// ***** PETITION and THANKS ROUTES *****
app.use("/petition", petitionThanksRoutes);

// ***** SIGNERS ROUTES *****
app.use("/petition/signers", signersRoutes);

// ***** PROFILE and EDIT ROUTES *****
app.use("/petition", profileEditRoutes)

// *****GET for /GOODBYE *****
app.get("/petition/goodbye", requireLoggedInUser, (req, res) => {
    db.deleteSignature(req.session.userId).then(() => {
        db.deleteUserProfile(req.session.userId).then(() => {
            db.deleteUser(req.session.userId).then(() => {
                req.session = null;
                return res.render("deleted");
            })
            .catch(err => console.log("error deleting user", err))
        })
        .catch(err => console.log("error deleting user profile", err))
    })
    .catch(err => console.log("error deleting signature", err))
});

// ***** GET for /LOGOUT *****
app.get("/petition/logout", requireLoggedInUser, (req, res) => {
    req.session = null;
    return res.redirect("/");
});

app.listen(process.env.PORT || 8080, () => console.log("Server listening..."));