var express = require('express');
var http = require('http');
var mysqlWrapper = require("node-mysql-wrapper");
var app = express();
var server = http.createServer(app);
var db = mysqlWrapper.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
console.log('MYSQL IS UP AND RUNNING');
var User = (function () {
    function User() {
    }
    return User;
})();
var Story = (function () {
    function Story() {
    }
    return Story;
})();
var waitForMsg = ("---------------- WAIT 2 SECONDS FOR NEXT TEST-----------------------");
var finishTestsMsg = ("----------------- ALL TESTS HAVE BEEN FINISHED-----------------");
db.ready(function () {
    test1();
    setTimeout(test2, 2000);
});
function test1() {
    console.log("#1-------------- FIND A USER AND HIS/HER STORIES ------------");
    var usersTable = db.table("users");
    var criteria = usersTable.criteria.where("userId").eq(16).joinAs("myStories", "stories", "authorId", "userId").build();
    usersTable.findSingle(criteria).then(function (_result) {
        console.log(_result.username + " 's stories:");
        _result.myStories.forEach(function (story) {
            console.log("Author ID: " + story.authorId + " Title: " + story.title + "\n");
        });
        console.log(waitForMsg);
    });
}
function test2() {
    console.log("#2---------------FIND STORIES AND THEIR AUTHOR -----------------");
    var storiesTable = db.table("stories");
    var storyCriteria = storiesTable.criteria.joinAs("author", "users", "userId", "authorId").at("author").limit(1).build();
    storiesTable.find(storyCriteria).then(function (_results) {
        _results.forEach(function (_result) {
            console.log('Story #' + _result.storyId + ' Title: ' + _result.title + ' Author: #' + _result.author.userId + ' ' + _result.author.username + '\n');
        });
        console.log(finishTestsMsg);
    });
}
server.on('uncaughtException', function (err) {
    console.log(err);
});
process.on("SIGHUP", function () {
    db.end(function (err) {
        if (err) {
            console.dir(err);
            setTimeout(function () {
                process.exit();
            }, 8000);
        }
        else {
            process.exit();
        }
    });
});
var httpPort = 1193;
server.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
