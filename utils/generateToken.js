var jwt = require("jsonwebtoken");
exports.generateTokens = (user) => {
  {
    const accessToken = jwt.sign({ user }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }
};
