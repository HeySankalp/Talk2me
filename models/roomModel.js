const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    userId: { type: String, required: true}
});

const RoomSchema = new mongoose.Schema({
    roomName: { type: String, required: true},
    users: [UserSchema] // array of users in this room
});

module.exports = mongoose.model('Room', RoomSchema);