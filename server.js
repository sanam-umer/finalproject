const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const app = express();
const path = require('path');
const http = require('http').createServer(app);
function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}
app.use(requireHTTPS);
app.use(express.static('./dist/chatapp'))
const io = require('socket.io')(http, {
    cors: {
        origin: '*'
    }
});
app.get('/*',function(req,res){
    res.sendFile('index.html',{root:'dist/messenger/'});
});
app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin' , 'http://localhost:4200');
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append("Access-Control-Allow-Headers", "Origin, Accept,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.append('Access-Control-Allow-Credentials', true);
    next();
});

mongoose.connect('mongodb+srv://sanam:sanamummer@newcluster.tkbck.mongodb.net/ChatApp?retryWrites=true&w=majority', (err, Database) => {
    if(err) {
        console.log(err);
        return false;
    }
    console.log("Connected to MongoDB");
    const db = Database.db("ChatApp"); 
    users = db.collection("User"); 
    chatRooms = db.collection("Message"); 
    
    });

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

app.get('/', (req, res, next) => {
    res.send('Successfull Backend');
});
app.post('/api/users', (req, res, next) => {
    let user = {
        userName: req.body.userName,
       
    };
    let count = 0;    
    users.find({}).toArray((err, User) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        for(let i = 0; i < Users.length; i++){
            if(User[i].userName == user.userName)
            count++;
        }
        // Add user if not already signed up
        if(count == 0){
            users.insert(user, (err, User) => {
                if(err){
                    res.send(err);
                }
                res.json(User);
            });
        }
        else {
            // Alert message logic here
            res.json({ user_already_signed_up: true });
        }
    });
    
});

app.post('/api/login', (req, res) => {
    let isPresent = false;
    

    users.find({}).toArray((err, users) => {
        if(err) return res.send(err);
        users.forEach((user) => {
            if((user.userName == req.body.userName)) {
                 
                    isPresent = true;
                    }    
                 else {
                    isPresent = true;
                }
            
        });
            res.json({ isPresent: isPresent });
    });
});

app.get('/api/users', (req, res, next) => {
    users.find({}, {userName: 1,  _id: 0}).toArray((err, users) => {
        if(err) {
            res.send(err);
        }
        res.json(users);
    });
});

app.get('/chatroom/:room', (req, res, next) => {
    let room = req.params.room;
    chatRooms.find({name: room}).toArray((err, chatroom) => {
        if(err) {
            console.log(err);
            return false;
        }
        res.json(chatroom[0].messages);
    });
});

http.listen(3000, () => {
    console.log('Server is running');
});
