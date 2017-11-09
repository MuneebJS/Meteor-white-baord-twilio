FlowRouter.route('/', {
    action: function () {
        BlazeLayout.render('home', { main: 'index' });
    }
});

FlowRouter.route('/class/mobile/:class_id', {
    action: function () {
        BlazeLayout.render('mobile', {
            board: 'board'
        });
    }
});

FlowRouter.route('/class/:class_id', {
    action: function () {
        BlazeLayout.render('student', {
            header: 'header',
            title: "title",
            board: 'board',
            videos: 'videos',
        });
    }
});

FlowRouter.route('/join_class', {
    action: function () {
        BlazeLayout.render('classes_layout', {
            main: 'classes',
            // header: 'header'
        });
    }
});

FlowRouter.route('/inactive_classes', {
    action: function () {
        BlazeLayout.render('classes_layout', {
            main: 'inactive_classes',
            // header: 'header'
        });
    }
});



FlowRouter.route('/teacher/:class_name', {
    action: function () {
        BlazeLayout.render('teacher', {
            header: 'header',
            board: 'board',
            boardTools: 'boardTools',            
            title: "title",
            videos: 'videos',
        });
    }
});

FlowRouter.route('/twilio_student', {
    action: function () {
        BlazeLayout.render('twilio_student');
    }
});
