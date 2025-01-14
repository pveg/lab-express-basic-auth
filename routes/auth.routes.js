const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const mongoose = require('mongoose');
const { isLoggedIn, isLoggedOut } = require('../middleware/route-guard')

router.get('/signup', isLoggedOut, (req, res, next)=>{
    res.render('auth/signup')
});

router.post('/signup', isLoggedOut, (req, res, next)=>{
    const {username, password} = req.body;

    if (!username || !password) {
        res.render('auth/signup', {
          errorMessage: 'All the fields are mandatory. Please try again.',
        });
        return;
      }

    bcrypt
    .genSalt(10)
    .then((salt)=> bcrypt.hash(password, salt))
    .then((hashPass) =>{
        return User.create({ username, password: hashPass });
    })
    .then(() => res.redirect('/login'))
    .catch((err) => {
        if (err instanceof mongoose.Error.ValidationError) {
          console.log(err);
          res.status(500).render('auth/signup', { errorMessage: err.message });
        } else if (err.code === 11000) {
          console.log(err);
          res.status(500).render('auth/signup', {
            errorMessage:
              'Please provide a unique username or email. The one you chose is already taken',
          });
        } else {
          next(err);
        }
})
});

router.get('/login', isLoggedOut ,(req, res, next)=>{
    res.render('auth/login')
})

router.post('/login', isLoggedOut, (req,res,next)=> {
    const {username, password} = req.body;
    console.log(username)

    if (!username || !password) {
        res.render('auth/login', {
          errorMessage: 'All fields are mandatory. Please provide your email and password',
        });
        return;
      }

    User.findOne({username})
    .then((user) =>{
    if (!user) {
        res.render('auth/login', {
          errorMessage: 'Username is incorrect',
        });
        return;
      } else if (bcrypt.compareSync(password, user.password)) {
        req.session.currentUser = user;
        res.render('auth/profile', {user})
      } else {
        res.render('auth/login', {
          errorMessage: 'Incorrect password',
        })
    }
})
        .catch(err => next(err))
})

router.get('/profile', isLoggedIn, (req, res, next) =>
  res.render('auth/profile', { user: req.session.currentUser })
);

router.get('/main/:id', isLoggedIn, (req, res, next)=>{

    const{id} = req.params;

    User.findById(id)
    .then((userData) =>{
    res.render('auth/private', {userData} )
})
    .catch(err => next(err))
})

router.get('/main', isLoggedOut, (req, res, next)=>{
    res.render('auth/forbidden')
})

router.get('/logout', isLoggedIn, (req,res, next)=>{
    req.session.destroy((err) => {
        if (err) next(err);
        res.redirect('/');
    })
})

module.exports = router;