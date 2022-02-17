// aqui escrevo minhas queries e cada uma sera uma funçao
const spicedPg = require("spiced-pg");

// estabele uma conexao com o database
const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.getAllSignersNames = () => {
    // vai me retornar um grande objeto com varios metadatas
    // entao preciso so da propriedade chamada rows (usar destructuring), que é um array de objetos
    // com as informaçoes de cada row
    return db.query(`SELECT first, last FROM signatures`);
    //     .then(({ rows }) => console.log(rows))
    //     .catch(err => console.log(err));

    // quero exportar so a promise da query, pra que eu possa usar
    // os valores do que for retornado no outro arquivo
}

module.exports.addPerson = (first, last, signature) => {
    // devo adicionar os dados dessa forma pra nao sofrer SQL injection attacks
    // cada dado que sera adicionado é $1, $2... e representa cada dado passado no array respectivamente
    // RETURNING * vai  retornar somente o que eu adicionei
    // posso tambem RETURNING first, last pra retornar somente first e last da row que foi adicionada
    return db.query(`
        INSERT INTO signatures (first, last, signature)
        VALUES ($1, $2, $3)
        RETURNING *
    `, [first, last, signature]);
}

module.exports.countSigners = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
}