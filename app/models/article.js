var mongoose = require('./db')
var fs = require('fs');
var readline = require('readline');
var request = require('request');
var querystring = require('querystring');

var RevisionSchema = new mongoose.Schema(
		{title		: String, 
		 timestamp	: Date, 
		 user		: String, 
		 anon		: String,
		 usertype	: String
		 }, {
		 	versionKey: false
		 })

/* 
 * 	Overall Articles: Count
 */

// Query to find the top n articles with highest revisions
RevisionSchema.statics.findHighestRevisions = function(noOfArticle, callback){

	return this.aggregate([
		{$group : {_id : {title : "$title"}, count : {$sum : 1}}},
		{$sort 	: {count : -1}},
		{$limit : noOfArticle}
	]).exec(callback)
}

// Query to find the top n articles with lowest revisions
RevisionSchema.statics.findLowestRevisions = function(noOfArticle, callback){
	
	return this.aggregate([
		{$group : {_id : {title : "$title"}, count : {$sum : 1}}},
		{$sort 	: {count : 1}},
		{$limit : noOfArticle}
	]).exec(callback)
}


// Query to find the top n articles edited by the largest group of registered users
RevisionSchema.statics.findEditLargestGroup = function(noOfArticle, callback){

	return this.aggregate([
		{$match	: {usertype : 'registered'}},
		{$group : {_id : {"title" : "$title", "user" : "$user"}, count : {$sum : 1}}},
		{$group : {_id : "$_id.title", titleCount : {$sum : 1}}},
		{$sort 	: {titleCount : -1}},
		{$limit : noOfArticle}
	]).exec(callback)
}


// Query to find the top n articles edited by the smallest group of registered users
RevisionSchema.statics.findEditSmallestGroup = function(noOfArticle, callback) {

	return this.aggregate([
		{$match	: {usertype : 'registered'}},
		{$group : {_id : {"title" : "$title", "user" : "$user"}, count : {$sum : 1}}},
		{$group : {_id : "$_id.title", titleCount : {$sum : 1}}},
		{$sort 	: {titleCount : 1}},
		{$limit : noOfArticle}
	]).exec(callback)
}

// Query to find top n articles with the longest history
RevisionSchema.statics.findLongestHistory = function(noOfArticle, callback) {

	return this.aggregate([
		{$group : {_id : "$title", minTimestamp : {$min : "$timestamp"}}},
		{$sort 	: {minTimestamp : 1}},
		{$limit : noOfArticle}

	]).exec(callback)
}

// Query to find top n articles with the shortest history
RevisionSchema.statics.findShortestHistory = function(noOfArticle, callback) {

	return this.aggregate([
		{$group : {_id : "$title", minTimestamp : {$min : "$timestamp"}}},
		{$sort 	: {minTimestamp : -1}},
		{$limit : noOfArticle}

	]).exec(callback)
}


/* 
 * 	Overall Articles: Charts
 */

RevisionSchema.statics.barChartDistributionYear = function(callback) {
	return this.aggregate([
		{$match: {'timestamp': {$exists:true, $ne: null }}},
	      {$group : {_id : {year:{$substr:["$timestamp",0,4]}},
	    	  registered: {"$sum":{"$cond": [{ "$eq":[ "$usertype", "registered" ]},1,0] }},
	          anonymous: {"$sum":{"$cond": [{ "$eq":[ "$usertype", "anonymous" ]},1,0] }},
	          admin: {"$sum":{"$cond": [{ "$eq":[ "$usertype", "admin" ]},1,0] }},
	          bot: {"$sum":{"$cond": [{ "$eq":[ "$usertype", "bot" ]},1,0] }}}
	       },
	       {$sort:{"_id":1}}
	     ]).exec(callback)
}


RevisionSchema.statics.pieChartDistributionUsertype = function(callback) {
	return this.aggregate([
		{$group : {_id : {usertype : "$usertype"}, count : {$sum : 1}}}
	]).exec(callback)
}

/*
 *	Individual Articles
 */

// Query to return titles of all articles
RevisionSchema.statics.findAllArticles = function(callback){
	return this.aggregate([
		{$match: {'timestamp': {$exists:true, $ne: null }}},
		{$group : {_id : {title : "$title"}, count : {$sum : 1}}}
	]).sort({name : 1}).exec(callback)
}

