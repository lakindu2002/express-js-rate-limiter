const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database');
const login = async (req, res) => {
  // get request body
  const { username, password } = req.body;

  // retrieve mongo db connection
  const database = await getDatabase();
  // point to users collection
  const users = database.collection('users');

  // find user with specified username and password
  const usersResponse = await users.find({ username, password }).toArray();
  if (usersResponse.length === 0) {
    // no match
    return res.status(401).json({
      message: "Invalid username or password",
    });
  }

  // generate token
  const token = jwt.sign({
    username
  }, 'secretKey', {
    algorithm: 'HS256',
    expiresIn: 3600, // expire token in 3600 seconds
    subject: username,
    issuer: 'PetFashionista'
  });

  // return token
  return res.status(200).json({
    token,
  });
};

const searchProducts = async (req, res) => {
  const { query } = req.body;
  const database = await getDatabase();
  const products = database.collection('products');

  const textSearchIndexOnName = {
    '$text': { '$search': query }
  }

  const productsResp = await products.find(textSearchIndexOnName).toArray();
  return res.status(200).json({
    items: productsResp,
  });
};

const addProductsToCart = async (req, res) => {
  // get user passed from token validator
  const { body, user } = req;
  // get username of logged in user for cart
  const { username } = user;

  // get cart collection
  const database = await getDatabase();
  const carts = database.collection('carts');

  const { products = [] } = body;

  // no products to add to cart
  if (products.length === 0) {
    return res.status(400).json({
      message: "No products to add to cart",
    });
  }

  // create new cart for user with products
  const newCart = {
    username,
    products,
    createdAt: Date.now(),
  }

  // insert new cart
  await carts.insertOne(newCart);

  // return new cart
  return res.status(200).json({
    cart: newCart
  });
};

function verifyAndAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, 'secretKey', (err, user) => {
    if (err) return res.sendStatus(403)

    req.user = user

    next()
  })
}


module.exports = {
  login,
  searchProducts,
  addProductsToCart,
  verifyAndAuthenticateToken
};