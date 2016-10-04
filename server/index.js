// Pour l'ordinateur chez Nico
var __dirname = '/Mes documents/workspace-nodejs/dis-ce-que-tu-veux';

//Pour l'ordinateur chez Val
//var __dirname = '';
//Pour l'ordinateur à l'Université
//var __dirname = '';

// Création d'un nouveau serveur avec le module Express
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname));

var rooms = [];
var players = [];
var currentPlayer;

// Le fichier envoyé par le serveur
app.get('/', function (req, res) {
    res.sendFile(__dirname+'/client/index.html');
});

app.get('/host_game', function(req, res){
   res.sendFile(__dirname+'/client/host_game.html');
});

app.get('/join_game', function(req, res){
   res.sendFile(__dirname+'/client/join_game.html');
});

// Instructions lors de la connexion d'un client, on identifie le client avec la socket
io.on('connection', function (socket) {
    // On affiche dans la console
    console.log('L\'utilisateur '+socket.id+' vient de se connecter.');
    
    // On envoie un event message au client qui vient de se connecter
    socket.emit('message', 'Vous êtes bien connecté !');
    
    // Quand un client se déconnecte
    socket.on('disconnect', function () {
        console.log('L\'utilisateur '+socket.id+' vient de se déconnecter.');
    });
    
    // Quand un client nous envoie un event register
    socket.on('register', function (id) {
        // Emet un événement à tous les clients connectés
        //io.emit('message', msg);
        
        // Si il y a un id stocké localement
        if(id != undefined){
            // S'il n'existe pas dans la liste des joueurs connectés du serveur, on l'ajoute
            if (players[id] == undefined) {
                players[id] = new Player();
                console.log('Nouvel utilisateur créé malgré le fait qu\'il y avait un id stocké localement : '+id);
            }
            console.log('Utilisateur reconnu : '+id);
        } else {
            id = Math.random().toString(36).substring(3,16) + +new Date;
            io.emit('register', id);
            players[id] = new Player();
            console.log('Nouvel utilisateur créé : '+id);
        }

        currentPlayer = players[id];
        
    });
    
    socket.on('createRoom', function(roomId){
        rooms.push(roomId);
        socket.emit('createRoom', 'LXVY');
        socket.emit('updateRooms', rooms, socket.room);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

function Player(){
    this.state = 0;
    this.name = '';
    
    this.getName = function(){
        return this.name;
    };
}