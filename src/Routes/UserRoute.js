const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
	LoginUser,
	CreateUser,
	GetAllUser,
	UploadUsers,
	RemoveUser,
} = require('../Controllers/UserController');
const { VerifyUser, VerifyAdmin } = require('../Middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/register', CreateUser);
router.post('/login', LoginUser);
router.get('/users', VerifyAdmin, GetAllUser);
router.post('/upload', VerifyAdmin, upload.single('file'), UploadUsers);
router.delete('/delete', VerifyAdmin, RemoveUser);

module.exports = router;
