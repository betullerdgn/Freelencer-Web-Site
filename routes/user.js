exports.signup = function (req, res) {
   message = '';
   if (req.method == "POST") {
      var post = req.body;
      var username = post.username;
      var password = post.password;
      var fname = post.first_name;
      var lname = post.last_name;
      var mobile = post.mobile;
      if (username != '' && password != '') {
         var sql = "INSERT INTO `user_account`(`first_name`,`last_name`,`mobile`,`username`, `password`) VALUES ('" + fname + "','" + lname + "','" + mobile + "','" + username + "','" + password + "')";
         var query = db.query(sql, function (err, result) {
            if (err) {
               console.error(err);
               message = "An error occurred while processing your request.";
               res.render('signup.ejs', { message: message });
            } else {
               message = "Your account has been created succesfully.";
               res.render('signup.ejs', { message: message });
            }
         });
      } else {
         message = "Username and password is mandatory field.";
         res.render('signup.ejs', { message: message });
      }

   } else {
      res.render('signup');
   }
};

exports.login = function (req, res) {
   var message = '';
   var sess = req.session;

   if (req.method == "POST") {
      var post = req.body;
      var username = post.username;
      var password = post.password;

      var sql = "SELECT id, first_name, last_name, username FROM `user_account` WHERE `username`='" + username + "' and password = '" + password + "'";
      db.query(sql, function (err, results) {
         if (results.length) {
            req.session.userId = results[0].id;
            req.session.user = results[0];
            console.log(results[0].id);
            res.redirect('/home/dashboard');
         }
         else {
            message = 'You have entered invalid username or password.';
            res.render('index.ejs', { message: message });
         }

      });
   } else {
      res.render('index.ejs', { message: message });
   }

};


exports.dashboard = function (req, res, next) {


   userId = req.session.userId;
   console.log('id=' + userId);
   if (userId == null) {
      res.redirect("/login");
      return;
   }

   const take_jobs = 'SELECT * FROM hivelance.jobs JOIN hivelance.job_details ON jobs.jobID = job_details.jobID JOIN hivelance.user_account ON user_account.id = jobs.ownerID JOIN hivelance.user_folder ON user_folder.account_id = user_account.id'
   const user_info = 'SELECT * FROM hivelance.user_account where id = ?';


   db.query(take_jobs, (err, result) => {
      if (err);

      db.query(user_info, [userId], (err, result2) => {
         if (err);


         res.render('dashboard.ejs', { data: { jobs: result, user: result2 } });






      });
   });



};

exports.logout = function (req, res) {
   req.session.destroy(function (err) {
      res.redirect("/login");
   })
};

exports.profile = function (req, res) {
   var user = req.session.user
   var userId = req.session.userId;
   if (userId == null) {
      res.redirect("/login");
      return;
   }

   var sql = " SELECT ua.*, up.about_me, up.v_experience, up.github_link, up.twitter_link, up.linkedin_link,ue.education_statues, ue.university_name, ue.school_name,us.job, us.minor,uf.profile_photo, uf.user_cv FROM user_account ua LEFT JOIN user_profile up ON ua.id = up.account_id LEFT JOIN user_education ue ON ua.id = ue.account_id LEFT JOIN user_skills us ON ua.id = us.account_id LEFT JOIN user_folder uf ON ua.id = uf.account_id WHERE ua.id = ?;"
   db.query(sql, [userId], function (err, result) {
      if (err) throw err;
      var base64Data = null;
      if (result[0].profile_photo) {
         const bufferData = Buffer.from(result[0].profile_photo, 'binary');
         base64Data = bufferData.toString('base64');
      }

      res.render('profile.ejs', { data: result, base64Data: base64Data, userId: userId });
   });




};

exports.edit_profile = function (req, res) {
   var user = req.session.user;
   var userId = req.session.userId;
   res.render('edit-profile.ejs');

}


exports.create_jobs = function (req, res) {
   var user = req.session.user
   var userId = req.session.userId;
   var post = req.body;
   var Title = post.Title;
   var Description = post.Description;
   var requirements = post.requirements;
   var last_date = post.last_date;
   var candidate_status = post.candidate_status;
   var contact_info = post.contact_info;

   const jobs = 'INSERT INTO jobs (ownerID, jobTitle) VALUES (?, ?)';

   db.query(jobs, [userId, Title], (err, result) => {
     
      if (err) throw err;
   });
   db.query('SELECT jobID FROM jobs WHERE ownerID = ? AND jobTitle = ?', [userId, Title], (err, result) => {
      if (err) throw err;
      var jobID = result[0].jobID;

      const jobs_details = 'INSERT INTO job_details (jobID, details, candidate, lastDate, candidateStatus, contactInfo) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(jobs_details, [jobID, Description, requirements, last_date, candidate_status, contact_info], (err, result) => {
         if (err) throw err;
      });
   });


   res.redirect("create_job");
};



