const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { requireLoggedInUser, requireSignature } = require("../middleware");

router.get("/", requireLoggedInUser, requireSignature, (req, res) => {
    db.getAllSignersInfo().then(({ rows }) => {
        console.log("GET request at /petition/signers");
        return res.render("signers", {
            helpers: {
                toLowerCase(text) {
                    return text.toLowerCase();
                },
            },
            signers: rows,
        });
    })
    .catch(err => console.log("error on getting all signers info: ", err));
});

router.get("/:city", requireLoggedInUser, requireSignature, (req, res) => {
    console.log("GET request at /petition/signers/:city");
    const { city } = req.params;
    const cityWithCapitalLetter = city.replace(city.charAt(0), city.charAt(0).toUpperCase());

    db.getCitySigners(city).then(({ rows }) => {
        return res.render("city_signers", {
            city: cityWithCapitalLetter,
            signers: rows,
        });
    });
});

module.exports = router;