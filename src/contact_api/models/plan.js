var mongodb = require('./db');
function Plan(deadline,content,member){
    this.deadline=deadline;
    this.content=content;
    this.member=member;
}
module.exports = Plan;

//存储一条任务计划及其相关信息
Plan.prototype.save = function(callback) {
    var date = new Date();
//存储各种时间格式,方便以后扩展
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth()+1),
        day : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() +
            " " + date.getHours() + ":" + date.getMinutes()
    }
    //要存入数据库的plan
    var plan = {
        deadline: this.deadline,
        content: this.content,
        member:this.member,
        time: time
    };
//打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
//读取 plans 集合
        db.collection('plans', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
//将plan插入 plans 集合
            collection.insert(plan, {
                safe: true
            }, function (err, plan) {
                mongodb.close();
                callback(null);
            });
        });
    });
};

//一次获取15条plan
Plan.getFifteen = function(name, page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 plans 集合
        db.collection('plans', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            //使用 count 返回特定查询的文档数 total
            collection.count(query, function (err, total) {
                //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                collection.find(query, {
                    skip: (page - 1)*15,
                    limit: 15
                }).sort({
                        time: -1
                    }).toArray(function (err, docs) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }

                        callback(null, docs, total);
                    });
            });
        });
    });
};

