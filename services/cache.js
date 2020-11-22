const mongoose = require('mongoose')
const redis = require('redis');
const util = require('util'); //use promisify for cb

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
//overide the get function
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

//arrow function can cause problem with this!
mongoose.Query.prototype.cache = function(options = {}) {
    //this = Query instance
    this.useCache = false;
    this.hashKey = JSON.stringify(options.key || '');

    return this;
}

mongoose.Query.prototype.exec = async function () {
    console.log("Im about to run a query")

    if(!this.useCache){
        return exec.apply(this, arguments)
    }

    //create new object we dont want to modify the query
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
        })
    );

    //cache data in redis
    //we will avoid from cb we will modify it to return a promise
    const cachedValue = await client.hget(this.hashKey, key);
    if(cachedValue){
      console.log('SARVING FORM CACHE');
      const doc = JSON.parse(cachedValue);
      return Array.isArray(doc)
        ? doc.map(d => new this.model(d)) 
        : new this.model(doc);
    }
    
    const result = await exec.apply(this, arguments);

    // console.log('SARVING FORM MONGOS DB');
    client.hset(this.hashKey, key, JSON.stringify(result),'EX', 100, function(err, reply) {
        console.log(err);
    });
    return result;
};

module.exports = {
    clearHash(hashKey){
        client.del(JSON.stringify(hashKey));
    }
};