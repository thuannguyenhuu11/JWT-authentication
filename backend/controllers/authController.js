import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

let refreshTokens = [];

const authController = {
  //REGISTER
  registerUser: async (req, res) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(req.body.password, salt);

      //Create new user
      const newUser = await new User({
        username: req.body.username,
        email: req.body.email,
        password: hashed,
      });

      //Save user to DB
      const user = await newUser.save();
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //GENERATE NEW ACCESS TOKEN
  generateAccessToken: user => {
    return jwt.sign(
      {
        id: user.id,
        admin: user.admin,
      },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: '20s' }
    );
  },

  //GENERATE NEW REFRESH TOKEN
  generateRefreshToken: user => {
    return jwt.sign(
      {
        id: user.id,
        admin: user.admin,
      },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: '360d' }
    );
  },

  //LOGIN
  loginUser: async (req, res) => {
    try {
      const user = await User.findOne({ username: req.body.username });
      if (!user) {
        res.status(404).json('Wrong username!');
      }

      const validPassword = await bcrypt.compare(req.body.password, user.password);

      if (!validPassword) {
        res.status(404).json('Wrong password!');
      }

      if (user && validPassword) {
        const accessToken = authController.generateAccessToken(user);
        const refreshToken = authController.generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'strict',
        });
        const { password, ...others } = user._doc;
        res.status(200).json({ ...others, accessToken });
      }
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //REDIS
  requestRefreshToke: async (req, res) => {
    //Take refresh token from user
    const refreshToken = req.cookies.refreshToken;
    res.status(200).json(refreshToken);
    if (!refreshToken) return res.status(401).json('You are not authenticated!');
    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).json('Refresh token is not valid!');
    }
    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
      if (err) {
        console.log(err);
      }
      refreshTokens = refreshTokens.filter(token => token !== refreshToken);
      //Create new access Token and refresh Token
      const newAccessToken = authController.generateAccessToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);
      refreshTokens.push(newRefreshToken);
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'strict',
      });

      res.status(200).json({ accessToken: newAccessToken });
    });
  },

  //LOGOUT
  userLogout: async (req, res) => {
    res.clearCookie('refreshToken');

    refreshTokens = refreshTokens.filter(token => token !== req.cookies.refreshToken);
    res.status(200).json('You are logged out!');
  },
};

export default authController;