exports.myjobs_page = function (req, res) {
   const userId = req.session.userId;
   console.log(userId)
   const takeMyJobs = 'SELECT * FROM hivelance.jobs JOIN hivelance.job_details ON jobs.jobID = job_details.jobID WHERE jobs.ownerID = ? LIMIT 0, 1000'
   const take_applications_info = 'SELECT * FROM hivelance.jobs JOIN hivelance.job_details ON jobs.jobID = job_details.jobID JOIN hivelance.applications ON jobs.jobID = applications.jobID JOIN hivelance.user_account ON applications.applicantID = user_account.id WHERE jobs.ownerID = ? LIMIT 0, 1000'
   db.query(takeMyJobs, [userId], (err, result) => {
     
      db.query(take_applications_info, [userId], (err, result2) => {
         if (err) {
            console.log(err);
            return;
         }
        

         res.render("jobs.ejs", { data: { jobs: result, applications_info: result2 } })
      });



   })
};

exports.ApplyTheJob = function (req, res, next) {
   const userId = req.session.userId;
   const jobID = req.body.jobID;
   const applicationDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Geçerli tarih ve saat

   const applyTheJob = 'INSERT INTO applications (jobID, applicantID, applicationDate, applicationStatus) VALUES (?, ?, ?, ?)';

   console.log(userId)
   db.query(applyTheJob, [jobID, userId, applicationDate, 'waiting'], function (err, result) {
      if (err) {
         console.log(err);
         return;
      }

      console.log('Job application successful');
      // ApplyTheJob işlemleri tamamlandıktan sonra exports.dashboard'u çağırma
      exports.dashboard(req, res, next);
   });
};

exports.otherProfile = function(req, res) {
   const ownerID = req.body.ownerID;
  
   console.log(ownerID);
   var sql = "SELECT ua.*, up.about_me, up.v_experience, up.github_link, up.twitter_link, up.linkedin_link, ue.education_statues, ue.university_name, ue.school_name, us.job, us.minor, uf.profile_photo, uf.user_cv FROM user_account ua LEFT JOIN user_profile up ON ua.id = up.account_id LEFT JOIN user_education ue ON ua.id = ue.account_id LEFT JOIN user_skills us ON ua.id = us.account_id LEFT JOIN user_folder uf ON ua.id = uf.account_id WHERE ua.id = ?;";
   db.query(sql, [ownerID], function (err, result) {
      if (err) throw err;
      var base64Data = null;
      if (result.length > 0 && result[0].profile_photo) {
         const bufferData = Buffer.from(result[0].profile_photo, 'binary');
         base64Data = bufferData.toString('base64');
      }

      res.render('otherProfile.ejs', { data: result, base64Data: base64Data, userId: ownerID });
   });
}


exports.acceptJob = function(req,res,next){
   const ID = req.body.ID;
   const acceptJob = "UPDATE hivelance.applications SET applicationStatus = 'accept' WHERE applicationID = ?; "
   db.query(acceptJob,[ID], (err,result)=>{

   })
    exports.myjobs_page(req,res,next)
}

exports.rejectJob = function(req,res,next){
   const ID = req.body.ID;
   const acceptJob = "UPDATE hivelance.applications SET applicationStatus = 'reject' WHERE applicationID = ?; "
   db.query(acceptJob,[ID], (err,result)=>{
      
   })
   exports.myjobs_page(req,res,next)

}

exports.DeletJob = function(req,res,next){
   
   var ID = req.body.ID
   const delet = 'DELETE FROM applications WHERE jobID = ?; DELETE FROM jobsdetails WHERE jobID = ?; DELETE FROM jobs WHERE jobID = ?;';
   
   db.query(delet,[ID,ID,ID],(err,result)=>{

   })
   exports.myjobs_page(req,res,next)
}

exports.UpdateJobPage = function(req,res,next){

}

exports.howitworks= function(req,res,next){
   res.render('howitwork.ejs')
}




