const express=require('express');
const  execute =require('child_process');
const app=express();
const sql = require('mysql');
const bodyParser=require('body-parser');
const passport =require('passport');
const passportLocal=require('passport-local').Strategy;
const session=require('express-session');
const bcrypt=require('bcrypt');
let config={
  "host":'localhost',
  "user":'Dhruva',
  "password":'123456789',
  "database":'epiphany'
};
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());
app.use(bodyParser({extended:true}));
app.use(session({secret:"cat is here"}));     ///it can be anything
app.use(passport.initialize());
app.use(passport.session());
// app.use(passport1.initialize());
// app.use(passport1.session());
let port=process.env.PORT || 5000;
let connection=sql.createConnection(config);
app.listen(port,function(){
  console.log("Server is Running");
  connection.connect();
  console.log("Connected to database");
});
app.post('/login/psych',passport.authenticate('local2'),function(req,res){
  console.log(req.body);
  res.redirect('/index');
});

passport.use('local2',new passportLocal(function(username,password,done){
    console.log("1");
    connection.query(`select* from psychiatrists where userid='${username}'`,function(err,result,fields){
    console.log("2");
    if(result.length){
        console.log("3");
        bcrypt.compare(password,result[0].pwd,function(err,res){
          console.log(res);
          if(res)
            return done(null,{user:false,id:result[0].userid},{message:"logged in succesfully"});
          else
            return done(null,false,{message:"username/password is incorrect"});
        });
      }
    else
      return done(null,false,{message:"username/password is incorrect"});
  });
}));
app.post("/signup/psych",function(req,res){
  console.log("came here");
  var rounds=2;
  bcrypt.hash(req.body.password,rounds,function(err,data){
    let query=`insert into ?? values(?,?,?,?,?)`;
    connection.query(sql.format(query,['psychiatrists',req.body.fname,req.body.lname,req.body.userid,data,req.body.regno]),function(err,data){
      if(err){
        res.render('home.ejs');
        console.log(err);
      }
      else
        res.render('home.ejs');
    });
  });
});
app.post("/signup/user",function(req,res){
  console.log("came here 2");
  var rounds=2;
  bcrypt.hash(req.body.password,rounds,function(err,data){
    let query=`insert into ?? values(?,?,?,?,?)`;
    connection.query(sql.format(query,['users',req.body.fname,req.body.lname,req.body.userid,data,req.body.age]),function(err,data){
      if(err){
        res.render('home.ejs');
        console.log(err);
      }
      else
        res.render('home.ejs');
    });
  });
});
// app.post('/login/user',passport.authenticate('local',{
//   successRedirect:'/user/success',
//   failureRedirect:'/user/failure'
// }));
app.post('/login/user',passport.authenticate('local'),function(req,res){
  console.log(req.body);
  res.redirect('/index');
});
passport.use('local',new passportLocal(function(username,password,done){
    connection.query(`select* from users where userid='${username}'`,function(err,result,fields){
    if(result.length){
        bcrypt.compare(password,result[0].pwd,function(err,res){
          if(res)
            return done(null,{user:true,id:result[0].userid},{message:"logged in succesfully"});
          else
            return done(null,false,{message:"username/password is incorrect"});
        });
      }
    else
      return done(null,false,{message:"username/password is incorrect"});
  });
}));
passport.serializeUser(function(id,done){
  return done(null,id);
});
passport.deserializeUser(function(id,done){
  //WHAT IS RETUNRED FROM HERE IS SET AS REQ.USER IN THE /SUCCESS
  //if(id===userconfig.id)
    var isd={};
    if(id.user){
    connection.query(`select* from users where userid='${id.id}'`,function(err,result,fields){
      if(result.length){
        isd.fname=result[0].fname;
        isd.lname=result[0].lname;
        isd.userid=result[0].userid;
        isd.age=result[0].age;
        return done(null,isd);
      }
    });
  }
    else{
      connection.query(`select* from psychiatrists where userid='${id.id}'`,function(err,result,fields){
        if(result.length){
          isd.fname=result[0].fname;
          isd.lname=result[0].lname;
          isd.userid=result[0].userid;
          isd.regno=result[0].regno;
          return done(null,isd);
        }
    });
    }
} );
app.post('/user/send',function(req,res){
  console.log("hi");
  connection.beginTransaction(function(err){
    if(err) throw err;
    let query='insert into ?? values(?,?,?,?)';
    connection.query(sql.format(query,['mu',0,req.body.source,req.body.dest,req.body.content]),function(err,data){
      if(err){console.log(err);connection.rollback(function(){console.log("error");});}
      else connection.commit(function(err){
          if(err){console.log(err);connection.rollback(function(){console.log("error")});}
          else console.log("sent");
          res.sendStatus(200);
      });
    });
  });
});
app.post('/user/fetch',function(req,res){
  console.log("hi");
  connection.beginTransaction(function(err){
    if(err) {res.sendStatus(404);console.log(err);}
    let query = 'select ??,?? from ?? where ??=? order by ??';
    connection.query(sql.format(query,['source','content','mp','destination',req.body.uid,'source']),function(err,data,fields){
      if(err){console.log(err);connection.rollback(function(){res.sendStatus(404);console.log(err);});}
      else connection.commit(function(err){
        if(err){console.log(err);connection.rollback(function(){res.sendStatus(404);console.log(err);})}
        console.log(data);
        connection.beginTransaction(function(err){
          if(err){res.sendStatus(404);console.log(err);}
          let query='delete from ?? where ??=?';
          connection.query(sql.format(query,['mp','destination',req.body.uid]),function(err,data2,field){
            if(err){console.log(err);connection.rollback(function(){res.sendStatus(404);console.log(err);});}
            else connection.commit(function(err){
              if(err){connection.rollback(function(){console.log(err);console.log(err);});}
              else {res.send(data);}
            });
          });
        });
      });
    });
  });
});
app.post('/psych/send',function(req,res){
  console.log("hi");
  connection.beginTransaction(function(err){
    if(err) console.log(err);
    let query='insert into ?? values(?,?,?,?)';
    connection.query(sql.format(query,['mp',0,req.body.source,req.body.dest,req.body.content]),function(err,data){
      if(err){console.log(err);connection.rollback(function(){console.log(err);});}
      else connection.commit(function(err){
          if(err){console.log(err);connection.rollback(function(){console.log(err);});}
          else console.log("sent");
          res.sendStatus(200);
      });
    });
  });
});
app.post('/psych/fetch',function(req,res){
  console.log("hi");
  connection.beginTransaction(function(err){
    if(err) {res.sendStatus(404);console.log(err);}
    let query = 'select ??,?? from ?? where ??=? order by ??';
    connection.query(sql.format(query,['source','content','mu','destination',req.body.uid,'source']),function(err,data,fields){
      if(err){console.log(err);connection.rollback(function(){res.sendStatus(404);console.log(err);});}
      else connection.commit(function(err){
        if(err){console.log(err);connection.rollback(function(){res.sendStatus(404);console.log(err);})}
        console.log(data);
        connection.beginTransaction(function(err){
          if(err){res.sendStatus(404);console.log(err);}
          let query='delete from ?? where ??=?';
          connection.query(sql.format(query,['mu','destination',req.body.uid]),function(err,data2,field){
            if(err){console.log(err);connection.rollback(function(){res.sendStatus(404);console.log(err);});}
            else connection.commit(function(err){
              if(err){connection.rollback(function(){console.log(err)});}
              else {res.send(data);}
            });
          });
        });
      });
    });
  });
});
app.get('/user/logout',function(req,res){
  req.logout();
  res.render('home.ejs');
});
app.get('/',function(req,res){
  res.render('home.ejs');
})
app.get('/index',function(req,res){
  console.log(req.user);
  res.render('index.ejs',{user:req.user});
})
