var express = require('express');
var app = express();
var httpServer = require('http').createServer(app);
var path = require('path');
var config = require('config');
var dbConfig = require('./config/database.json')[process.env.NODE_ENV || 'development'];

//EXAMPLES AND TESTS BEGIN
//  START OF INIT CONNECTION EXPLAINATION
/* You have 3 options to attach a connection to the wrapper
 * 
 * 1. If you dont have an already mysql connection object do:
 *  1.1 Use object with host,user,password and database,
 *  1.2 Use a connection string as described later.
 * 
 * 2. If you have an already  mysql connection object, connected or no connected do:
 *  2.1 Just pass this object to the wrapper module.
 * 
 * For '1' and for '2' you have always to start/connect/link the module  with mysqlCon.connect() or .link(), they do the same thing.
 * Second parameter:  true means that this is the only one connection in the whole node js project, global variables MySQLTable, MySQLModel and _W will be available to use without help of mysqlCon variable to use tables and create models.
 * Examples to init the connection and wrapper:
 */

/*1.1 
 * var mysqlCon = require('./../index')({
    host     : '127.0.0.1',
    user     : 'kataras',
    password : 'pass',
    database: 'taglub'
},true);
 *1.2
 * var mysqlCon = require('./../index')("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8",true);
 *2.1
 *  var mysql = require('mysql');
 *  var originalMySqlConnection = mysql.createConnection("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
 *  var mysqlCon = require('./../index')(originalMySqlConnection, true); 
 *   //OR
 * originalMySqlConnection.connect().then(function () {
 *  var mysqlCon = require('./../index')(originalMySqlConnection, true);
 * });
 * 
 * after '1' and '2' do always: mysqlCon.link().then(function () { ... your code here });
*/
//  END OF INIT CONNECTION EXPLAINATION

var mysqlCon = require('./../index')("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8"); // all parameters are default to true, means that this is the only one connection and also use the globals variables (_W,MySQLTable,MySQLModel)



//IF you only want to use only certain tables from your database, and not all of them, do that before the connect:
//mysqlCon.useOnly('users',['comments','comment_likes']); //argument(s) can be array of strings or just string(s).
//END IF

