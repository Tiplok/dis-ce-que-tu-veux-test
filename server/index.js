// Pour l'ordinateur chez Nico
//var __dirname = '/Mes documents/workspace-nodejs/dis-ce-que-tu-veux';
//Pour l'ordinateur chez Val
//var __dirname = '';
//Pour l'ordinateur à l'Université
var __dirname = '/home/m2eserv/vasseur/Documents/M2_GLIHM-PLATINE/dis-ce-que-tu-veux';

// Création d'un nouveau serveur avec le module Express
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname));

var MAX_PARTICIPANTS_PER_GAME = 8; // Nombre maximal de participants (hors membres du jury) dans une partie
var rooms = []; // Liste des salons actifs
var players = []; // Liste des joueurs
var currentPlayer; // Joueur courant 

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
                players[id] = new Player(socket);
                console.log('Nouvel utilisateur créé malgré le fait qu\'il y avait un id stocké localement : '+id);
            }
            console.log('Utilisateur reconnu : '+id);
            
        // Pas d'id stocké localement
        } else {
            id = Math.random().toString(36).substring(3,16) + +new Date;
            io.emit('register', id);
            players[id] = new Player(socket);
            console.log('Nouvel utilisateur créé : '+id);
        }

        currentPlayer = players[id];
        
    });
    
    // Demande de création d'un salon
    socket.on('createRoom', function(roomId){
        // Création du salon
        room = new Room(roomId, currentPlayer);
        // Ajout du salon dans la liste des salons actifs
        rooms.push(room);
        socket.emit('createRoom', room);
        //socket.emit('updateRooms', rooms, socket.room);
        socket.broadcast.emit('updateRooms', rooms);
    });
    
    // Suppression d'un salon quand l'hébergeur le quitte
    socket.on('deleteRoom', function(room){
        rooms.splice(rooms.indexOf(room), 1);
    });
    
    // On demande les salons existants en arrivant sur la page pour rejoindre un salon
    socket.on('askRooms', function(){
       socket.emit('updateRooms', rooms); 
    });
    
    // Un joueur veut rejoindre un salon
    socket.on('joinRoom', function(roomCode){
        roomFound = false;
        rooms.forEach(function(room){
           if(room.code == roomCode){
               roomFound = true;
               // On a trouvé le salon auquel le participant voulait entrer
               if(room.addParticipants(currentPlayer)){
                   // On a bien été ajouté au salon
                   socket.emit('joinRoomRes', 'ok', 'Le salon a été rejoint.');
                   socket.broadcast.emit('updatePlayersRoom', room);
               } else {
                   socket.emit('joinRoomRes', 'ko', 'Impossible de rejoindre le salon. Le salon est plein.');
               }
           }
        });
        if(!roomFound){
            socket.emit('joinRoomRes', 'ko', 'Impossible de rejoindre le salon. Il n\'existe plus.');
        }
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

// Classe représentant un joueur
function Player(socket){
    this.state = 0;
    this.name = socket.id;
    
    this.getName = function(){
        return this.name;
    };
}

// Classe représentant un salon de jeu
function Room(id, creator){
    this.id = id;
    this.creator = creator;
    this.code = 'LXVY';
    this.participants = [creator];
    this.jurys = [];
    
    /**
     * Permet l'ajout d'un participant dans le salon
     * Vérfie le nombre de participants, renvoie vrai si le participant a bien été ajouté, faux sinon
     * 
     * @param {Player} participant
     * @returns {Boolean}
     */
    this.addParticipants = function(participant){
      if(this.participants.length < MAX_PARTICIPANTS_PER_GAME){
          this.participants.push(participant);
          return true;
      }  else {
          return false;
      }
    };
}