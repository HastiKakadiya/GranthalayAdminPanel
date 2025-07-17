var jwt = require("jsonwebtoken");

jwtcheck = async (req, res, next) => {
  const token = req.header("auth-token");
  console.log("token is ", token);
  if (token) {
    // const string = jwt.verify(token, process.env.AUTH_KEY);
    console.log("string", token);
    req.userId = token;
  }
  next();
};

module.exports = jwtcheck;
