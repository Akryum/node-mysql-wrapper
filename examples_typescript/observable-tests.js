/// <reference path="./node_modules/node-mysql-wrapper/compiled/typings/node-mysql-wrapper/node-mysql-wrapper.d.ts" />
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var wrapper2 = require("node-mysql-wrapper");
var db = wrapper2.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
var User = (function () {
    function User() {
        this.comments = [];
        this.myComments = [];
    }
    return User;
})();
function userChanged(user) {
    return function (propertyArgs) {
        console.log(propertyArgs.propertyName + ' property has changed from user with ID:' + user.userId + " old value: " +
            propertyArgs.oldValue + " to new value: " + user[propertyArgs.propertyName]);
    };
}
db.ready(function () {
    var usersDb = db.table("users");
    //or var usersDb = db.table("users"); if you don't want intel auto complete from your ide/editor
    var usersCollection = usersDb.observe(true);
    usersCollection.onCollectionChanged(function (eventArgs) {
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
    usersDb.findById(16, function (_user) {
        console.log("TEST1: \n");
        console.log("FOUND USER WITH USERNAME: " + _user.username);
        var itemAdded = usersCollection.addItem(_user); //addItem returns the last added item. the inside item is a copy of the _user, no reference. applied.
        itemAdded.onPropertyChanged(userChanged(itemAdded.item));
        /*	itemAdded.onPropertyChanged(propertyArgs=> {
                console.log(propertyArgs.propertyName + ' property has changed from user with ID:' + itemAdded.item.userId + " old value: " + propertyArgs.oldValue + " to new value: " + itemAdded.item[propertyArgs.propertyName]);
            });*/
        _user.username = "JUST A NEW username for the user ID 16";
        //or: {userId:16,username:  "JUST A NEW username for the user ID 16"}
        usersDb.save(_user).then(function () {
            console.log('user saved from query');
            usersDb.remove(_user.userId);
        });
    });
});
server.on('uncaughtException', function (err) {
    console.log(err);
});
var httpPort = 1193; //config.get('Server.port') || 1193;
server.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
