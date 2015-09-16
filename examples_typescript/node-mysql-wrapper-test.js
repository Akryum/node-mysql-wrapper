/// <reference path="./node_modules/node-mysql-wrapper/compiled/typings/node-mysql-wrapper/node-mysql-wrapper.d.ts" />
var express = require('express');
var app = express();
var server = require('http').createServer(app);
import * as wrapper2 from "node-mysql-wrapper";
var db = wrapper2.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
class User {
    constructor() {
        this.comments = [];
        this.myComments = [];
    }
}
db.ready(() => {
    var usersDb = db.table("users");
    var usersCollection = new wrapper2.ObservableCollection(usersDb);
    usersCollection.onCollectionChanged((eventArgs) => {
        console.log('collection changed');
        switch (eventArgs.action) {
            case wrapper2.CollectionChangedAction.ADD:
                console.log('User(s) added into. New list lengh: ' + eventArgs.newItems.length);
                break;
            case wrapper2.CollectionChangedAction.REMOVE:
                console.log(eventArgs.oldItems.length + " User(s) removed from list.");
                break;
        }
    });
    usersDb.findById(16, (_user) => {
        console.log("TEST1: \n");
        console.log("FOUND USER WITH USERNAME: " + _user.username);
        _user.username = "JUST A NEW username for the user ID 16";
        usersDb.save(_user).then(() => { console.log('user saved from query'); });
    });
});
server.on('uncaughtException', function (err) {
    console.log(err);
});
var httpPort = 1193;
server.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
