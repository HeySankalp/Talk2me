const mongoose = require('mongoose');
const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
})

const Groups = mongoose.model('groups', groupSchema);
module.exports = Groups;