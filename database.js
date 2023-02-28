const { MongoClient, ServerApiVersion } = require('mongodb');

let database = null;

const mongoUsername = "";
const mongoPassword = "";

const dbClientUrl = `mongodb+srv://${mongoUsername}:${mongoPassword}@cluster0.ztyvrkx.mongodb.net/?retryWrites=true&w=majority`;

async function startDatabase() {
    const connection = new MongoClient(dbClientUrl, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    const client = await connection.connect();
    database = client.db('pet_fashionista');
}

async function getDatabase() {
    if (!database) await startDatabase();
    return database;
}

module.exports = {
    getDatabase,
    startDatabase,
};