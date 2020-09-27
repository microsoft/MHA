requirejs.config({
    paths: {
        moment: [
            //'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.27.0/moment.min',
            '../../node_modules/moment/min/moment.min'
        ]
    }
});

require(["StandAlone"]);