var express = require("express"),
    app     = express(),
    path    = require('path'),
    cors    = require('cors'),
    request = require('request'),
    parser  = require('xml2json'),
    delayed = require('delayed'),
    bodyParser = require('body-parser');
 
 
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

var query = "https://www.alphavantage.co/query?";
var f = "function=";
var apikey = "&apikey=LBF7OR5LIIH1RNV2";
var symbol_url = "&symbol=";
var interval = "&interval=daily";
var time_period = "&time_period=10";
var series_type = "&series_type=close";
var outputsize = "&outputsize=full";

app.get("/", function(req, res) {
    if (Object.keys(req.query).length == 0) {
        res.render("index.ejs");
    }
    delayed.delay(function() {
    if (req.query.quote != undefined) {
        var symbol = req.query.quote;
        var url = query + f + "TIME_SERIES_DAILY" + symbol_url + symbol + outputsize + apikey;   
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                res.json(null);
            }
        })
    }
    if (req.query.sma != undefined) {
        var symbol = req.query.sma;
        var url = query + f + "SMA" + symbol_url + symbol + interval + time_period + series_type + apikey;   
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                res.json(null);
            }
        })
    }
    if (req.query.ema != undefined) {
        var symbol = req.query.ema;
        var url = query + f + "EMA" + symbol_url + symbol + interval + time_period + series_type + apikey;   
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                res.json(null);
            }
        })
    }
    if (req.query.stoch != undefined) {
        var symbol = req.query.stoch;
        var url = query + f + "STOCH" + symbol_url + symbol + interval + "&slowkmatype=1&slowdmatype=1" + apikey;   
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                res.json(null);
            }
        })
    }
     if (req.query.rsi != undefined) {
        var symbol = req.query.rsi;
        var url = query + f + "RSI" + symbol_url + symbol + interval + time_period + series_type + apikey;   
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                res.json(null);
            }
        })
    }
    if (req.query.adx != undefined) {
        var symbol = req.query.adx;
        var url = query + f + "ADX" + symbol_url + symbol + interval + time_period + apikey;   
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                res.json(null);
            }
        })
    }
    if (req.query.cci != undefined) {
        var symbol = req.query.cci;
        var url = query + f + "CCI" + symbol_url + symbol + interval + time_period + apikey;   
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                 console.log(error);
                res.json(null);
            }
        })
    }
    if (req.query.bbands != undefined) {
        var symbol = req.query.bbands;
        var url = query + f + "BBANDS" + symbol_url + symbol + interval + "&time_period=5" + series_type + "&nbdevup=3&nbdevdn=3" + apikey;   
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                 console.log(error);
                res.json(null);
            }
        })
    }
    if (req.query.macd != undefined) {
        var symbol = req.query.macd;
        var url = query + f + "MACD" + symbol_url + symbol + interval + time_period + series_type + apikey; 
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                console.log(error);
                res.json(null);
            }
        })
    }
    if (req.query.news != undefined) {
        var symbol = req.query.news;
        var url = "https://seekingalpha.com/api/sa/combined/" + symbol + ".xml"; 
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var options = {
                    object: true,
                    reversible: false,
                    coerce: false,
                    sanitize: true,
                    trim: true,
                    arrayNotation: true,
                    alternateTextNode: false
                };
                res.json(parser.toJson(body, options));
            } else {
                 console.log(error);
                res.json(null);
            }
        })
    }
    if (req.query.fav != undefined) {
        var symbol = req.query.fav;
        var url = query + f + "TIME_SERIES_DAILY" + symbol_url + symbol + outputsize + apikey; 
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                res.json(null);
            }
        })
    }
    if (req.query.search != undefined) {
        var input = req.query.search;
        var url = "http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input=" + input;
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(JSON.parse(body));
            } else {
                res.json(null);
            }
        })
    }
    }, 100);
});

app.post("/", function(req, res) {
    var options = {
    url: 'https://export.highcharts.com/',
    method: 'POST',
    form: req.body };
    request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.send(body);
            } else {
                res.send(null);
            }
    });
})

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("server has started");
});