const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const adminRoutes = require('./role-admin');
const donorRoutes = require('./role-donor');
const volunteerRoutes = require('./role-volunteer');
const receiverRoutes = require('./role-receiver');
const utilRoutes = require('./util');

router.get('/', (req,res)=> res.render('home'));

router.use('/', authRoutes);
router.use('/admin', adminRoutes);
router.use('/donor', donorRoutes);
router.use('/volunteer', volunteerRoutes);
router.use('/receiver', receiverRoutes);
router.use('/', utilRoutes); // /verify/:id, /qr/:id, /pdf/:id

module.exports = router;
