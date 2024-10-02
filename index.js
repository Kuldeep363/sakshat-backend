const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const os = require('os');

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

function getIP(){

	const interfaces = os.networkInterfaces();
	let localIP;
	
	for (let interfaceName in interfaces) {
	  for (let iface of interfaces[interfaceName]) {
		if (iface.family === 'IPv4' && !iface.internal) {
		  localIP = iface.address;
		  break;
		}
	  }
	  if (localIP) break;
	}
	
	console.log('Local IP Address:', localIP);
	
	}

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
	res.send('Running');
});

io.on("connection", (socket) => {
	console.log("connected: ", socket.id)
	socket.emit("me",socket.id);

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	});

	socket.on("callUser", ({ userToCall, signalData, from, name }) => {
		io.to(userToCall).emit("callUser", { signal: signalData, from, name, to:userToCall  });
	});

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", {signal:data.signal, toName: data.toName})
	});
	socket.on('rejectCall', (data) => {
		console.log("leaving: ", data)
		io.to(data.userToReject).emit('callRejected');
	});
});

server.listen(PORT, () => {

	console.log(`Server is running on port ${PORT}`)
	getIP();
});

