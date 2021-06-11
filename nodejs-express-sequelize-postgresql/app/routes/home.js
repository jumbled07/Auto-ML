import express from 'express'

var express= require('express')
var router = express.Router();
router.get('/home', function(req,res){
	res.render("home1.html");
})

module.exports = router;