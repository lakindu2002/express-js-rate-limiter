const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { addProductsToCart, login, searchProducts, verifyAndAuthenticateToken } = require('./functions/index');

const app = express();
const port = 3000;

// use the cors middleware for cross origin resource sharing
app.use(cors());

// use the body-parser middleware to parse the request body
app.use(bodyParser.json());

// define the routes
app.post('/login', login)
app.post('/add-to-cart', verifyAndAuthenticateToken, addProductsToCart)
app.post('/search', verifyAndAuthenticateToken, searchProducts)

// start the server
app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
})