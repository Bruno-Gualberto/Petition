// here I write my queries and each one should be a function
const spicedPg = require("spiced-pg");

// makes a conection with the database
const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.addUser = (first, last, email, password) => {
    return db.query(`
        INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `, [first, last, email, password]);
}

module.exports.getAllSignersNames = () => {
    return db.query(`SELECT first, last FROM signatures`);
}

module.exports.addPersonSignature = (signature, userId) => {
    return db.query(`
        INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2)
        RETURNING user_id
    `, [signature, userId]);
}

module.exports.countSigners = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
}

module.exports.getSignature = userId => {
    return db.query(`SELECT signature FROM signatures WHERE user_id = ${userId}`);
}

module.exports.getUserHashedPasswordAndId = userEmail => {
    return db.query(`
        SELECT password, id FROM users WHERE email = '${userEmail}'
    `)
}