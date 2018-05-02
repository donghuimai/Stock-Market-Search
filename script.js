var app = angular.module('myApp', ['ngAnimate', 'ngMaterial']);
app.controller('stockController', func);

function func($scope, $window, $interval, $http) {
    $scope.querySearch = function(searchText) {
        if (searchText == "") {
            return;
        }
        var items = [];
        return $http
        .get('/?search=' + searchText)
        .then(function(response) {
            var data = response.data;
            var l = Math.min(5, data.length);
            for (var i = 0; i < l; i++) {
                items.push(data[i]);
            }
            return items;
        });
    };

    $(document).ready(function() {
        $scope.shareChart;
        $scope.showFav = true;
        $scope.showDetails = false;
        $scope.showNews = false;
        $scope.showStock = true;
        $scope.showHistorical = false;
        $scope.order = {
            options: ["Ascending", "Descending"],
            selectedOption: "Ascending"
        }
        $scope.sort = {
            options: ["Default", "Symbol", "Price", "Change", "Change Percent", "Volume"],
            selectedOption: "Default"
        }
        $scope.$apply();

        $scope.favStocks = [];
        $scope.favStocksDefault = []
        if (localStorage.length != 0) {
            for (var i = 0; i < localStorage.length; i++) {
                $scope.generateFavRow(localStorage.key(i));
            }
        }
    })

    $scope.generateFavRow = function(favStock) {
        $.get("/?fav=" + favStock).then(function(data) {
            if (data != null || data["Error Message"] == null || Object.keys(data).length != 0) {
                var timeSeries = data["Time Series (Daily)"];
                var dates = Object.keys(timeSeries);
                var lastDay = timeSeries[dates[0]]
                var lastPrice = lastDay['4. close'];
                var volume = lastDay['5. volume'];
                var lastClose = timeSeries[dates[1]]['4. close'];
                var change = lastPrice - lastClose;
                var changePercent = (change / lastClose * 100).toFixed(2) + "%";
                var color;
                var img;
                if (change > 0) {
                    color = "green";
                    img = "http://cs-server.usc.edu:45678/hw/hw8/images/Up.png";
                } else {
                    color = "red";
                    img = "http://cs-server.usc.edu:45678/hw/hw8/images/Down.png";
                }
                change = parseFloat(change).toFixed(2);
                lastPrice = parseFloat(lastPrice).toFixed(2);
                volume = new Intl.NumberFormat().format(volume);
                $scope.favStocksDefault.push({
                    'symbol': favStock,
                    'price': lastPrice,
                    'change': change,
                    'changePercent': changePercent,
                    'volume': volume,
                    'color': color,
                    'img': img
                });
                if ($scope.order.selectedOption == "Ascending") {
                    $scope.favStocks.push({
                        'symbol': favStock,
                        'price': lastPrice,
                        'change': change,
                        'changePercent': changePercent,
                        'volume': volume,
                        'color': color,
                        'img': img
                    });
                } else {
                    $scope.favStocks.unshift({
                        'symbol': favStock,
                        'price': lastPrice,
                        'change': change,
                        'changePercent': changePercent,
                        'volume': volume,
                        'color': color,
                        'img': img
                    });
                }
                var sortBy = $scope.sort.selectedOption;
                if (sortBy == "Symbol") {
                    $scope.favStocks.sort(function(a, b) {
                        if (a.symbol < b.symbol) {
                            return -1;
                        } else if (a.symbol > b.symbol) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                }
                if (sortBy == "Price") {
                    $scope.favStocks.sort(function(a, b) {
                        return parseFloat(a.price) - parseFloat(b.price);
                    });
                }
                if (sortBy == "Change") {
                    $scope.favStocks.sort(function(a, b) {
                        return parseFloat(a.change) - parseFloat(b.change);
                    });
                }
                if (sortBy == "Change Percent") {
                    $scope.favStocks.sort(function(a, b) {
                        return parseFloat(a.changePercent.substring(0, a.changePercent.length)) - parseFloat(b.price.substring(0, a.changePercent.length));
                    });
                }
                if (sortBy == "Volume") {
                    $scope.favStocks.sort(function(a, b) {
                        return parseInt(a.volume) - parseInt(b.volume);
                    });
                }
                if ($scope.order.selectedOption == "Descending") {
                    $scope.favStocks.reverse();
                }

                $scope.$apply();
            }
        })
    }

    $scope.deleteFavStock = function(favStock) {
        localStorage.removeItem(favStock);
        $scope.removeFavRow(favStock);
        if (currSymbol != undefined && currSymbol.innerHTML == favStock) {
            favstar.classList.remove("glyphicon-star");
            favstar.classList.add("glyphicon-star-empty");
            favstar.style.color = "black";
        }
    }

    $scope.removeFavRow = function(favStock) {
        var index = -1;
        for (var i = 0; i < $scope.favStocks.length; i++) {
            if ($scope.favStocks[i].name === favStock) {
                index = i;
                break;
            }
        }
        $scope.favStocks.splice(index, 1);
    }

    $('#searchForm').submit(function(e) {
        e.preventDefault();
        $scope.generateStockDetails($scope.symbol);
    });

    $scope.generateStockDetails = function(symbol) {
        $scope.showFav = false;
        $scope.showDetails = true;
        $scope.displayProgressBar();
        fbbtn.disabled = true;
        favbtn.disabled = true;
        $scope.quoteFinished = false;
        $scope.smaFinished = false;
        $scope.emaFinished = false;
        $scope.stochFinished = false;
        $scope.rsiFinished = false;
        $scope.adxFinished = false;
        $scope.cciFinished = false;
        $scope.bbandsFinished = false;
        $scope.macdFinished = false;
        getquotebtn.disabled = true;
        toDetails.disabled = false;

        if (localStorage.getItem(symbol) == "fav") {
            favstar.classList.remove("glyphicon-star-empty");
            favstar.classList.add("glyphicon-star");
            favstar.style.color = "yellow";
        } else {
            favstar.classList.remove("glyphicon-star");
            favstar.classList.add("glyphicon-star-empty");
            favstar.style.color = "black";
        }
        $.get("/?quote=" + symbol).then(function(data) {
            if (data == null || data['Error Message'] != null || Object.keys(data).length == 0) {
                $scope.errStockTable();
                $scope.errPriceChart();
                $scope.errHistoricalChart();
            } else {
                $scope.stockTable(data, symbol);
                favbtn.disabled = false;
                $scope.extractDate(data);
                $scope.handleQuote(data, symbol);
                $scope.quoteFinished = true;
                if (priceTab.classList.contains("active")) {
                    fbbtn.disabled = false;
                }
                $scope.handleHistorical(data, symbol);
            }
        })
        $.get("/?sma=" + symbol).then(function(data) {
            if (data == null || data['Error Message'] != null || Object.keys(data).length == 0) {
                $scope.errSmaChart();
            } else {
                $scope.extractDate(data);
                $scope.sma = $scope.handleOneLine(data, "sma", symbol);
                $scope.smaFinished = true;
                if (smaTab.classList.contains("active")) {
                    fbbtn.disabled = false;
                }
            }
        })
        $.get("/?ema=" + symbol).then(function(data) {
            if (data['Error Message'] != null || Object.keys(data).length == 0) {
                $scope.errEmaChart();
            } else {
                $scope.extractDate(data);
                $scope.ema = $scope.handleOneLine(data, "ema", symbol);
                $scope.emaFinished = true;
                if (emaTab.classList.contains("active")) {
                    fbbtn.disabled = false;
                }
            }
        })
        $.get("/?stoch=" + symbol).then(function(data) {
            if (data == null || data['Error Message'] != null || Object.keys(data).length == 0) {
                $scope.errStochChart();
            } else {
                $scope.extractDate(data);
                $scope.handleStoch(data, symbol);
                $scope.stochFinished = true;
                if (stochTab.classList.contains("active")) {
                    fbbtn.disabled = false;
                }
            }
        })
        $.get("/?rsi=" + symbol).then(function(data) {
            if (data == null || data['Error Message'] != null || Object.keys(data).length == 0) {
                $scope.errRsiChart();
            } else {
                $scope.extractDate(data);
                $scope.rsi = $scope.handleOneLine(data, "rsi", symbol);
                $scope.rsiFinished = true;
                if (rsiTab.classList.contains("active")) {
                    fbbtn.disabled = false;
                }
            }
        })
        $.get("/?adx=" + symbol).then(function(data) {
            if (data == null || data['Error Message'] != null || Object.keys(data).length == 0) {
                $scope.errAdxChart();
            } else {
                $scope.extractDate(data);
                $scope.adx = $scope.handleOneLine(data, "adx", symbol);
                $scope.adxFinished = true;
                if (adxTab.classList.contains("active")) {
                    fbbtn.disabled = false;
                }
            }
        })
        $.get("/?cci=" + symbol).then(function(data) {
            if (data == null || data['Error Message'] != null || Object.keys(data).length == 0) {
                $scope.errCciChart();
            } else {
                $scope.extractDate(data);
                $scope.cci = $scope.handleOneLine(data, "cci", symbol);
                $scope.cciFinished = true;
                if (cciTab.classList.contains("active")) {
                    fbbtn.disabled = false;
                }
            }
        })
        $.get("/?bbands=" + symbol).then(function(data) {
            if (data == null || data['Error Message'] != null || Object.keys(data).length == 0) {
                $scope.errBbandsChart();
            } else {
                $scope.extractDate(data);
                $scope.handleBbands(data, symbol);
                $scope.bbandsFinished = true;
                if (bbandsTab.classList.contains("active")) {
                    fbbtn.disabled = false;
                }
            }
        })
        $.get("/?macd=" + symbol).then(function(data) {
            if (data == null || data['Error Message'] != null || Object.keys(data).length == 0) {
                $scope.errMacdChart();
            } else {
                $scope.extractDate(data);
                $scope.handleMacd(data, symbol);
                $scope.macdFinished = true;
                if (macdTab.classList.contains("active")) {
                    fbbtn.disabled = false;
                }
            }
        })
        $.get("/?news=" + symbol).then(function(data) {
            if (data == null || data == "") {
                $scope.errNewsFeed();
            } else {
                $scope.handleNews(data);

            }
        })
    }

    $scope.validateForm = function() {
        $scope.symbol = symbol.value.trim().toUpperCase();
        if ($scope.symbol == "") {
            inputBox.className = "col col-md-6 has-error";
            symbol.style.border = "2px solid red";
            errorMessage.style.display = "block";
        } else {
            inputBox.className = "col col-md-6";
            symbol.style.border = "";
            getquotebtn.disabled = false;
            errorMessage.style.display = "none";
        }
    }

    $scope.clearData = function() {
        symbol.value = "";
        $scope.showFav = true;
        $scope.showDetails = false;
        quote.innerHTML = "";
        sma.innerHTML = "";
        ema.innerHTML = "";
        rsi.innerHTML = "";
        adx.innerHTML = "";
        bbands.innerHTML = "";
        cci.innerHTML = "";
        macd.innerHTML = "";
        stoch.innerHTML = "";
        dataTable.innerHTML = "";
        historicalCharts.innerHTML = "";
        newsFeed.innerHTML = "";
        toDetails.disabled = true;
        favbtn.disabled = true;
        fbbtn.disabled = true;
        getquotebtn.disabled = true;
        favstar.classList.remove("glyphicon-star");
        favstar.classList.add("glyphicon-star-empty");
        favstar.style.color = "black";
    }

    $scope.displayProgressBar = function() {
        dataTable.innerHTML = "";
        quote.innerHTML = "";
        historicalCharts.innerHTML = "";
        newsFeed.innerHTML = "";
        sma.innerHTML = "";
        ema.innerHTML = "";
        stoch.innerHTML = "";
        rsi.innerHTML = "";
        adx.innerHTML = "";
        cci.innerHTML = "";
        bbands.innerHTML = "";
        macd.innerHTML = "";
        var bars = []
        for (var i = 0; i < 12; i++) {
            var progressBar = document.createElement('div');
            progressBar.style = "width: 96%; margin: 50px auto";
            progressBar.className = "progress";
            progressBar.innerHTML = '<div class="progress-bar progress-bar-striped progress-bar-animated active" role="progressbar"' +
                'style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" margin: 0 auto></div>';
            bars.push(progressBar);
        }
        bars[0].style = "width: 96%; margin: 98px auto";
        dataTable.appendChild(bars[0]);
        quote.appendChild(bars[1]);
        historicalCharts.appendChild(bars[2]);
        newsFeed.appendChild(bars[3]);
        sma.appendChild(bars[4]);
        ema.appendChild(bars[5]);
        stoch.appendChild(bars[6]);
        rsi.appendChild(bars[7]);
        adx.appendChild(bars[8]);
        cci.appendChild(bars[9]);
        bbands.appendChild(bars[10]);
        macd.appendChild(bars[11]);
    }

    $scope.toSma = function() {
        quote.style.display = "none";
        sma.style.display = "block";
        ema.style.display = "none";
        cci.style.display = "none";
        adx.style.display = "none";
        stoch.style.display = "none";
        rsi.style.display = "none";
        bbands.style.display = "none";
        macd.style.display = "none";
        priceTab.classList.remove("active");
        smaTab.classList.add("active");
        emaTab.classList.remove("active");
        cciTab.classList.remove("active");
        adxTab.classList.remove("active");
        rsiTab.classList.remove("active");
        stochTab.classList.remove("active");
        bbandsTab.classList.remove("active");
        macdTab.classList.remove("active");
        if ($scope.smaFinished) {
            fbbtn.disabled = false;
        } else {
            fbbtn.disabled = true;
        }
        $scope.shareChart = $scope.sma;
    }

    $scope.toEma = function() {
        quote.style.display = "none";
        ema.style.display = "block";
        sma.style.display = "none";
        cci.style.display = "none";
        adx.style.display = "none";
        stoch.style.display = "none";
        rsi.style.display = "none";
        bbands.style.display = "none";
        macd.style.display = "none";
        priceTab.classList.remove("active");
        smaTab.classList.remove("active");
        emaTab.classList.add("active");
        cciTab.classList.remove("active");
        adxTab.classList.remove("active");
        rsiTab.classList.remove("active");
        stochTab.classList.remove("active");
        bbandsTab.classList.remove("active");
        macdTab.classList.remove("active");
        if ($scope.emaFinished) {
            fbbtn.disabled = false;
        } else {
            fbbtn.disabled = true;
        }
        $scope.shareChart = $scope.ema;
    }

    $scope.toQuote = function() {
        quote.style.display = "block";
        sma.style.display = "none";
        ema.style.display = "none";
        cci.style.display = "none";
        adx.style.display = "none";
        stoch.style.display = "none";
        rsi.style.display = "none";
        bbands.style.display = "none";
        macd.style.display = "none";
        priceTab.classList.add("active");
        smaTab.classList.remove("active");
        emaTab.classList.remove("active");
        cciTab.classList.remove("active");
        adxTab.classList.remove("active");
        rsiTab.classList.remove("active");
        stochTab.classList.remove("active");
        bbandsTab.classList.remove("active");
        macdTab.classList.remove("active");
        if ($scope.quoteFinished) {
            fbbtn.disabled = false;
        } else {
            fbbtn.disabled = true;
        }
        $scope.shareChart = $scope.price;
    }

    $scope.toCci = function() {
        quote.style.display = "none";
        sma.style.display = "none";
        ema.style.display = "none";
        cci.style.display = "block";
        adx.style.display = "none";
        stoch.style.display = "none";
        rsi.style.display = "none";
        bbands.style.display = "none";
        macd.style.display = "none";
        priceTab.classList.remove("active");
        smaTab.classList.remove("active");
        emaTab.classList.remove("active");
        cciTab.classList.add("active");
        adxTab.classList.remove("active");
        rsiTab.classList.remove("active");
        stochTab.classList.remove("active");
        bbandsTab.classList.remove("active");
        macdTab.classList.remove("active");
        if ($scope.cciFinished) {
            fbbtn.disabled = false;
        } else {
            fbbtn.disabled = true;
        }
        $scope.shareChart = $scope.cci;
    }

    $scope.toAdx = function() {
        quote.style.display = "none";
        sma.style.display = "none";
        ema.style.display = "none";
        cci.style.display = "none";
        adx.style.display = "block";
        stoch.style.display = "none";
        rsi.style.display = "none";
        bbands.style.display = "none";
        macd.style.display = "none";
        priceTab.classList.remove("active");
        smaTab.classList.remove("active");
        emaTab.classList.remove("active");
        cciTab.classList.remove("active");
        adxTab.classList.add("active");
        rsiTab.classList.remove("active");
        stochTab.classList.remove("active");
        bbandsTab.classList.remove("active");
        macdTab.classList.remove("active");
        if ($scope.adxFinished) {
            fbbtn.disabled = false;
        } else {
            fbbtn.disabled = true;
        }
        $scope.shareChart = $scope.adx;
    }


    $scope.toStoch = function() {
        quote.style.display = "none";
        sma.style.display = "none";
        ema.style.display = "none";
        cci.style.display = "none";
        adx.style.display = "none";
        stoch.style.display = "block";
        rsi.style.display = "none";
        bbands.style.display = "none";
        macd.style.display = "none";
        priceTab.classList.remove("active");
        smaTab.classList.remove("active");
        emaTab.classList.remove("active");
        cciTab.classList.remove("active");
        adxTab.classList.remove("active");
        rsiTab.classList.remove("active");
        stochTab.classList.add("active");
        bbandsTab.classList.remove("active");
        macdTab.classList.remove("active");
        if ($scope.stochFinished) {
            fbbtn.disabled = false;
        } else {
            fbbtn.disabled = true;
        }
        $scope.shareChart = $scope.stoch;
    }

    $scope.toBbands = function() {
        quote.style.display = "none";
        sma.style.display = "none";
        ema.style.display = "none";
        cci.style.display = "none";
        adx.style.display = "none";
        stoch.style.display = "none";
        rsi.style.display = "none";
        bbands.style.display = "block";
        macd.style.display = "none";
        priceTab.classList.remove("active");
        smaTab.classList.remove("active");
        emaTab.classList.remove("active");
        cciTab.classList.remove("active");
        adxTab.classList.remove("active");
        rsiTab.classList.remove("active");
        stochTab.classList.remove("active");
        bbandsTab.classList.add("active");
        macdTab.classList.remove("active");
        if ($scope.bbandsFinished) {
            fbbtn.disabled = false;
        } else {
            fbbtn.disabled = true;
        }
        $scope.shareChart = $scope.bbands;
    }

    $scope.toRsi = function() {
        quote.style.display = "none";
        sma.style.display = "none";
        ema.style.display = "none";
        cci.style.display = "none";
        adx.style.display = "none";
        stoch.style.display = "none";
        rsi.style.display = "block";
        bbands.style.display = "none";
        macd.style.display = "none";
        priceTab.classList.remove("active");
        smaTab.classList.remove("active");
        emaTab.classList.remove("active");
        cciTab.classList.remove("active");
        adxTab.classList.remove("active");
        rsiTab.classList.add("active");
        stochTab.classList.remove("active");
        bbandsTab.classList.remove("active");
        macdTab.classList.remove("active");
        if ($scope.rsiFinished) {
            fbbtn.disabled = false;
        } else {
            fbbtn.disabled = true;
        }
        $scope.shareChart = $scope.rsi;
    }

    $scope.toMacd = function() {
        quote.style.display = "none";
        sma.style.display = "none";
        ema.style.display = "none";
        cci.style.display = "none";
        adx.style.display = "none";
        stoch.style.display = "none";
        rsi.style.display = "none";
        bbands.style.display = "none";
        macd.style.display = "block";
        priceTab.classList.remove("active");
        smaTab.classList.remove("active");
        emaTab.classList.remove("active");
        cciTab.classList.remove("active");
        adxTab.classList.remove("active");
        rsiTab.classList.remove("active");
        stochTab.classList.remove("active");
        bbandsTab.classList.remove("active");
        macdTab.classList.add("active");
        if ($scope.macdFinished) {
            fbbtn.disabled = false;
        } else {
            fbbtn.disabled = true;
        }
        $scope.shareChart = $scope.macd;
    }

    $scope.toFavoriteList = function() {
        $scope.showFav = true;
        $scope.showDetails = false;
    }

    $scope.toDetails = function() {
        $scope.showDetails = true;
        $scope.showFav = false;
    }

    $scope.errNewsFeed = function() {
        newsFeed.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "5%";
        alert.innerHTML = "Error! Failed to get news feed data.";
        newsFeed.appendChild(alert);
    }

    $scope.errPriceChart = function() {
        quote.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "12%";
        alert.innerHTML = "Error! Failed to get price data.";
        quote.appendChild(alert);
    }

    $scope.errSmaChart = function() {
        sma.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "12%";
        alert.innerHTML = "Error! Failed to get sma data.";
        sma.appendChild(alert);
    }

    $scope.errEmaChart = function() {
        ema.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "12%";
        alert.innerHTML = "Error! Failed to get ema data.";
        ema.appendChild(alert);
    }

    $scope.errStochChart = function() {
        stoch.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "12%";
        alert.innerHTML = "Error! Failed to get stoch data.";
        stoch.appendChild(alert);
    }

    $scope.errCciChart = function() {
        cci.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "12%";
        alert.innerHTML = "Error! Failed to get cci data.";
        cci.appendChild(alert);
    }

    $scope.errAdxChart = function() {
        adx.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "12%";
        alert.innerHTML = "Error! Failed to get adx data.";
        adx.appendChild(alert);
    }

    $scope.errRsiChart = function() {
        rsi.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "12%";
        alert.innerHTML = "Error! Failed to get rsi data.";
        rsi.appendChild(alert);
    }

    $scope.errBbandsChart = function() {
        bbands.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "12%";
        alert.innerHTML = "Error! Failed to get bbands data.";
        bbands.appendChild(alert);
    }

    $scope.errMacdChart = function() {
        macd.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.style.marginTop = "12%";
        alert.innerHTML = "Error! Failed to get macd data.";
        macd.appendChild(alert);
    }

    $scope.errStockTable = function() {
        dataTable.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.innerHTML = "Error! Failed to get current stock data."
        alert.style.marginTop = "21%";
        dataTable.appendChild(alert);
    }

    $scope.errHistoricalChart = function() {
        historicalCharts.innerHTML = "";
        var alert = document.createElement('div');
        alert.className = "alert alert-danger";
        alert.role = "alert";
        alert.innerHTML = "Error! Failed to get historical charts data."
        alert.style.marginTop = "5%";
        historicalCharts.appendChild(alert);
    }

    $scope.showCurrStock = function() {
        $scope.showStock = true;
        $scope.showNews = false;
        $scope.showHistorical = false;
        historicalBtn.className = "";
        newsBtn.className = "";
        currStockBtn.className = "active";
    }

    $scope.showHistoricalCharts = function() {
        $scope.showStock = false;
        $scope.showNews = false;
        $scope.showHistorical = true;
        historicalBtn.className = "active";
        newsBtn.className = "";
        currStockBtn.className = "";
    }

    $scope.showNewsFeed = function() {
        $scope.showStock = false;
        $scope.showNews = true;
        $scope.showHistorical = false;
        historicalBtn.className = "";
        newsBtn.className = "active";
        currStockBtn.className = "";
    }

    $scope.stockTable = function(jsonObj, symbol) {
        dataTable.innerHTML = "";
        var table = document.createElement('table');
        table.className = "table table-striped table-responsive";
        var timestamp = jsonObj['Meta Data']['3. Last Refreshed'];
        var closeToday = false;
        if (timestamp.length == 10) {
            timestamp += " 16:00:00";
            closeToday = true;
        }
        timestamp = moment.tz(timestamp, 'America/New_York');
        var timeSeries = jsonObj["Time Series (Daily)"];
        var dates = Object.keys(timeSeries);
        var lastDay = timeSeries[dates[0]]
        var lastPrice = lastDay['4. close']; // check api during business hour to see if there is a lastPrice
        var open = lastDay['1. open'];
        var volume = lastDay['5. volume'];
        var low = lastDay['3. low'];
        var high = lastDay['2. high'];
        var close;
        if (closeToday) {
            close = lastDay['4. close'];
        } else {
            close = timeSeries[dates[1]]['4. close'];
        }
        var lastClose = timeSeries[dates[1]]['4. close'];
        var change = lastPrice - lastClose;
        var changePercent = " (" + (change / lastClose * 100).toFixed(2) + "%" + ")";
        if (change > 0) {
            change = '<span style="color: green">' + parseFloat(change).toFixed(2) + changePercent + '<img src="http://cs-server.usc.edu:45678/hw/hw8/images/Up.png" width="15px">' +
                '</span>';
        } else {
            change = '<span style="color: red">' + parseFloat(change).toFixed(2) + changePercent + '<img src="http://cs-server.usc.edu:45678/hw/hw8/images/Down.png" width="15px">' +
                '</span>';
        }

        table.innerHTML =
            "<tr valign='middle'><th height='60'>Stock Ticker Symbol</th><td height='60' id='currSymbol'>" + symbol.toUpperCase() + "</td></tr>" +
            "<tr valign='middle'><th height='60'>Last Price</th><td height='60'>" + parseFloat(lastPrice).toFixed(2) + "</td></tr>" +
            "<tr valign='middle'><th height='60'>Change (Change Percent)</th><td height='60'>" + change + "</td></tr>" +
            "<tr valign='middle'><th height='60'>TimeStamp</th><td height='60'>" + timestamp.format('YYYY-MM-DD hh:mm:ss z') + "</td></tr>" +
            "<tr valign='middle'><th height='60'>Open</th><td height='60'>" + parseFloat(open).toFixed(2) + "</td></tr>" +
            "<tr valign='middle'><th height='60'>Close</th><td height='60'>" + parseFloat(close).toFixed(2) + "</td></tr>" +
            "<tr valign='middle'><th height='60'>Day's Range</th><td height='60'>" + parseFloat(low).toFixed(2) + "-" + parseFloat(high).toFixed(2) + "</td></tr>" +
            "<tr valign='middle'><th height='60'>Volume</th><td height='60'>" + new Intl.NumberFormat().format(volume) + "</td></tr>";
        dataTable.appendChild(table);
    }

    $scope.extractDate = function(jsonObj) {
        $scope.dateSeries = [];
        if (jsonObj["Time Series (Daily)"] != undefined) {
            var timeSeries = jsonObj["Time Series (Daily)"];
        } else if (jsonObj["Technical Analysis: MACD"] != undefined) {
            var timeSeries = jsonObj["Technical Analysis: MACD"];
        } else if (jsonObj["Technical Analysis: STOCH"] != undefined) {
            var timeSeries = jsonObj["Technical Analysis: STOCH"];
        } else if (jsonObj["Technical Analysis: SMA"] != undefined) {
            var timeSeries = jsonObj["Technical Analysis: SMA"];
        } else if (jsonObj["Technical Analysis: EMA"] != undefined) {
            var timeSeries = jsonObj["Technical Analysis: EMA"];
        } else if (jsonObj["Technical Analysis: RSI"] != undefined) {
            var timeSeries = jsonObj["Technical Analysis: RSI"];
        } else if (jsonObj["Technical Analysis: BBANDS"] != undefined) {
            var timeSeries = jsonObj["Technical Analysis: BBANDS"];
        } else if (jsonObj["Technical Analysis: ADX"] != undefined) {
            var timeSeries = jsonObj["Technical Analysis: ADX"];
        } else if (jsonObj["Technical Analysis: CCI"] != undefined) {
            var timeSeries = jsonObj["Technical Analysis: CCI"];
        }
        var dates = Object.keys(timeSeries);
        var pattern = /(\w+)-(\w+)-(\w+)/;
        dates.forEach(function(date) {
            $scope.dateSeries.push(date.replace(pattern, '$2/$3'));
        });
    }

    $scope.handleQuote = function(jsonObj, symbol) {
        var timeSeries = jsonObj["Time Series (Daily)"];
        var prices = [];
        var volumes = []
        var keys = Object.keys(timeSeries);
        for (var i = 0; i <= 5 * 4 * 6; i++) {
            prices.push(parseFloat(timeSeries[keys[i]]['4. close']));
            volumes.push(parseInt(timeSeries[keys[i]]['5. volume']));
        }
        prices = prices.reverse();
        volumes = volumes.reverse();
        quote.innerHTML = "";
        $scope.price = $scope.priceChart(symbol, prices, volumes, $scope.dateSeries.slice(0, 5 * 4 * 6 + 1).reverse());
        $scope.shareChart = $scope.price;
    }

    $scope.handleStoch = function(jsonObj, symbol) {
        var data = jsonObj["Technical Analysis: STOCH"];
        var k = [];
        var d = [];
        var keys = Object.keys(data);
        for (var i = 0; i < 5 * 4 * 6; i++) {
            k.push(parseFloat(data[keys[i]]["SlowK"]));
            d.push(parseFloat(data[keys[i]]["SlowD"]));
        }
        k = k.reverse();
        d = d.reverse();
        stoch.innerHTML = "";
        $scope.stoch = $scope.stochChart(symbol, k, d, $scope.dateSeries.slice(0, 5 * 4 * 6).reverse());
    }

    $scope.handleMacd = function(jsonObj, symbol) {
        var data = jsonObj["Technical Analysis: MACD"];
        var macd = [];
        var hist = [];
        var signal = [];
        var keys = Object.keys(data);
        for (var i = 0; i <= 5 * 4 * 6; i++) {
            macd.push(parseFloat(data[keys[i]]["MACD"]));
            hist.push(parseFloat(data[keys[i]]["MACD_Hist"]));
            signal.push(parseFloat(data[keys[i]]["MACD_Signal"]));
        }
        macd = macd.reverse();
        hist = hist.reverse();
        signal = signal.reverse();
        macd.innerHTML = "";
        $scope.macd = $scope.threeLinesChart(symbol, macd, hist, signal, $scope.dateSeries.slice(0, 5 * 4 * 6 + 1).reverse(), 'macd');
    }

    $scope.handleBbands = function(jsonObj, symbol) {
        var data = jsonObj["Technical Analysis: BBANDS"];
        var mid = [];
        var up = [];
        var low = [];
        var keys = Object.keys(data);
        for (var i = 0; i <= 5 * 4 * 6; i++) {
            mid.push(parseFloat(data[keys[i]]["Real Middle Band"]));
            up.push(parseFloat(data[keys[i]]["Real Upper Band"]));
            low.push(parseFloat(data[keys[i]]["Real Lower Band"]));
        }
        mid = mid.reverse();
        up = up.reverse();
        low = low.reverse();
        bbands.innerHTML = "";
        $scope.bbands = $scope.threeLinesChart(symbol, mid, up, low, $scope.dateSeries.slice(0, 5 * 4 * 6 + 1).reverse(), 'bbands');
    }

    $scope.handleOneLine = function(jsonObj, indicator, symbol) {
        var keys = Object.keys(jsonObj);
        var data = jsonObj[keys[1]];
        var points = [];
        keys = Object.keys(data);
        for (var i = 0; i <= 5 * 4 * 6; i++) {
            points.push(parseFloat(data[keys[i]][indicator.toUpperCase()]));
        }
        document.getElementById(indicator).innerHTML = "";
        var c = $scope.oneLineChart(symbol, points, $scope.dateSeries.slice(0, 5 * 4 * 6 + 1).reverse(), indicator);
        return c;
    }

    $scope.handleNews = function(jsonObj) {
        var data = jsonObj["rss"]["0"]["channel"]["0"]["item"];
        var keys = Object.keys(data);
        var count = 0;
        newsFeed.innerHTML = "";
        for (var i = 0; i < keys.length; i++) {
            var item = data[keys[i]];
            var link = item["link"]["0"];
            if (link.indexOf("article") != -1) {
                var title = item["title"]["0"];
                var author = item["sa:author_name"]["0"];
                var pubDate = moment.tz(item["pubDate"]["0"], 'America/New_York');
                count++;
                var div = document.createElement("div");
                div.className = "well well-lg";
                div.innerHTML =
                    "<a style='font-size: 18px' target='_blank' href='" + link + "'><Strong>" + title + "</Strong></a><br><br>" +
                    "<p><Strong>Author: " + author + "</Strong></p>" +
                    "<p><Strong>Date: " + pubDate.format('ddd, DD MMM YYYY hh:mm:ss z') + "</Strong></p>";
                newsFeed.appendChild(div);
            }
            if (count == 5) {
                break;
            }
        }
    }

    $window.fbAsyncInit = function() {
        FB.init({
            appId: '1263740123771232',
            status: true,
            cookie: true,
            xfbml: true,
            version: 'v2.11',
        });
        FB.AppEvents.logPageView();
    };

    (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    $scope.shareToFb = function() {
        var exportUrl = 'https://export.highcharts.com/';
        var optionsStr = JSON.stringify($scope.shareChart);
        var dataString = encodeURI('async=true&type=jpeg&width=600&options=' + optionsStr);
        $.ajax({
            type: 'POST',
            data: dataString,
            success: function(data) {
                FB.ui({
                method: 'feed',
                picture: exportUrl + data,
                }, function(response) {
                if (response && !response.error_message) {
                    $window.alert("Posted Successfully");
                } else {
                    $window.alert("Not Posted");
                }
            });               
            }    
        })
    }

    $scope.handleHistorical = function(jsonObj, symbol) {
        var timeSeries = jsonObj["Time Series (Daily)"];
        var data = [];
        var keys = Object.keys(timeSeries);
        for (var i = 0; i < 1000; i++) {
            var point = [];
            var price = parseFloat(timeSeries[keys[i]]['4. close']);
            var date = Date.parse(keys[i]);
            point.push(date);
            point.push(price);
            data.push(point);
        }
        historicalCharts.innerHTML = "";
        $scope.historicalChart(symbol, data.reverse());
    }

    $scope.addToFav = function() {
        if (localStorage.getItem(currSymbol.innerHTML) != null) {
            localStorage.removeItem(currSymbol.innerHTML);
            favstar.classList.remove("glyphicon-star");
            favstar.classList.add("glyphicon-star-empty");
            favstar.style.color = "black";
            $scope.deleteFavStock(currSymbol.innerHTML);
        }
        if (localStorage.length == 0 || localStorage.getItem($scope.symbol) == null) {
            localStorage.setItem($scope.symbol, "fav");
            favstar.classList.remove("glyphicon-star-empty");
            favstar.classList.add("glyphicon-star");
            favstar.style.color = "yellow";
            $scope.generateFavRow($scope.symbol);
        } else {
            localStorage.removeItem($scope.symbol);
            favstar.classList.remove("glyphicon-star");
            favstar.classList.add("glyphicon-star-empty");
            favstar.style.color = "black";
            $scope.deleteFavStock($scope.symbol);
        }
    }

    $scope.refreshFav = function() {
        for (var i = 0; i < $scope.favStocks.length; i++) {
            var favStock = $scope.favStocks[i];
            $scope.refreshData(favStock);
        }
    }

    $scope.refreshData = function(stock) {
        $.get("/?fav=" + stock.symbol).then(function(data) {
            var timeSeries = data["Time Series (Daily)"];
            var dates = Object.keys(timeSeries);
            var lastDay = timeSeries[dates[0]]
            var lastPrice = lastDay['4. close'];
            var volume = lastDay['5. volume'];
            var lastClose = timeSeries[dates[1]]['4. close'];
            var change = lastPrice - lastClose;
            var changePercent = (change / lastClose * 100).toFixed(2) + "%";
            var color;
            var img;
            if (change > 0) {
                color = "green";
                img = "http://cs-server.usc.edu:45678/hw/hw8/images/Up.png";
            } else {
                color = "red";
                img = "http://cs-server.usc.edu:45678/hw/hw8/images/Down.png";
            }
            change = parseFloat(change).toFixed(2);
            lastPrice = parseFloat(lastPrice).toFixed(2);
            volume = new Intl.NumberFormat().format(volume);
            stock.price = lastPrice;
            stock.change = change;
            stock.changePercent = changePercent;
            stock.color = color;
            stock.img = img;
            $scope.$apply();
        });
    }

    $('#autorefresh').change(function() {
        if ($(this).prop('checked')) {
            $scope.refresh = $interval(function() {
                $scope.refreshFav();
            }, 5000);
        } else {
            $interval.cancel($scope.refresh);
        }
    })

    $scope.changeOrder = function() {
        $scope.favStocks = $scope.favStocks.reverse();
    }

    $scope.changeSort = function() {
        var sortBy = $scope.sort.selectedOption;
        if (sortBy == "Default") {
            $scope.order.selectedOption = "Ascending";
            order.disabled = true;
            $scope.favStocks = $scope.favStocksDefault;
        }
        if (sortBy == "Symbol") {
            order.disabled = false;
            $scope.favStocks.sort(function(a, b) {
                if (a.symbol < b.symbol) {
                    return -1;
                } else if (a.symbol > b.symbol) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }
        if (sortBy == "Price") {
            order.disabled = false;
            $scope.favStocks.sort(function(a, b) {
                return parseFloat(a.price) - parseFloat(b.price);
            });
        }
        if (sortBy == "Change") {
            order.disabled = false;
            $scope.favStocks.sort(function(a, b) {
                return parseFloat(a.change) - parseFloat(b.change);
            });
        }
        if (sortBy == "Change Percent") {
            order.disabled = false;
            $scope.favStocks.sort(function(a, b) {
                return parseFloat(a.changePercent.substring(0, a.changePercent.length)) - parseFloat(b.price.substring(0, a.changePercent.length));
            });
        }
        if (sortBy == "Volume") {
            order.disabled = false;
            $scope.favStocks.sort(function(a, b) {
                return parseInt(a.volume) - parseInt(b.volume);
            });
        }
        if ($scope.order.selectedOption == "Descending") {
            $scope.favStocks.reverse();
        }
    }

    $scope.priceChart = function(symbol, prices, volumes, dates) {
        var options = {
            chart: {
                zoomType: 'x',
                resetZoomButton: {
                    position: {
                        x: 0,
                        y: 0
                    }
                },
                exporting: {
                    width: '200px',
                    url: 'http://export.highcharts.com/'
                }
            },
            title: {
                text: symbol + " Stock Price And Volume"
            },
            subtitle: {
                text: '<a href="https://www.alphavantage.co/" target="_blank">Source: Alpha Vantage</a>',
                useHTML: true
            },
            xAxis: {
                categories: dates,
                endOnTick: true,
                startOnTick: true,
                tickInterval: 5
            },
            yAxis: [{
                    title: {
                        text: 'Stock Price'
                    },
                    min: 0
                },
                {
                    title: {
                        text: 'Volume'
                    },
                    labels: {
                        formatter: function() {
                            return this.value / 1000000 + 'M';
                        }
                    },
                    maxPadding: 0.1,
                    opposite: true,
                    min: 0
                }
            ],
            tooltip: {
                shared: false
            },
            plotOptions: {
                area: {
                    fillColor: 'hsl(226, 100%, 95%)',
                    lineColor: 'hsl(226, 100%, 50%)',
                    lineWidth: 2,
                    threshold: null
                }
            },
            series: [{
                    type: 'area',
                    name: 'Price',
                    data: prices,
                    color: 'hsl(225, 100%, 60%)',
                    marker: {
                        enabled: false,
                        fillColor: 'hsl(225, 100%, 60%)',
                        states: {
                            hover: {
                                enabled: true,
                                fillColor: 'hsl(225, 100%, 60%)',
                                lineColor: 'hsl(225, 100%, 60%)'
                            }
                        }
                    },
                    tooltip: {
                        valueDecimals: 2
                    }
                },
                {
                    type: 'column',
                    name: 'Volume',
                    data: volumes,
                    color: '#ff0000',
                    yAxis: 1
                }
            ]
        }
        $('#quote').highcharts(options);
        return options;
    }

    $scope.stochChart = function(symbol, k, d, dates) {
        var options = {
            chart: {
                zoomType: 'x',
                resetZoomButton: {
                    position: {
                        x: 0,
                        y: 0
                    }
                }
            },
            title: {
                text: 'Stochastic (STOCH)'
            },
            subtitle: {
                text: '<a href="https://www.alphavantage.co/" target="_blank">Source: Alpha Vantage</a>',
                useHTML: true
            },
            xAxis: {
                categories: dates,
                endOnTick: true,
                startOnTick: true,
                tickInterval: 2
            },
            yAxis: {
                title: {
                    text: 'STOCH'
                }
            },
            series: [{
                    type: 'line',
                    name: symbol + ' SlowK',
                    data: k,
                    color: 'rgb(0, 0, 0)',
                    lineWidth: 1,
                    tooltip: {
                        valueDecimals: 2
                    }
                },
                {
                    type: 'line',
                    name: symbol + ' SlowD',
                    data: d,
                    color: 'rgb(100, 200, 500)',
                    lineWidth: 1,
                    tooltip: {
                        valueDecimals: 2
                    }

                }
            ]
        };

        $('#stoch').highcharts(options);
        return options;
    }

    $scope.threeLinesChart = function(symbol, a, b, c, dates, indicator) {
        var title;
        var series = [];
        var chart;
        var yaxis;
        if (indicator == "macd") {
            chart = '#macd';
            title = "Moving Average Convergence/Divergence (MACD)";
            series = [symbol + ' MACD', symbol + ' MACD_Hist', symbol + ' MACD_Signal'];
            yaxis = "MACD";
        } else if (indicator == "bbands") {
            chart = '#bbands'
            title = 'Bollinger Bands (BBANDS)';
            series = [symbol + ' Real Middle Band', symbol + ' Real Upper Band', symbol + ' Real Lower Band'];
            yaxis = "BBANDS";
        }
        var options = {
            chart: {
                zoomType: 'x',
                resetZoomButton: {
                    position: {
                        x: 0,
                        y: 0
                    }
                }
            },
            title: {
                text: title
            },
            subtitle: {
                text: '<a href="https://www.alphavantage.co/" target="_blank">Source: Alpha Vantage</a>',
                useHTML: true
            },
            xAxis: {
                categories: dates,
                endOnTick: true,
                startOnTick: true,
                tickInterval: 2
            },
            yAxis: {
                title: {
                    text: yaxis
                }
            },
            series: [{
                    type: 'line',
                    name: series[0],
                    data: a,
                    color: 'rgb(100, 200, 500)',
                    lineWidth: 1,
                    tooltip: {
                        valueDecimals: 2
                    }
                },
                {
                    type: 'line',
                    name: series[1],
                    data: b,
                    color: 'rgb(179, 255, 179)',
                    lineWidth: 1,
                    tooltip: {
                        valueDecimals: 2
                    }
                },
                {
                    type: 'line',
                    name: series[2],
                    data: c,
                    color: 'rgb(0, 0, 0)',
                    lineWidth: 1,
                    tooltip: {
                        valueDecimals: 2
                    }
                }
            ]
        };
        $(chart).highcharts(options);
        return options;
    }

    $scope.oneLineChart = function(symbol, data, dates, indicator) {
        var title;
        var chart;
        var yaxis;

        if (indicator == "sma") {
            title = "Simple Moving Average (SMA)";
            chart = "#sma";
            yaxis = "SMA";
        } else if (indicator == "ema") {
            title = "Exponential Moving Average (EMA)";
            chart = "#ema";
            yaxis = "EMA";
        } else if (indicator == "rsi") {
            title = "Relative Strength Index (RSI)";
            chart = "#rsi";
            yaxis = "RSI";
        } else if (indicator == "adx") {
            title = "Average Directional Movement Index (ADX)";
            chart = "#adx";
            yaxis = "ADX";
        } else if (indicator == "cci") {
            title = "Commondity Channel Index (CCI)";
            chart = "#cci";
            yaxis = "CCI";
        }
        var options = {
            chart: {
                zoomType: 'x',
                resetZoomButton: {
                    position: {
                        x: 0,
                        y: 0
                    }
                }
            },
            title: {
                text: title
            },
            subtitle: {
                text: '<a href="https://www.alphavantage.co/" target="_blank">Source: Alpha Vantage</a>',
                useHTML: true
            },
            xAxis: {
                categories: dates,
                endOnTick: true,
                startOnTick: true,
                tickInterval: 2

            },
            yAxis: {
                title: {
                    text: yaxis
                }
            },
            plotOptions: {
                series: {
                    color: 'rgb(100, 200, 500)',
                    lineWidth: 1
                }
            },
            series: [{
                type: 'line',
                name: symbol,
                data: data,
                tooltip: {
                    valueDecimals: 2
                }
            }]
        };
        $(chart).highcharts(options)
        return options;
    }

    $scope.historicalChart = function(symbol, data) {
        Highcharts.stockChart('historicalCharts', {
            chart: {
                zoomType: 'x'
            },
            title: {
                text: symbol + ' Stock Price'
            },
            subtitle: {
                text: '<a href="https://www.alphavantage.co/" target="_blank">Source: Alpha Vantage</a>',
                useHTML: true
            },
            rangeSelector: {
                buttons: [{
                    type: 'week',
                    count: 1,
                    text: '1w'
                }, {
                    type: 'month',
                    count: 1,
                    text: '1m'
                }, {
                    type: 'month',
                    count: 6,
                    text: '6m'
                }, {
                    type: 'year',
                    count: 1,
                    text: '1y'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                selected: 0
            },
            tooltip: {
                split: false
            },
            series: [{
                name: symbol,
                data: data,
                type: 'area',
                threshold: null,
                tooltip: {
                    valueDecimals: 2
                }
            }]
        });
    }
}