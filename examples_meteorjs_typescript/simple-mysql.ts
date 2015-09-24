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

  /* The whole Code/collection is synchronized between server-client and database. No need work to do by your own, node-mysql-wrapper does the most of your work!*/
  Template["usersList"].events({
    'submit .new-user': (event) => {
      event.preventDefault();
      var data = event.target;

      var username = data.username.value;
      var mail = data.mail.value;
      var pass = data.pass.value;

      Meteor.call("createUser", username, mail, pass);
      //clean up text fields
      data.username.value = '';
      data.mail.value = '';
      data.pass.value = '';

    },
    'submit .update-user': (event) => {
      event.preventDefault();

      var data = event.target;
      var userid = data.userid.value;
      var username = data.username.value;
      var mail = data.mail.value;
      var pass = data.pass.value;

      Meteor.call("updateUser", userid, username, mail, pass);

    },
    'submit .remove-user': (event) => {
      event.preventDefault();

      Meteor.call("removeUser", event.target.userid.value);
      //clean up text field
      event.target.userid.value = '';
    }
  });

}


if (Meteor.isServer) {
  var mysqlWrapper = Meteor["npmRequire"]("node-mysql-wrapper");

  var db: NodeMysqlWrapper.Database = mysqlWrapper.connect("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
  console.log('MySQL is Up and Running!');

  var usersTable = db.meteorTable("users");
  //var criteria = usersTable.criteria.where("yearsOld", 22).build(); //this is the criteria and you pass it as second parameter in usersTable.meteorCollection, default is ' {} means select *all '
  //var criteria = usersTable.criteria.exclude("password").build(); //or do it on 'like mongo collection at the publish method'
  Users = usersTable.collection("usersCollection");//or "usersCollection",criteria) //Returns the 'mongo' collection, which you can find,count and all that except insert,remove,update (which you do from usersTable)

  console.log(Users.find().count() + " rows found! ");
  Meteor.publish("allUsers", function() {
    //or you can ajust here the except 'password' column from select query.
    return Users.find({}, { fields: { password: 0 } });
  });


  Meteor.methods({
    'createUser': (username, mail, pass) => {

      usersTable.insert({ username: username, mail: mail, password: pass });

    },
    'updateUser': (userid, username, mail, pass) => {
      var obj: any = {};
      obj.userId = parseInt(userid);

      if (username && username !== '') {
        obj.username = username;
      }
      if (pass && pass !== '') {
        obj.password = pass;
      }
      if (mail && mail !== '') {
        obj.mail = mail;
      }

      usersTable.update(obj);

    },
    'removeUser': (userid) => {
      usersTable.remove(userid);
    }
  });
  
  
  //close the mysql connection when closing the shell
  /* process.on("SIGHUP", () => {
     db.end((err) => {
       if (err) {
         console.dir(err);
         setTimeout(() => {
           process.exit();
         }, 8000);
       } else {
         process.exit();
       }
 
     });
   });*/

}