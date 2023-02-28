const { createClient } = require("redis");

const redisClient = createClient({
  // dragonflydb url
  url: "redis://localhost:6379",
});

const getRedisClient = async () => {
  if (redisClient.isOpen) {
    // return existing connection
    return redisClient;
  }
  // open a new connection with dragonflydb
  await redisClient.connect();
  // return connection
  return redisClient;
};

/**
 * function to check if a request is rate limited
 * @param {string} key - unique key to check for rate limiting (can be ip address, username, etc.)
 * @param {number} maxBurst - max burst of requests allowed
 * @param {number} countPerPeriod - number of requests allowed per period
 * @param {number} period - period in seconds
 * @returns {boolean} - true if rate limited, false if not rate limited
 */
const isRateLimited = async ({ key, maxBurst, countPerPeriod, period }) => {
  const redisClient = await getRedisClient();
  const response = await redisClient.sendCommand([
    "CL.THROTTLE",
    key,
    maxBurst,
    countPerPeriod,
    period,
  ]);
  // 1 = rate limited, 0 = not rate limited
  return response[0] === 1;
};

/**
 * middleware to check if a request is rate limited, will be integrated into express routes
 * @param {*} req - request object
 * @param {*} res - response object
 * @param {*} next - next middleware
 * @returns - 429 if rate limited, 400 if invalid route
 */
const isRateLimitedMiddleware = async (req, res, next) => {
  // get route
  const { path } = req.route;
  // get ip address and user from request
  const { ip, user } = req;
  let limited = false;
  // perform rate-limiting per route
  switch (path) {
    case "/login": {
      // rate limit login by ip address
      // 5 requests per 60 seconds for a max burst of 5 for a single ip address
      limited = await isRateLimited({
        key: `login-${ip}`,
        maxBurst: '5',
        countPerPeriod: '5',
        period: '60',
      });
      break;
    }
    case "/search": {
      // rate limit search by username
      // 20 requests per 10 seconds for a max burst of 5 for a single user
      const { username } = user;
      limited = await isRateLimited({
        key: `search-${username}`,
        maxBurst: '5',
        countPerPeriod: '20',
        period: '10',
      });
      break;
    }
    case "/add-to-cart": {
      // rate limit add to cart through a generic key
      // 50 requests per 1 second for a max burst of 50 for all users
      limited = await isRateLimited({
        key: "add-to-cart",
        maxBurst: '50',
        countPerPeriod: '50',
        period: '1',
      });
      break;
    }
    default: {
      // invalid route
      return res.status(400).json({
        message: "Invalid route",
      });
    }
  }
  // return 429 if rate limited
  if (limited) {
    return res.status(429).json({
      message: "Too many requests",
    });
  }
  // continue to next middleware
  next();
};

module.exports = {
  getRedisClient,
  isRateLimited,
  isRateLimitedMiddleware,
};
