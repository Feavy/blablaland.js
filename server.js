var express = require('express');
var app = express();
var https = require('http');
var http = https.Server(app);
var bodyParser = require("body-parser");
var session = require('express-session');
var fs = require('fs');
const path = require('path');
var database = fs.readFileSync(path.join(process.resourcesPath, 'blablaland.js', "database.json"));
var ServerBBL = require('./blablaland/blablaland.js');
if (database.length > 2) database = JSON.parse(database);
else database = {};

var port = 80;
var servername = "localhost";

var origine = new ServerBBL(12301);
var legende = new ServerBBL(12302);
var fury = new ServerBBL(12303);
origine.database = database;
legende.database = database;
fury.database = database;

setInterval(function () {
    database = fs.readFileSync(path.join(process.resourcesPath, 'blablaland.js', "database.json"));
    if (database.length > 2) database = JSON.parse(database);
    else database = {};
    origine.database = database;
}, 200);


// app.use(session({ secret: 'FYJG4J1G1JGH1CG1HFC54GH1',}))
app.use(session({
    secret: "HT4TH41F1H61HF1HF1JHF514JY",
    name: "blablaland.js",
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/params.xml', (req, res) => {
    res.send(`<params><scriptadr value="/scripts/"/><socket port="12301" host="${servername}"/></params>`);
});
app.post('/scripts//chat/getBBL.php', (req, res) => {
    var user = getUserBySession(req.session.session);
    if(user) {
        res.send(`BBL=${user.bbl}`);
    }
});
app.get('/connexion', (req, res) => {
    if (req.query.validform == 'OK') {
        for (var id in database) {
            if (database[id].pseudo.toUpperCase() == req.query.con_pseudo.toUpperCase()) {
                if (database[id].password.toUpperCase() == req.query.con_password.toUpperCase()) {
                    req.session.username = database[id].pseudo;
                    req.session.session = database[id].session;
                    return res.redirect('/');
                } else {
                    req.session.message = "Mauvais mot de passe";
                    return res.redirect('/');
                }
            }
        }
        req.session.message = "Identifiant inconnu";
        return res.redirect('/');
    }
});
app.get('/disconnect', (req, res) => {
    if (req.session.username) {
        req.session.username = undefined;
    }
    return res.redirect('/');
});
app.get('/signup', (req, res) => {
    if (req.session.username) {
        return res.redirect('/');
    }
    var file = fs.readFileSync(path.join(process.resourcesPath, 'blablaland.js', "site-web/index.html"), 'utf8');
    var form = fs.readFileSync(path.join(process.resourcesPath, 'blablaland.js', "site-web/form.html"), 'utf8');
    var sign = fs.readFileSync(path.join(process.resourcesPath, 'blablaland.js', "site-web/inscription.html"), 'utf8');
    if (req.query.validform == 'Inscription' && req.query.con_pseudo && req.query.con_password) {
        var loc1 = false;
        if (req.query.con_pseudo.length < 3) {
            req.session.message = "Ce pseudo est trop court.";
            loc1 = true;
        } else if (req.query.con_pseudo.length > 10) {
            req.session.message = "Ce pseudo est trop long.";
            loc1 = true;
        } else if (req.query.con_password.length < 6) {
            req.session.message = "Ce mot de passe est trop court.";
            loc1 = true;
        } else if (req.query.con_password.length > 20) {
            req.session.message = "Ce mot de passe est trop long.";
            loc1 = true;
        } else {
            for (var id in database) {
                if (database[id].pseudo.toUpperCase() == req.query.con_pseudo.toUpperCase()) {
                    req.session.message = "Ce pseudo est déjà pris par un joueur.";
                    loc1 = true;
                }
            }
        }
        if(!loc1) {
            req.session.username = req.query.con_pseudo;
            req.session.session = (Math.floor(Math.random() * 9999999) + 1000000).toString();
            req.session.message = "Bienvenue sur blablaland.js.";
            req.session.uid = Object.keys(database).length + 1;
            database[req.session.uid] = {
                "id":req.session.uid,
                "pseudo": req.query.con_pseudo,
                "password": req.query.con_password,
                "skin": {
                    "color":[0, 0, 88, 44, 44, 58, 0, 0, 0, 0],
                    "id": 7,
                    "posX": 45000,
                    "posY": 420/2,
                    "direction":true
                },
                "map": {
                    "id":9
                },
                "sexe": 0,
                "bbl": 0,
                "xp": 0,
                "chatColor": "0129402a0a20333334",
                "session": req.session.session,
                "time": new Date().getTime(),
                "role": "Membre"
            };
            fs.writeFileSync("database.json", JSON.stringify(database, null, 4), "utf8");
            return res.redirect('/');
        }
        if (req.session.message) {
            file = file.replace("<!-- {{message}} -->", `<message>${req.session.message}</message><br>`);
            req.session.message = undefined;
        }
    }
    file = file.replace("{{form}}", form);
    file = file.replace(`<div id="chat"></div>`, `<message><div style="width: 140px; height: 80px;">${sign}</div></message>`);
    res.send(file);
});
app.get('/', (req, res) => {
    var file = fs.readFileSync(path.join(process.resourcesPath, 'blablaland.js', "site-web/index.html"), 'utf8');
    var form = fs.readFileSync(path.join(process.resourcesPath, 'blablaland.js', "site-web/form.html"), 'utf8');
    if (req.session.username) {
        file = file.replace("{{form}}", `<h1>${req.session.username}</h1><br><a href="/disconnect">Déconnexion</a>`);
        file = file.replace("{{session}}", req.session.session);
    } else {
        file = file.replace("{{form}}", form);
        file = file.replace("{{session}}", `0`);
    }
    if (req.session.message) {
        file = file.replace("<!-- {{message}} -->", `<message>${req.session.message}</message><br>`);
        req.session.message = undefined;
    }
    res.send(file);
});
app.get('/info', (req, res) => {
    var file = fs.readFileSync(path.join(process.resourcesPath, 'blablaland.js', "site-web/info.html"), 'utf8');
    var form = fs.readFileSync(path.join(process.resourcesPath, 'blablaland.js', "site-web/form.html"), 'utf8');
    if (req.session.username) {
        file = file.replace("{{form}}", `<h1>${req.session.username}</h1><br><a href="/disconnect">Déconnexion</a>`);
        file = file.replace("{{session}}", req.session.session);
    } else {
        file = file.replace("{{form}}", form);
        file = file.replace("{{session}}", `0`);
    }
    if (req.session.message) {
        file = file.replace("<!-- {{message}} -->", `<message>${req.session.message}</message><br>`);
        req.session.message = undefined;
    }
    res.send(file);
});

app.use(express.static(path.join(process.resourcesPath, 'blablaland.js', "site-web")));

http.listen(port, function () {
    console.log("Server Web on " + port);
});

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function getUserBySession(sess) {
    for(var i in database) {
        if(database[i].session == sess) return database[i];
    }
    return false;
}