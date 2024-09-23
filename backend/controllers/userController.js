import User from '../models/User.js';

const userController = {
  //GET ALL USERS
  getAllUsers: async (req, res) => {
    try {
      const user = await User.find();
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //DELETE USER
  deleteUser: async (req, res) => {
    try {
      //v1/user/123
      const user = await User.findById(req.params.id);
      res.status(200).json('Delete succesfully!');
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

export default userController;