RevisionSchema.statics.getRevisionNumber = function (Ititle, fromYear, toYear, callback) {
	return this.aggregate([
		{$match: {title: Ititle, timestamp : { $gte: new Date(fromYear + "-1-1"), $lte: new Date(toYear + "-12-31")}}},
		{$group : {_id : {title : "$title"}, count : {$sum : 1}}}
	]).sort({name : 1}).exec(callback)
}

// Query to find the top five users of an article 
RevisionSchema.statics.findTopFiveUsers = function(Ititle, fromYear, toYear, callback) {
	this.aggregate([
		{$match: {title: Ititle, usertype : 'registered', timestamp : { $gte: new Date(fromYear + "-1-1"), $lte: new Date(toYear + "-12-31")}}},
		{$group: {_id: {userid: "$userid", user: "$user"}, userCount : {$sum:1}}},
		{$sort: {userCount:-1}},
		{$limit:5}
	]).exec(callback)
}

RevisionSchema.statics.getMinArticleYears = function(Ititle, callback) {
	this.find({'timestamp': {$exists:true, $ne: null },'title':Ititle})
	.sort({'timestamp':1})
	.limit(1)
	.exec(callback)
}

RevisionSchema.statics.getMaxArticleYears = function(Ititle, callback) {
	this.find({'timestamp': {$exists:true, $ne: null }, 'title':Ititle})
	.sort({'timestamp':-1})
	.limit(1)
	.exec(callback)
}

RevisionSchema.statics.getIndividualPieChartData = function(Ititle, fromYear, toYear, callback) {
	this.aggregate([
		{$match: {title: Ititle, timestamp : { $gte: new Date(fromYear + "-1-1"), $lte: new Date(toYear + "-12-31")}}},
		{$group: {_id: {usertype: "$usertype"}, userCount : {$sum:1}}},
	]).exec(callback)
}

RevisionSchema.statics.individualBarChartDistributionYear = function(Ititle, fromYear, toYear, callback) {
	return this.aggregate([
		{$match: {title: Ititle, timestamp : { $gte: new Date(fromYear + "-1-1"), $lte: new Date(toYear + "-12-31")}}},
	      {$group : {_id : {year:{$substr:["$timestamp",0,4]}},
	    	  registered: {"$sum":{"$cond": [{ "$eq":[ "$usertype", "registered" ]},1,0] }},
	          anonymous: {"$sum":{"$cond": [{ "$eq":[ "$usertype", "anonymous" ]},1,0] }},
	          admin: {"$sum":{"$cond": [{ "$eq":[ "$usertype", "admin" ]},1,0] }},
	          bot: {"$sum":{"$cond": [{ "$eq":[ "$usertype", "bot" ]},1,0] }}}
	       },
	       {$sort:{"_id":1}}
	     ]).exec(callback)
}

RevisionSchema.statics.individualBarChartDistributionYearUser = function(Ititle, Iuser, fromYear, toYear, callback) {
	return this.aggregate([
		{$match: {title: Ititle, user: Iuser, timestamp : { $gte: new Date(fromYear + "-1-1"), $lte: new Date(toYear + "-12-31")}}},
	      {$group : {_id : {year:{$substr:["$timestamp",0,4]}},
	    	  registered: {"$sum":{"$cond": [{ "$eq":[ "$usertype", "registered" ]},1,0] }}
	       }},
	       {$sort:{"_id":1}}
	     ]).exec(callback)
}

RevisionSchema.statics.getLatestRevision = function(Ititle, callback) {
	this.aggregate([
		{$match: {title: Ititle}},
		{$project: {"date":"$timestamp"}},
		{$sort 	: {date : -1}},
		{$limit:1}
	]).exec(callback)
}

/*
 *	Update Article
 */

