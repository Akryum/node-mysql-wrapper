```js

/// <reference path="definitions/all-definitions.d.ts" />
declare var Deps;
declare var Users: Mongo.Collection<any>;

if (Meteor.isClient) {

  Users = new Mongo.Collection<any>("usersCollection");

  Meteor.subscribe("allUsers");

  Template["usersList"].helpers({
    users: function() {
      return Users.find().fetch().reverse();
    }
    ,
    length: function() {
      return Users.find().count();
    }
  });
}


if (Meteor.isServer) {
  var mysqlWrapper = Meteor["npmRequire"]("node-mysql-wrapper");

  var db: NodeMysqlWrapper.Database = mysqlWrapper.connect("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
  console.log('MYSQL IS READY');

  var usersTable = db.meteorTable("users");
  //var criteria = usersTable.criteria.where("yearsOld", 22).build(); //this is the criteria and you pass it as second parameter in usersTable.meteorCollection, default is ' {} means select *all '
  Users = usersTable.collection("usersCollection");//or "usersCollection",criteria) //Returns the 'mongo' collection, which you can find,count and all that except insert,remove,update (which you do from usersTable)

  console.log(Users.find().count() + " rows found! ");
  Meteor.publish("allUsers", function() {
    return Users.find();
  });

  setTimeout(Meteor["bindEnvironment"](function() {
    //insert something
    console.log('TEST INSERT ( this will update your database and your collection on server and client immediately! )');
    var newUser = { username: 'a new username', password: 'a@pass@forNewUsername', mail: ' new mail for new user', yearsOld: 22 };

    usersTable.insert(newUser);
  }), 10000);


}

```