mysqlCon.connect().then(function () { //OR mysqlCon.link().then...  OR _W().connect/link().then....
    
    /* First parameter is the mysql string,object or already defined mysql connection object ( conencted or no connected)
     * Second parameter true or false if this is the only one connection in your project (defaults to true)
     * Third parameter true or false , that you can have directly and global access to MySQLModel, MySQLTable and _W (MySQLWrapper) object. (defaults to true)
     * 
     * instead of calling mysqlCon.table('tablename').model({object or criteria}).
     * All methods bellow do the same thing, returns the user which it's user_id equals to 18.
     * _W stands for 'Wrapper', indicates: the DefaultConnection, MySQLTable & MySQLTable, returns the correct is a matter of how many arguments you pass on. Look how it works:
    */
    /*
     * DefaultConnection use:
     *  var _mysqlCon = _W();
     * _mysqlCon.destroy(); // _W().destroy() , destroy the connection
    //TABLE use:
    var userTable = MySQLTable('users');
    //OR
    var userTable = _W('users'); // _W with one parameter/argument means: return MySQLTable with a name of arguments[0]. //yes without 'new' keyword, it will auto find the correct table.
    
    userTable.model({ userId: 18 }).find().then(function (results) {
        console.log('Found with username: ' + results[0].username);
    });
    
    //userTable.model({username : 'username which exists on 4 rows'})... // you can use this table for create more models or criteria filters for find.
    
    //AND MODEL ONLY use: 
    
    var model = new MySQLModel('users', { userId: 18 });
    //OR
    var model = _W('users', { userId: 18 });// _W with two parameters/arguments means: create and return new MySQLModel from table of arguments[0] and object or criteria of arguments[1].
    
    model.find().then(function (results) {
        console.log('Found with username: ' + results[0].username);
    });
    */
    /*END IF */
    
    //LET'S START...
     /*
        find all users with years_old(column) == 22, find their user_infos where user_infos's user_id column matched with the user_id of the user
        find their comments too, for each one comment find all likes and their likers ( users who liked ) .
        SO EASY, WITH 'ONE LINE' code. ->
    */
    _W("users", 
        {
        yearsOld: 22,
        userInfos: { userId : '=' },
        comments: {
            userId: '=' , 
            commentLikes: {
                commentId : '=', 
                users: { userId : '=' }
            }
        }
    }).find().then(function (_results) {
        [].forEach.call(_results, function (result) {
            console.dir(result);
            console.log("=========COMMENTS from " + result.username + (result.userInfos.length > 0 ?  " which hometown is " + result.userInfos[0].hometown : '') + " ======\n");
            
            [].forEach.call(result.comments, function (comment) {
                console.log(comment.content + " with " + comment.commentLikes.length + " likes!");
                
                if (comment.commentLikes.length > 0)
                    console.log('first like on this comment liked by: ' + comment.commentLikes[0].users[0].username);
            });
            
            console.log("===============\n\n");
        });
        
    });
    
    // DELETE ONE ROW EXAMPLE: 
    var oneUserToDelete = _W('users', { userId: 16 }).safeDelete().then(function (jsRes) {
        if (jsRes.affectedRows > 0) {
            console.log('deleted');
        }
  
    }); //When you want to delete a row using primary key (safe way), you could also use .delete() for this too, it will do the same thing .
    
    //DELETE MAYBE MORE THAN ONE ROW EXAMPLE: 
    var someUsersToDelete = _W('users', { username: 'usernames to delete' }).delete().then(function (jsRes) { //When you want to delete row(s) without using primary key 
        if (jsRes.affectedRows > 0) {
            console.log(jsRes.affectedRows + ' users with username: ' + jsRes.username + ' have gone :(');
        }
    });
    
    
    
    
    // USE THE _W ON ANY OF YOUR OWN JS FILES/MODULES EXAMPLE: 
    var userFactory = require('./modules/user.js');
    userFactory.login("updated18@omakis.com", "a pass").then(function (userFound) {
        console.log("===== USER LOGIN ======");
        console.log('Valid user with ID: ' + userFound.userId + ' and username: ' + userFound.username);
    }, 
    function () {
        console.error('Invalid mail or password!');
    });
    
    
    // CREATE , AND AFTER UPDATE A ROW EXAMPLE: 
    var userModel = _W("users", { username: "an updated x username 1nd time" , mail: "an updated mail for user id x 1st time" });
    //create new user 
    userModel.save().then(function (_newCreatedUser) {
        //update this user
        userModel.save("an updated username for user_id " + userModel.primaryKeyValue + "  or " + _newCreatedUser.userId + " 2nd time", "an updated mail for user id " + userModel.primaryKeyValue + " 2nd time"); //1st parameter  follows the username, the first parameter of our model except the first which is the primary key userId 18, the second parameter follows the third of our model which is the 'mail' property's value.
  
    });
    
    
    
    
    //EXTEND THE MODEL EXAMPLE:
    MySQLModel.extend("mailExists", function (mail, callback) {//this is a shared custom function extends for all models.
        
        //this =  the caller's MySQLModel, for example this =  the new  MySQLModel("users",{}), where this.table.name = "users", look at the next function.
        this.connection.query("SELECT COUNT(*) FROM " + this.table.name + " WHERE mail = " + this.connection.escape(mail), function (err, results) {
            if (!err && results.length > 0 && results[0]["COUNT(*)"] > 0) {
                callback(true);
            } else {
                callback(false);
            }
        });

    });
    
    /*  USE YOUR OWN CUSTOM SHARED-EXTENDED FUNCTION FROM ANY MODEL:   
    new MySQLModel("users", {}).mailExists("mail20_updated@omakis.com", function (trueOrFalse) {
        console.log("User mail exists? " + trueOrFalse);
    });   
      OR: 
    _W("admins", {}).mailExists("mailadmin1@omakis.com", function (trueorfalse) {
        console.log("Admin mail exists? " + trueorfalse);
    });   
  
    */

    // _W.When EXAMPLE:

    var findAllByUsername = _W("users", { username: 'a username' }).find();
    var findAllLikesFromUserId = _W("comment_likes", { userId: 18 }).find();
    var findAllCommentsFromUserId = _W("comments", { userId: 18 }).find();
    
    _W.when(findAllByUsername, findAllLikesFromUserId, findAllCommentsFromUserId).then(function (_results) {
        
        console.log('find all users with USERNAME results: ');
        console.dir(_results[0]);
        console.log('\n find all LIKES by user id 18 results: ');
        console.dir(_results[1]);
        console.log('\n find all COMMENTS by user id 18 results: ');
        console.dir(_results[2]);
        console.log('\n');
    });
    



   
});
//END OF EXAMPLES AND TESTS.

var httpPort = 1193;//config.get('Server.port') || 1193;
httpServer.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
