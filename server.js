function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}
const cors = require('cors');
const port = process.env.PORT || 3000;
const app = express();
const path = require('path');
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
    cors: {
        origin: '*'
    }
});


app.use(requireHTTPS);

app.use(express.static(__dirname + '/dist/messenger'));
app.get('/*', (req, res) =>
    res.sendFile('index.html', {root: 'dist/messenger/'}),
);



let userList = new Map();

io.on('connection', (socket) => {
    let userName = socket.handshake.query.userName;
    addUser(userName, socket.id);

    socket.broadcast.emit('user-list', [...userList.keys()]);
    socket.emit('user-list', [...userList.keys()]);

    socket.on('message', (msg) => {
        socket.broadcast.emit('message-broadcast', {message: msg, userName: userName});
    })

    socket.on('disconnect', (reason) => {
        removeUser(userName, socket.id);
    })
});

function addUser(userName, id) {
    if (!userList.has(userName)) {
        userList.set(userName, new Set(id));
    } else {
        userList.get(userName).add(id);
    }
}

function removeUser(userName, id) {
    if (userList.has(userName)) {
        let userIds = userList.get(userName);
        if (userIds.size == 0) {
            userList.delete(userName);
        }
    }
}

http.listen(port, () => {
    console.log('Server is running');
});
