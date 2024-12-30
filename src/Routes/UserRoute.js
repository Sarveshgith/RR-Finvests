const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  LoginUser,
  CreateUser,
  GetAllUser,
  UploadUsers,
  RemoveUser,
  UpdateUser,
  GetUserByPan,
} = require('../Controllers/UserController');
const { VerifyUser, VerifyAdmin, VerifyTemp } = require('../Middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/register', CreateUser);
router.post('/login', LoginUser);
router.get('/', VerifyAdmin, GetAllUser);
router.post('/upload', VerifyAdmin, upload.single('file'), UploadUsers);
router.delete('/delete', VerifyAdmin, RemoveUser);
router.put('/update', VerifyAdmin, UpdateUser);
router.get('/user', VerifyUser, GetUserByPan);
router.get('/hl', VerifyUser, (req, res) => {
  res.send('Hello World');
});

module.exports = router;
