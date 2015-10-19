/// <reference path="definitions/all-definitions.d.ts" />
declare var Deps;
declare var Users: Mysql.MeteorMysqlCollection<any> | Mongo.Collection<any>;

if (Meteor.isClient) {

  Users = new Mongo.Collection<any>("usersCollection");

  /*
    Template["usersList"].onRendered(function(){
  	var self = this;
	Template["usersList"]["usersList"] = new ReactiveVar([]);
	var subs  = Meteor.subscribe("allUsers");

    this.autorun(function() {
    if(!self.subscriptionsReady())
      return;
    	Template["usersList"]["usersList"].set(Users.find().fetch().reverse());
  });
  });*/
  

  Template["usersList"].helpers({
   users:function(){
   Tracker.autorun(function(){
    Meteor.subscribe("allUsers");
   
   });
   
    return Users.find().fetch().reverse();
	},
	
	takeMyStories : function(userId){
		return Users.find({userId : userId}).fetch()[0].myStories;
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
      var yearsOld = data.yearsOld.value;

      Meteor.call("createUser", username, mail, pass,yearsOld);
      //clean up text fields
      data.username.value = '';
      data.mail.value = '';
      data.pass.value = '';
      data.yearsOld.value='';

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


  var db: Mysql.Database = Mysql.connect("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
  console.log('MySQL is Up and Running!');
  //var usersTable = db.table("users");
  var criteria = db.criteriaFor("users")
  .where("yearsOld").gt(18)
  .limit(10)
  .except("password")
  .joinAs("myStories","stories","authorId","userId")

  .build();
  Users = db.meteorCollection<any>("users", "usersCollection", criteria); 
  console.log(Users.find().count() + " rows found! ");
  Meteor.publish("allUsers", function() {
    //or you can ajust here the except 'password' column from select query..find({}, { fields: { password: 0 } });
    return Users.find();
  });


  Meteor.methods({
    'createUser': (username, mail, pass,yearsOld) => {
      Users.insert({ username: username, mail: mail, password: pass,yearsOld:yearsOld });
      // usersTable.insert({ username: username, mail: mail, password: pass });

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

      // usersTable.update(obj);
      Users.update(obj);

    },
    'removeUser': (userid) => {
      // usersTable.remove(userid);
      Users.remove(userid);
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