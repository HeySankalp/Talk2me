const Server = require('socket.io')

function socketModule(serverApp) {

    const peersData = [];
    const connectedSockets = [];

    const io = Server(serverApp, {
        cors: {
            origin: [
                "https://localhost:3000"
            ],
            methods: ["GET", "POST"]
        },
        pingTimeout: 5000
    });



    io.on("connection", (socket) => {

        const userId = socket.handshake?.auth?.userId;
        connectedSockets.push({
            userId: userId,
            socketId: socket.id
        });
        console.log(connectedSockets);

        socket.on("disconnect", (socket) => {
            console.log("disconnected", socket);
        })

        socket.on('newOffer', (data) => {
            peersData.push({
                offer: data?.offer,
                offererId: data?.userId,
                offerIceCandidates: [],
                answer: null,
                answererId: null,
                answerIceCandidates: []
            });
            socket.broadcast.emit("newOfferAwaiting", peersData.slice(-1)[0]);
        })

        socket.on('answerAdded', (offer) => {
            const isOffererSocket = connectedSockets.find(s => s.userId === offer.offererId)
            if (!isOffererSocket) {
                console.log("Offerer is not available");
                return;
            }

            const offerToUpdate = peersData.find(pd => pd.offererId === offer.offererId);

            if (!offerToUpdate) {
                console.log("Offer has left the call");
                return;
            }
            offerToUpdate.answer = offer.answer;
            offerToUpdate.answererId = offer.answererId;
            socket.to(isOffererSocket.socketId).emit("answerResponse", offerToUpdate);
        });


        socket.on("sendIceCandidateToServer", (candidateData) => {
            const peerSocket = connectedSockets.find(cs => cs.userId == candidateData.candidateUserId);

            if (peersData[0].offererId === peerSocket.userId && candidateData.icecandidate) {      
                peersData[0].offerIceCandidates.push(candidateData.icecandidate);
                console.log("offer ice pushed");
            }

            if (peersData[0].answererId === peerSocket.userId && candidateData.icecandidate) {
                peersData[0].answerIceCandidates.push(candidateData.icecandidate);
                console.log("answer ice pushed");
            }


            if(peersData[0].answer){
                offerSocket = connectedSockets.find((cs)=> cs.userId === peersData[0].offererId);
                answerSocket = connectedSockets.find((cs)=> cs.userId === peersData[0].answererId);
                socket.to(offerSocket.socketId).emit("sendIceCandidateToPeer",peersData[0].answerIceCandidates);
                socket.to(answerSocket.socketId).emit("sendIceCandidateToPeer",peersData[0].offerIceCandidates);
            }
        })

    });


}

module.exports = socketModule;