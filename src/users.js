module.exports = function(){

	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;

	var users = new Schema({
		ip: String,
		dlStatus: String,
        ulStatus: String,
        pingStatus: String
	});

	return mongoose.model('Users', users);
};