RevisionSchema.statics.queryWiki = function(title, lastDate, callback) {
	var endpoint = "https://en.wikipedia.org/w/api.php";
	// URL for HTTP GET:
	var url = endpoint + "?"  
		+ "action=query"
		+ "&format=json"
		+ "&prop=revisions"
		+ "&rvlimit=max"
		+ "&rvdir=newer"
		+ "&rvstart=" + querystring.escape(lastDate.toISOString())
		+ "&rvprop=timestamp|user"
		+ "&titles=" + querystring.escape(title);
	console.log("Data pulling request: Sent request to: " + url);
	var options = {
			url: url,
			method: 'GET',
			json: true,
			headers: {
				accept: 'application/json',
				connection : 'keep-alive'}
	}
	
	// Requesting:
	request(options, function(error, res, data) {
		if (error) {
			console.log(error);
		} else if (res.statusCode < 200 || res.statusCode >= 300) {
			console.log("Not successful response: " + res.statusCode);
		} else {
			// Checking data format:						
			// Getting Articles
			var dataPages = data.query.pages;

			var updates = [];		
			for (var i in dataPages) {
				article = dataPages[i].revisions;
				
				for (var j in article) {
					if (article[j].timestamp != lastDate.toISOString()) {
						var new_article = {
							'title' : title,
							'user' : article[j].user,
							'timestamp' : article[j].timestamp
						}
						updates.push(new_article);
					}
				}
				console.log("Updates : " + updates);
				
				console.log("Updated all articles");
				Revision.insertMany(updates, function(error, res) {
					if (error) {
						console.log(error);
					} else {
						//Checking updates:
						callback(null, updates.length);
					}
				})
			}
		}
	})
}

/*
	Author Analytics
*/

// Authors are either admin or bots
RevisionSchema.statics.findAllAuthors = function(callback) {
	return this.aggregate([
		{$match: {usertype : 'admin' || 'bot' }}, 
		{$group: {_id : {userid: "$userid", user : "$user"}}}
	]).exec(callback)
}

// RevisionSchema.statics.getAllAuthors = function(callback) {
// 	return this.aggregate([
// 		{$match: {user: "$user"} && {usertype : 'admin' || 'bot' }},
// 		{$group: {_id : {userid: "$userid", user : "$user"}}}
// 	]).exec(callback)
// }

RevisionSchema.statics.getAuthor = function(author, callback) {
    var types = ["admin", "bot"];
    return this.aggregate([
        {$match: {usertype : {$in: types}}},
		{$group : {_id : { user: author, title : "$title"}, count : {$sum : 1}}}
	]).sort({name : 1}).exec(callback)

}

// Query to return titles of all articles
RevisionSchema.statics.findAllAuthors = function(callback) {
    var types = ["admin", "bot"];
	return this.aggregate([
		{$match: {usertype : {$in: types}}},
		{$group : {_id : {user : "$user"}, count : {$sum : 1}}}
	]).sort({name : 1}).exec(callback)
}

RevisionSchema.statics.findAllAuthorRevisionsOnArticle = function(author, Ititle, callback) {
	return this.aggregate([
		{$match: {user: author, title: Ititle}}
	]).exec(callback)
}

var Revision = mongoose.model('Revision', RevisionSchema, 'articles')

/*
 *	Constructing Usertype with text file
 */
// Reading text:
function addUsertypeFromTxt(model, path, type){
	var userArray = [];
	fs.readFileSync(path).toString().split('\n').forEach(line=>{ userArray.push(line); })
	model.updateMany(
		{ $and: [{ user : {$in : userArray}}, {usertype : {$exists : false}}]},
		{ $set:{"usertype" : type}},
	    function(error){ if(error){ console.error(error)} }
  )
}

// Administrator : "admin"
// Bot : "bot"
addUsertypeFromTxt(Revision, './app/views/frontend/administrators.txt', "admin")
addUsertypeFromTxt(Revision, './app/views/frontend/bots.txt', "bot")

// No user type: Assigned by "anon"
// Registered User : registered
Revision.updateMany(
    { $and:[{usertype:{$exists:false}},{anon:{$exists:false}}] },
    { $set:{"usertype":"registered"}},
    function(error){ 
    	if(error){ 
    		console.error("While updating registered users: " + error)
    	} 
    }
)

// If Anon is true, anonymous
Revision.updateMany(
    {$and : [{usertype : {$exists : false}}, {anon : {$exists : true}}]},
    {$set : {"usertype":"anonymous"}},
    function(error){ 
    	if(error){ 
    		console.error("While updating anonymous users: " + error)
    	} 
    }
)

module.exports = Revision;