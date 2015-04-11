var filter = require('cloud/lib/filter');
var dictionary = require('cloud/lib/seeds/en');
filter.seed(dictionary);
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
	console.log("start-----------------------------");
    response.success(filter.clean(request.params.comment));
    console.log("end-----------------------------");
});

Parse.Cloud.afterSave("Wallpaper", function(request) {
     var userShare = new Parse.Object("UserShare");
	 userShare.set("user",request.user);
	 userShare.set("wallpaper",request.object);
	 //userShare.set("url",request.object.url());
	 userShare.save();
});

Parse.Cloud.beforeSave("Review", function(request, response) {
     var comment = request.object.get("comment");
     if (comment.length > 140) {
        request.object.set("comment", filter.clean(comment.substring(0, 137)) + "...");
     }else{
		request.object.set("comment", filter.clean(comment)); 
	 }
     response.success();
});

Parse.Cloud.beforeSave("fb_friends", function(request, response) {
     var fbid = request.object.get("fbid");
	 var friendQuery = new Parse.Query("Friend");
	 friendQuery.equalTo("fbid",fbid);
	 friendQuery.equalTo("whose",request.user);
	 
	 var recommendFriendQuery = new Parse.Query("RecommendFriend");
	 recommendFriendQuery.equalTo("fbid",fbid);
	 recommendFriendQuery.equalTo("towho",request.user);
	 
	// Parse.Promise.when([
	//  friendQuery.find(),
	//  recommendFriendQuery.find()
	//])
	friendQuery.count().then(function(results) {
		console.log("results-----------------------------"+results);
		if(results>0){
			  response.error("The user exist");
			  return;
		}
		recommendFriendQuery.count().then(function(results) {
		  /*var ids = [];
		  results.forEach(function(set) {
			set.forEach(function(obj) {
			  ids.push(obj.id);
			});
		  });*/
		  
		  if(results>0){
			  response.error("The user exist");
			  return;
		  }
		 
		 var query = new Parse.Query(Parse.User);
		 query.equalTo("fbid",fbid);
		 //query = query.doesNotMatchKeyInQuery("fbid","fbid",friendQuery);
		 //query.doesNotMatchKeyInQuery("objectId","user",recommendFriendQuery);
		 //query.notContainedIn('objectId', ids);
		 query.first({
			success: function(user) {
				if(user){
				   request.object.set("user",user);
				   var recommend = new Parse.Object("RecommendFriend");
				   recommend.set("user",user);
				   recommend.set("fbid",fbid);
				   recommend.set("towho",request.user);
				   recommend.save();
				   response.success();
				}else{
				   response.error("not facebook user");
				}
			},
			error: function(error) {
				//console.error("Got an error " + error.code + " : " + error.message);
				response.error(error.message);
			}
		 });
		 
		 });
     });
});
