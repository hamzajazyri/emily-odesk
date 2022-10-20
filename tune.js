
logging = true;
defaultHour = 9;
defaultMinute = 32;
const uid = new ShortUniqueId({length:10});
const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});


function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

//returns div with specified title and creates it if doesn't yet exist
function getDiv(title) {
	elem = u("#" + title);
	if (elem.length == 0) {
		u('body').append("<div id='" + title + "'></div");
		elem = u("#" + title);
        elem.addClass('pl-4 font-thin');
	}
	return elem;
}

//clear contents of a div tag
function clearDiv(title) {
	elem = getDiv(title);
	if (elem.length > 0) elem.empty();
}

//log content to the browser window using html
function log(content, divTitle = "log") {
    
    if (logging){
	   elem = getDiv(divTitle);
	   if (elem.length > 0) {
            html = elem.html();
            elem.html(html + content + "<BR>");
	   }
    }
}

//clear log contents
function clearLog(divTitle = "log") {
	clearDiv(divTitle);
}


function getCurrentUrl(){
    return window.location.href.split('?')[0];
}

//log error to the browser window using html
function error(content, divTitle = "error") {
	elem = getDiv(divTitle);
	if (elem.length > 0) {
		html = elem.html();
		elem.html(html + content + "<BR>");
	}
}

//clear error contents
function clearError(divTitle = "error") {
	clearDiv(divTitle);
}


function getChartDiv(chartTitle, chartStyle = null) {
    
    if (chartStyle == null){
        chartWidth = round2(window.screen.availWidth * 0.75);
        chartHeight = round2(chartWidth / 2.0);
        chartStyle = "width: " + chartWidth + "px; height: " + chartHeight + "px;";
    }
    
	try {
		chartTitle = chartTitle.replaceAll(' ', '_');
		div = document.getElementById(chartTitle);
		if (div == null) {
			div = document.createElement('div');
			div.id = chartTitle;
			div.style = chartStyle;
			parentDiv = document.getElementById("charts");
			if (parentDiv == null) {
				//log("creating charts div");
				parentDiv = document.createElement('div');
				parentDiv.id = "charts";
				document.body.appendChild(parentDiv);
			}
			parentDiv.appendChild(div);
		}
		//if (div != null) {
		//	div.style = chartStyle;
		//}
		return div;
	} catch (err) {
		log(err.message);
	}
}

//rounds a number to 2 decimal places  
function round2(num) {
	var m = Number((Math.abs(num) * 100).toPrecision(15));
	return (Math.round(m) / 100 * Math.sign(num));
}

//return number as 0 padded string.  e.g. 7 returns 07.  Useful for date formatting.     
function padTo2Digits(num) {
	return num.toString().padStart(2, '0');
}

//returns comma delimmited string of market holidays based on year specified.  Returns empty string if no details.    
function getMarketHolidayString(year) {
	switch (year) {
		case 2015:
			return "2015-01-01,2015-01-19,2015-02-16,2015-04-03,2015-05-25,2015-07-03,2015-09-07,2015-11-26,2015-12-25";
		case 2016:
			return "2016-01-01,2016-01-18,2016-02-15,2016-03-25,2016-05-30,2016-07-04,2016-09-05,2016,11-24,2016-12-26";
		case 2017:
			return "2017-01-02,2017-01-16,2017-02-20,2017-04-14,2017-05-29,2017-07-04,2017-09-04,2017-11-23,2017-12-25";
		case 2018:
			return "2018-01-01,2018-01-15,2018-02-19,2018-03-30,2019-05-28,2018-07-04,2018-09-03,2018-11-22,2018-12-25";
		case 2019:
			return "2019-01-01,2019-01-21,2019-02-18,2019-04-19,2019-05-27,2019-07-04,2019-09-02,2019-11-28,2019-12-25";
		case 2020:
			return "2020-01-01,2020-01-20,2020-02-17,2020-04-10,2020-05-25,2020-07-03,2020-09-07,2020-11-26,2020-12-25";
		case 2021:
			return "2021-01-01,2021-01-18,2021-02-15,2021-04-02,2021-05-31,2021-07-05,2021-09-06,2021-11-25,2021-12-24";
		case 2022:
			return "2022-01-17,2022-02-21,2022-04-15,2022-05-30,2022-06-20,2022-07-04,2022-09-05,2022-11-24,2022-12-26";
		case 2023:
			return "2023-01-02,2023-01-16,2023-02-20,2023-04-07,2023-05-29,2023-06-19,2023-07-04,2023-09-04,2023-11-23,2023-12-25";
		case 2024:
			return "2024-01-01,2024-01-15,2024-02-19,2024-03-29,2024-05-27,2024-06-19,2024-07-04,2024-09-02,2024-11-28,2024-12-25";
	}
	return "";
}

//histogram function
function histogram(data, size) {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	for (const item of data) {
		if (item < min) min = item;
		else if (item > max) max = item;
	}
	const bins = Math.ceil((max - min + 1) / size);
	const histogram = new Array(bins).fill(0);
	for (const item of data) {
		histogram[Math.floor((item - min) / size)]++;
	}
	return histogram;
}

//returns true if valid trading day.  False if weekend or market holiday.
function isOptionTradingDayISO(isoDateString) {
	var isoDateTime = luxon.DateTime.fromISO(isoDateString, {
		zone: "America/New_York"
	});
	if (isoDateTime.weekday > 5) return false;
	var YMD = isoDateTime.year + "-" + padTo2Digits(isoDateTime.month) + "-" + padTo2Digits(isoDateTime.day);
	var holidays = getMarketHolidayString(isoDateTime.year);
	if (holidays.search(YMD) >= 0) return false;
	return true;
}


function isOptionTradingTime(hour, minute)
{
	if ((hour > 16) || (hour < 9) || ((hour == 9) && (minute < 30)) || ((hour == 16) && (minute >= 0))) {
		return false;
	}
	return true;
}

//returns true if valid trading time (930am to 359pm Eastern) and false otherwise.     
function isOptionTradingTimeISO(isoDateString) {
	var isoDateTime = luxon.DateTime.fromISO(isoDateString, {
		zone: "America/New_York"
	});
	hour = isoDateTime.hour;
	minute = isoDateTime.minute;
	//can change to allow for extended trading hours if changing last bit to hour==16 && minute >=15
	if ((hour > 16) || (hour < 9) || ((hour == 9) && (minute < 30)) || ((hour == 16) && (minute >= 0))) {
		return false;
	}
	return true;
}

//returns the last valid trading time (now, end of today, or end of yesterday)
//!! yesterday is inaccurate need better solution
function lastTradingTime() {
	millistamp = Date.now();
	if (isOptionTradingTimeMilli(millistamp)) return millistamp;
	hour = getHour(millistamp);
	if (hour >= 16) return getMillistampFromYMD(getTodayYMD(), 15, 59);
	return getMillistampFromYMD(getYesterdayYMD(), 15, 59);
}

//returns true if the iso dateime is a valid trading day and tume
function isOptionTradingDateTimeISO(isoDateString) {
	isTradingDay = isOptionTradingDayISO(isoDateString);
	isTradingTime = isOptionTradingTimeISO(isoDateString);
	return (isTradingDay && isTradingTime);
}

function isOptionTradingDayMilli(millistamp) {
	return isOptionTradingDayISO(new Date(millistamp).toISOString());
}

function isOptionTradingTimeMilli(millistamp) {
	return isOptionTradingTimeISO(new Date(millistamp).toISOString());
}

function isOptionTradingDateTimeMilli(millistamp) {
	return isOptionTradingDateTimeISO(new Date(millistamp).toISOString());
}

function isOptionTradingDayYMD(yyyymmddDate) {
	millistamp = getMillistampFromYMD(yyyymmddDate, hour = 12, minute = 0, seconds = 0);
	return isOptionTradingDayMilli(millistamp);
}
//returns a string with formatted date and time in Eastern Time USA for a millisecond timestamp
function formatEastern(millistamp) {
	isoDate = new Date(millistamp).toISOString();
	var isoDateEST = luxon.DateTime.fromISO(isoDate, {
		zone: "America/New_York"
	});
	return isoDateEST.toLocaleString(luxon.DateTime.DATE_SHORT) + " " + isoDateEST.toLocaleString(luxon.DateTime.TIME_WITH_SHORT_OFFSET);
}
//get millisecond timestamp using a date and time specified in Eastern USA timezone
function getMillistamp(year, month, day, hour, minute, seconds = 0) {
	return luxon.DateTime.fromObject({
		year: year,
		month: month,
		day: day,
		hour: hour,
		minute: minute,
		second: seconds
	}, {
		zone: 'America/New_York',
		numberingSystem: 'latn'
	});
}
//get nanosecond timestamp using Eastern USA timezone
function getNanostamp(year, month, day, hour, minute, seconds = 0) {
	return 1000000 * getMillistamp(year, month, day, hour, minute, seconds);
}
//get millisecond timestamp using Eastern timezone for a specific day YYYY-MM-DD  
function getMillistampFromYMD(yyyymmddDate, hour = defaultHour, minute = defaultMinute, seconds = 0) {
	date = luxon.DateTime.fromISO(yyyymmddDate, {
		zone: "America/New_York"
	});
	if ((isNaN(date.month)) || (isNaN(date.day)) || (isNaN(date.year))) {
		error(yyyymmddDate + " is an improper date format.  Should be YYYY-MM-DD");
		return;
	}
	return getMillistamp(date.year, date.month, date.day, hour, minute, seconds);
}




    
function getYMDFromMillistamp(millistamp) {
	isoDate = new Date(millistamp).toISOString();
	let isoDateEST = luxon.DateTime.fromISO(isoDate, {
		zone: "America/New_York"
	});
	year = isoDateEST.year;
	month = isoDateEST.month;
	day = isoDateEST.day;
	return year + "-" + padTo2Digits(month) + "-" + padTo2Digits(day);
}

function getHour(millistamp) {
	isoDate = new Date(millistamp).toISOString();
	let isoDateEST = luxon.DateTime.fromISO(isoDate, {
		zone: "America/New_York"
	});
	return isoDateEST.hour;
}

function getTodayYMD() {
	return getYMDFromMillistamp(new Date().getTime());
}

function getYesterdayYMD() {
	return getYMDFromMillistamp(new Date().getTime() - 24 * 60 * 60 * 1000);
}

function addDaysToYMD(yyyymmddDate, numDays) {
	milliStamp = getMillistampFromYMD(yyyymmddDate);
	newMilliStamp = milliStamp + numDays * 24 * 60 * 60 * 1000;
	var currentTime = luxon.DateTime.fromISO(new Date(newMilliStamp).toISOString(), {
		zone: "America/New_York"
	});
	return currentTime.year + "-" + padTo2Digits(currentTime.month) + "-" + padTo2Digits(currentTime.day);
}
//need to consider rounding and off by 1 errors - how to count minutes inclusive or exlcusive?
//also should it using rounding and round up or down?
function tradingMinutes(startTime, endTime) {
	totalMinutes = (endTime - startTime) / 60000;
	tradeMinutes = 0;
	for (let i = 0; i < totalMinutes; i++) {
		if (isOptionTradingDateTimeMilli(startTime + i * 60000)) tradeMinutes++
	}
	return tradeMinutes;
}

function analyzeLeg(leg, entryTime) {
	const price = [];
	const position = [];
	const timestamp = [];
	const volume = [];
	const transactions = [];
	const profitLoss = [];
	const bestExit = [];
	const bestExitMinute = [];
	const maxDrawdown = [];
	const maxDrawdownMinute = [];
	
    
    exitTime = Math.min(leg.millistamp, new Date().getTime());
    //exitTime = Math.min(leg.millistamp, lastTradingTime());
	ticker = leg.ticker;
	quantity = leg.quantity;
	contractName = leg.contractName;
	expDate = leg.expDate;
	strike = leg.strike;
	optionType = leg.optionType;
	//log("entry time = " + entryTime);
    //log("exit time = " + exitTime);
	//log("last trading time = " + lastTradingTime())
	//tradeMinutes = tradingMinutes(entryTime, lastTradingTime());
	//log("trading minutes: " + tradeMinutes);
	contractBars = aggInterpBars(contractName, entryTime, exitTime);
	contractBarsLength = contractBars.length;
	//log("contract bar length=" + contractBarsLength);
    
    //log("contract bar 0 timestamp: " + contractBars[0].millistamp);
    
	maxDrawdownValue = 0;
	maxDrawdownMinuteValue = 0;
	bestExitValue = Number.NEGATIVE_INFINITY;
	bestExitMinuteValue = 0;
	for (let i = 0; i < contractBarsLength; i++) {
		bar = contractBars[i];
		price.push(bar.price);
		timestamp.push(bar.millistamp);
		volume.push(bar.volume);
		transactions.push(bar.transactions);
		positionValue = round2(-1 * quantity * price[i]);
		position.push(positionValue);
		profitLossValue = round2(100 * (position[0] - position[i]));
		profitLoss.push(profitLossValue);
		if (profitLoss[i] < maxDrawdownValue) {
			maxDrawdownValue = profitLoss[i];
			maxDrawdownMinuteValue = i;
		}
		maxDrawdown.push(maxDrawdownValue);
		maxDrawdownMinute.push(maxDrawdownMinuteValue);
		if (profitLoss[i] > bestExitValue) {
			bestExitValue = profitLoss[i];
			bestExitMinuteValue = i;
		}
		bestExit.push(bestExitValue);
		bestExitMinute.push(bestExitMinuteValue);
	}
	//log("best exit for " + contractName + "=" + bestExitValue + " max drawdown=" + maxDrawdownValue);
	//log("contract bar length=" + contractBarsLength);
	//log(price.length);    
	return new LegStats(contractBarsLength, contractName, leg.shortName, ticker, quantity, strike, expDate, optionType, price, position, timestamp, volume, transactions, profitLoss, bestExit, bestExitMinute, maxDrawdown, maxDrawdownMinute);
}



function creditOrDebit(num){
    return (num > 0) ? "credit" : "debit";
}

function summarizeOptionStats(optionStats) {
	OS = optionStats;
	if (OS != null) {
        
        
        const highlightArr = [];
        const datapointArr = [];
        const detailArr = [];
        
        //error("short put side length=" + OS.shortPutSide.length);
        
        if ((OS.longSide.length > 0) && (OS.shortSide.length > 0) ){
            
            highlightArr.push("entry short/long ratio (strategy)");
            datapointArr.push(OS.entryShortLongRatio);
            detailArr.push("");
        }
        
        if ( (OS.longCallSide.length > 0) && (OS.shortCallSide.length > 0) ){
            highlightArr.push("entry short/long ratio (calls)");
            datapointArr.push(OS.entryCallShortLongRatio);
            detailArr.push("");
        }
        
        if ( (OS.longPutSide.length > 0) && (OS.shortPutSide.length > 0) ){
            highlightArr.push("entry short/long ratio (puts)");
            datapointArr.push(OS.entryPutShortLongRatio);
            detailArr.push("");
        }
        
        if ( (OS.putSide.length > 0) && (OS.callSide.length > 0) ){
            highlightArr.push("entry call/put ratio (strategy)");
            datapointArr.push(OS.entryCallPutRatio);
            detailArr.push("");
        }
        
        
        if ( (OS.shortPutSide.length > 0) && (OS.shortCallSide.length > 0) ){
            highlightArr.push("entry call/put ratio (shorts)");
            datapointArr.push(OS.entryShortCallPutRatio);
            detailArr.push("");
        }
        
        if ( (OS.longPutSide.length > 0) && (OS.longCallSide.length > 0) ){
            highlightArr.push("entry call/put ratio (longs)");
            datapointArr.push(OS.entryLongCallPutRatio);
            detailArr.push("");
        }
        
        
        highlightArr.push("entry (strategy)");
        datapointArr.push(OS.entryPosition + " " + creditOrDebit(OS.entryPosition));
        detailArr.push("");
        
        
        if (OS.shortSide.length > 0) {
            highlightArr.push("entry (shorts)");
            datapointArr.push(OS.shortSide.position[0] + " " + creditOrDebit(OS.shortSide.position[0]));
            detailArr.push("");
        }
        
        if (OS.longSide.length > 0) {
            highlightArr.push("entry (longs)");
            datapointArr.push(OS.longSide.position[0] + " " + creditOrDebit(OS.longSide.position[0]));
            detailArr.push("");
        }
        
        if (OS.callSide.length > 0) {
            highlightArr.push("entry (calls)");
            datapointArr.push(OS.callSide.position[0] + " " + creditOrDebit(OS.callSide.position[0]));
            detailArr.push("");
        }
        
        if (OS.putSide.length > 0) {
            highlightArr.push("entry (puts)");
            datapointArr.push(OS.putSide.position[0] + " " + creditOrDebit(OS.putSide.position[0]));
            detailArr.push("");
        }
        
        LSA = OS.legStatArr;
		separateLegBestExit = 0;
        separateLegBestExitTimes = "";
		for (let i = 0; i < LSA.length; i++) {
			LS = LSA[i];
			separateLegBestExit += LS.bestExit[LS.length - 1];
            
            separateLegBestExitTimes += formatEastern(OS.timestamp[LS.bestExitMinute[LS.length - 1]]) + ". ";
            
            
            highlightArr.push("entry " + LS.shortName);
            datapointArr.push(LS.position[0] + " " + creditOrDebit(LS.position[0]));
            
            perContractStr = "";
        
            quantityAbs = Math.abs(LS.quantity);
            if (quantityAbs >=1 ){
              perContract = round2(LS.position[0] / quantityAbs);
              perContractStr = perContract + " " + creditOrDebit(perContract) + " per contract. ";
            }
            
            detailArr.push(perContractStr + "volume=" + LS.volume[0] + ", transactions=" + LS.transactions[0] + " over the next 1 minute.");
		}
        //log("best outcome exiting each leg separately=" + separateLegBestExit);
        


        
        
        highlightArr.push("exit (front leg expiry)");
        datapointArr.push(OS.profitLoss[OS.profitLoss.length - 1]);
        detailArr.push("exit position at front leg expiry " + formatEastern(OS.timestamp[OS.length - 1]));
        
        
        
        highlightArr.push("best exit (strategy)");
        datapointArr.push(OS.bestExitValue);
        detailArr.push("exit all legs " + formatEastern(OS.timestamp[OS.bestExitMinuteValue]));
        
        
        if ((OS.callSide.length > 0) && (OS.putSide.length > 0)) {
			callPutBestExit = OS.callSide.bestExitValue + OS.putSide.bestExitValue;
			//log("best outcome exiting call and put sides separately=" + callPutBestExit);
            
            callBestExitTimestamp = OS.timestamp[OS.callSide.bestExitMinuteValue];
            callBestExitDetail = "exit calls " + formatEastern(callBestExitTimestamp) + " for " + OS.callSide.bestExitValue + ".";
            
            putBestExitTimestamp = OS.timestamp[OS.putSide.bestExitMinuteValue];
            putBestExitDetail = "exit puts " + formatEastern(putBestExitTimestamp) + " for " + OS.putSide.bestExitValue + ".";
            
            callPutBestExitDetail = callPutBestExitDetail = callBestExitDetail + " " + putBestExitDetail;
            if (callBestExitTimestamp > putBestExitTimestamp) callPutBestExitDetail = putBestExitDetail + " " + callBestExitDetail;
            
            
            highlightArr.push("best exit (calls and puts separately)");
            datapointArr.push(callPutBestExit);
            detailArr.push(callPutBestExitDetail);
            
       
            
		}
        
        
        
		if ((OS.shortSide.length > 0) && (OS.longSide.length > 0)) {

            
            
            
            shortBeforeLongBestExit = Number.NEGATIVE_INFINITY;
            shortBestExitMinute = 0;
            longBestExitMinute = 0;
            shortBestExitValue = Number.NEGATIVE_INFINITY;
            longBestExitValue = Number.NEGATIVE_INFINITY;
            shortLongLength = Math.min(OS.shortSide.length, OS.longSide.length);
            
            for (let i=0; i < shortLongLength; i++ ){
                shortBeforeLongProfitLoss = OS.shortSide.profitLoss[i] + OS.longSide.bestExitRev[OS.longSide.length - i];

                
                if (shortBeforeLongProfitLoss > shortBeforeLongBestExit){
                    shortBeforeLongBestExit = shortBeforeLongProfitLoss; 
                    shortBestExitMinute = i;
                    longBestExitMinute = OS.longSide.bestExitMinuteRev[OS.longSide.length - i];
                    
                    shortBestExitValue = OS.shortSide.profitLoss[i];
                    longBestExitValue = OS.longSide.bestExitRev[OS.longSide.length - i];
                    
                }
            }
            
            //error("short best exit minute=" + formatEastern(OS.timestamp[shortBestExitMinute]) );
            //error("long best exit minute=" + formatEastern(OS.timestamp[longBestExitMinute]) );
            
            highlightArr.push("best exit (shorts before longs)");
            datapointArr.push(shortBeforeLongBestExit);
            detailArr.push("exit shorts "  + formatEastern(OS.timestamp[shortBestExitMinute]) + " for " + shortBestExitValue + ". exit longs " + formatEastern(OS.timestamp[longBestExitMinute]) + " for " + longBestExitValue + ".");
            
            
            
       
            shortLongBestExit = OS.shortSide.bestExitValue + OS.longSide.bestExitValue;

            if (OS.shortSide.bestExitMinuteValue > OS.longSide.bestExitMinuteValue){
                highlightArr.push("best exit (longs before shorts)");
                datapointArr.push(shortLongBestExit);
                
                longsBeforeShortsDetail = "exit longs " + formatEastern(OS.timestamp[OS.longSide.bestExitMinuteValue]) + ". ";
                longsBeforeShortsDetail += "exit shorts " + formatEastern(OS.timestamp[OS.shortSide.bestExitMinuteValue]) + ".";
                
                detailArr.push(longsBeforeShortsDetail);
            }
            
		}
        
        


        separateExitDetail = "";
        highlightArr.push("best exit (each leg separately)");
        datapointArr.push(separateLegBestExit);
        if (LSA.length >=3){
            
            //separateExitDetail = "be careful exiting " + LSA.length + " separate legs";
            //if (OS.shortSide.length > 0) separateExitDetail += " and shorts before longs. " + separateLegBestExitTimes;
            
            separateExitDetail = separateLegBestExitTimes;
            
            
        }
        detailArr.push(separateExitDetail);
        
        
        

        
        /*timestampArr = OS.timestamp;
        t0 = timestampArr[0];
        t1 = getMillistampFromYMD(getYMDFromMillistamp(t0), 0, 0, 0);
        t2 = timestampArr[timestampArr.length - 1];
        
        //const eventArr = [];
        //const eventDataArr = [];
        
        news = getNews(t1, t2);
        for (let i=0; i < news.length; i++){
            highlightArr.push(news[i].event);
            datapointArr.push(formatEastern(news[i].timestamp));
                //log(news[i].event);
        }*/
        
        
        
        
        highlightArr.push("max drawdown (strategy)");
        datapointArr.push(OS.maxDrawdownValue);
        detailArr.push("first occured at " + formatEastern(OS.timestamp[OS.maxDrawdownMinuteValue]));
        
        if (OS.callSide.length > 0){
            highlightArr.push("max drawdown (calls)");
            datapointArr.push(OS.callSide.maxDrawdownValue);
            detailArr.push("first occured at " + formatEastern(OS.timestamp[OS.callSide.maxDrawdownMinuteValue]));
        }
        
        if (OS.putSide.length > 0){
            highlightArr.push("max drawdown (puts)");
            datapointArr.push(OS.putSide.maxDrawdownValue);
            detailArr.push("first occured at " + formatEastern(OS.timestamp[OS.putSide.maxDrawdownMinuteValue]));
        }
        
        if (OS.shortSide.length > 0){
            highlightArr.push("max drawdown (shorts)");
            datapointArr.push(OS.shortSide.maxDrawdownValue);
            detailArr.push("first occured at " + formatEastern(OS.timestamp[OS.shortSide.maxDrawdownMinuteValue]));
        }
        
        if (OS.longSide.length > 0){
            highlightArr.push("max drawdown (longs)");
            datapointArr.push(OS.longSide.maxDrawdownValue);
            detailArr.push("first occured at " + formatEastern(OS.timestamp[OS.longSide.maxDrawdownMinuteValue]));
        }
        
        
        
        for (let i=0; i < OS.events.length; i++){
            
            e = OS.events[i];
            highlightArr.push(e.event);
            datapointArr.push(formatEastern(e.timestamp));
            
            eventDetails = "";
            
            if (e.timestamp < OS.timestamp[0]){
              eventDetails = "before trade entry." 
                
                if (!isOptionTradingTimeMilli(e.timestamp))
                  eventDetails += " before market open." 
                    
            }
            
            if ( (e.timestamp >= OS.timestamp[0]) && (e.timestamp <= OS.timestamp[OS.timestamp.length - 1]) ) {
              eventDetails = "during trade." 
            }
            
            
            if ( e.timestamp > OS.timestamp[OS.timestamp.length - 1] ) {
              eventDetails = "after trade close.  after market hours." 
            }
            
            
            
                  
                  
            detailArr.push(eventDetails);
            
        }
        
        
        const datapointArrStr = datapointArr.map(val => {return String(val);});
        const detailArrStr = detailArr.map(val => {return String(val);});
        
        drawTable("Strategy - Summary", ["string", "string", "string"], ["highlight", "datapoint", "details"], [highlightArr, datapointArrStr, detailArrStr]);
        
        
        //const eventDataArrStr = eventDataArr.map(val => {return String(val);});
        //drawTable("News Summary", ["string", "string"], ["news event", "timestamp"], [eventArr, eventDataArrStr]);
        
        

        
        
	}
}
async function analyzeStrategy(strategy) {
	const legStatArr = [];
	const price = [];
	const position = [];
	const timestamp = [];
	const volume = [];
	const transactions = [];
	const shortPosition = [];
	const longPosition = [];
	const callPosition = [];
	const putPosition = [];
    
    const shortCallPosition = [];
	const longCallPosition = [];
    const shortPutPosition = [];
	const longPutPosition = [];
    
    
	const shortStrikes = [];
	legs = strategy.legs;
	numLegs = legs.length;
	if (numLegs == 0) {
		error("invalid strategy - no contract legs.");
		return null;
	}
	entryTime = strategy.millistamp;
    //log("entryTime=" + entryTime);
	minLength = Number.POSITIVE_INFINITY;
	maxLength = 0;
	shortLengthMin = Number.POSITIVE_INFINITY;
	longLengthMin = Number.POSITIVE_INFINITY;
	callLengthMin = Number.POSITIVE_INFINITY;
	putLengthMin = Number.POSITIVE_INFINITY;
    
    shortCallLengthMin = Number.POSITIVE_INFINITY;
	longCallLengthMin = Number.POSITIVE_INFINITY;
    shortPutLengthMin = Number.POSITIVE_INFINITY;
	longPutLengthMin = Number.POSITIVE_INFINITY;
    
	const promises = legs.map(leg => legStatArr.push(analyzeLeg(leg, entryTime)));
	for (const promise of promises) {
		response = await promise;
	}
	//log("leg stat arr length = " + legStatArr.length);
	for (let i = 0; i < numLegs; i++) {
		leg = legs[i];
		//log(leg.contractName);
		quantity = leg.quantity;
		optionType = leg.optionType;
		//legStat = analyzeLeg(leg, entryTime);
		legStat = legStatArr[i];
		legStatLength = legStat.length;
		//legStatArr.push(legStat);
		//log(legStatLength);
        
        if (legStatLength == 0){
            error("no trades occured with this strategy for contract " + leg.shortName);
            return null;
        }
        
		if (legStatLength < minLength) minLength = legStatLength;
		if (legStatLength > maxLength) maxLength = legStatLength;
		if ((quantity < 0) && (legStatLength < shortLengthMin)) shortLengthMin = legStatLength;
		if ((quantity > 0) && (legStatLength < longLengthMin)) longLengthMin = legStatLength;
		if ((optionType == "call") && (legStatLength < callLengthMin)) callLengthMin = legStatLength;
		if ((optionType == "put") && (legStatLength < putLengthMin)) putLengthMin = legStatLength;
        
        if ((quantity < 0) && (optionType == "call") && (legStatLength < shortCallLengthMin)) shortCallLengthMin = legStatLength;
        if ((quantity > 0) && (optionType == "call") && (legStatLength < longCallLengthMin)) longCallLengthMin = legStatLength;
        
        if ((quantity < 0) && (optionType == "put") && (legStatLength < shortPutLengthMin)) shortPutLengthMin = legStatLength;
        if ((quantity > 0) && (optionType == "put") && (legStatLength < longPutLengthMin)) longPutLengthMin = legStatLength;
        
	}
    

    
    /*
    shortCallLengthMin = Math.min(shortLengthMin, callLengthMin);
    longCallLengthMin = Math.min(longLengthMin, callLengthMin);
    shortPutLengthMin = Math.min(shortLengthMin, putLengthMin);
    longPutLengthMin = Math.min(longLengthMin, putLengthMin);
    */

	//log("final min length=" + minLength);
	//log("final max length=" + maxLength);
	//log("initializing strategy result arrays");
	/*for (let i=0; i < minLength; i++){
	
	}
	*/
	for (let i = 0; i < minLength; i++) {
		price.push(0);
		position.push(0);
		timestamp.push(0);
		volume.push(0);
		transactions.push(0);
		longPosition.push(0);
		callPosition.push(0);
		putPosition.push(0);
        shortCallPosition.push(0);
        longCallPosition.push(0);
        shortPutPosition.push(0);
        longPutPosition.push(0);   
	}
	if (shortLengthMin == Number.POSITIVE_INFINITY) shortLengthMin = 0;
	if (longLengthMin == Number.POSITIVE_INFINITY) longLengthMin = 0;
	if (callLengthMin == Number.POSITIVE_INFINITY) callLengthMin = 0;
	if (putLengthMin == Number.POSITIVE_INFINITY) putLengthMin = 0;
    if (shortCallLengthMin == Number.POSITIVE_INFINITY) shortCallLengthMin = 0;
	if (longCallLengthMin == Number.POSITIVE_INFINITY) longCallLengthMin  = 0;
    if (shortPutLengthMin == Number.POSITIVE_INFINITY) shortPutLengthMin  = 0;
	if (longPutLengthMin == Number.POSITIVE_INFINITY) longPutLengthMin  = 0;
    
	for (let i = 0; i < shortLengthMin; i++) {
		shortPosition.push(0);
	}
	for (let i = 0; i < longLengthMin; i++) {
		longPosition.push(0);
	}
	for (let i = 0; i < callLengthMin; i++) {
		callPosition.push(0);
	}
	for (let i = 0; i < putLengthMin; i++) {
		putPosition.push(0);
	}
    
    for (let i = 0; i < shortCallLengthMin; i++) {
		shortCallPosition.push(0);
	}
    for (let i = 0; i < longCallLengthMin; i++) {
		longCallPosition.push(0);
	}
    for (let i = 0; i < shortPutLengthMin; i++) {
		shortPutPosition.push(0);
	}
    for (let i = 0; i < longPutLengthMin; i++) {
		longPutPosition.push(0);
	}
    
	//log("price array length=" + price.length);
	//log("updating strategy optimal values - part 1a");
	for (let i = 0; i < numLegs; i++) {
		shortLength = 0;
		longLength = 0;
		callLength = 0;
		putLength = 0;
		legStat = legStatArr[i];
		//log("leg " + i + " length=" + legStat.length );
		leg = legs[i];
		numContracts = leg.quantity;
		optionType = leg.optionType;
		strike = leg.strike;
		if (numContracts < 0) shortStrikes.push(strike);
		//log("num contracts=" + numContracts + "optionType=" + optionType);
		/*for (let j=0; j < legStat.length; j++) {
		  price[j] += legStat.price[j];
		  position[j] += legStat.position[j];  
		  timestamp[j] = legStat.timestamp[j];
		  volume[j] += legStat.volume[j];    
		    
		  if (numContracts < 0) shortPosition[j] += legStat.position[j];
		  if (numContracts > 0) longPosition[j] += legStat.position[j];
		  if (optionType == "call") callPosition[j] += legStat.position[j];
		  if (optionType == "put") putPosition[j] += legStat.position[j];              
		}*/
		//add value of the leg at different times to various total positions
		for (let j = 0; j < legStat.length; j++) {
			price[j] += legStat.price[j];
			position[j] += legStat.position[j];
			timestamp[j] = legStat.timestamp[j];
			volume[j] += legStat.volume[j];
			if (numContracts < 0) shortPosition[j] += legStat.position[j];
			if (numContracts > 0) longPosition[j] += legStat.position[j];
			if (optionType == "call") callPosition[j] += legStat.position[j];
			if (optionType == "put") putPosition[j] += legStat.position[j];
            
            if ((numContracts < 0) && (optionType == "call")) shortCallPosition[j] += legStat.position[j];
            if ((numContracts > 0) && (optionType == "call")) longCallPosition[j] += legStat.position[j];
            if ((numContracts < 0) && (optionType == "put")) shortPutPosition[j] += legStat.position[j];
            if ((numContracts > 0) && (optionType == "put")) longPutPosition[j] += legStat.position[j];
            
		}
	}
	for (let i = 0; i < maxLength; i++) {
		price[i] = round2(price[i]);
		position[i] = round2(position[i]);
        
        shortPosition[i] = round2(shortPosition[i]);
        longPosition[i] = round2(longPosition[i]);
        callPosition[i] = round2(callPosition[i]);
        putPosition[i] = round2(putPosition[i]);
	}
	//log("first price=" + price[0]);
	//log("last price=" + price[maxLength -1]);
	//log("first position=" + position[0]);
	//log("last position=" + position[maxLength -1]);
	//log("first profit loss=" + profitLoss[0]);
	//log("last profit loss=" + profitLoss[maxLength - 1]);
	/*maxDrawdownValue = 0;
	maxDrawdownMinuteValue = 0;
	bestExitValue = Number.NEGATIVE_INFINITY;
	bestExitMinuteValue = 0;

	
	for (let k=0; k < maxLength; k++){
	    
	    if (profitLoss[k] < maxDrawdownValue ){
	        maxDrawdownValue  = profitLoss[k];
	        maxDrawdownMinuteValue = k;
	    }
	    
	    maxDrawdown[k] = maxDrawdownValue;
	    maxDrawdownMinute[k] = maxDrawdownMinuteValue; 
	    
	    if (profitLoss[k] > bestExitValue){
	        bestExitValue = profitLoss[k];
	        bestExitMinuteValue = k;
	    }
	    
	    bestExit[k] = bestExitValue;
	    bestExitMinute[k] = bestExitMinuteValue;

	}*/
	shortSide = new AltSide(shortPosition, shortLengthMin);
	longSide = new AltSide(longPosition, longLengthMin);
	callSide = new AltSide(callPosition, callLengthMin);
	putSide = new AltSide(putPosition, putLengthMin);
    
    shortCallSide = new AltSide(shortCallPosition, shortCallLengthMin);
	longCallSide = new AltSide(longCallPosition, longCallLengthMin);
    shortPutSide = new AltSide(shortPutPosition, shortPutLengthMin);
	longPutSide = new AltSide(longPutPosition, longPutLengthMin);

	//log("strategy analysis complete");
    
    const events = [];
    
    t0 = timestamp[0];
    t1 = getMillistampFromYMD(getYMDFromMillistamp(t0), 0, 0, 0);
    t2a = timestamp[timestamp.length - 1];
    t2 = getMillistampFromYMD(getYMDFromMillistamp(t0), 23, 59, 59);

    news = getNews(t1, t2);
    for (let i=0; i < news.length; i++){
            events.push(new Event(news[i].event, news[i].timestamp));
    }

	return new OptionStats(minLength, legStatArr, shortStrikes, shortSide, longSide, callSide, putSide, shortCallSide, longCallSide, shortPutSide, longPutSide, price, position, timestamp, volume, transactions, events);
}
class AltSide {
	constructor(position, length) {
		this.position = position;
		this.length = length;

		this.BEMD = new BestExitMaxDrawdown(this.position, this.length);
		this.profitLoss = this.BEMD.profitLoss;
		this.bestExit = this.BEMD.bestExit;
		this.bestExitMinute = this.BEMD.bestExitMinute;
		this.maxDrawdown = this.BEMD.maxDrawdown;
		this.maxDrawdownMinute = this.BEMD.maxDrawdownMinute;
		this.bestExitValue = this.BEMD.bestExitValue;
		this.bestExitMinuteValue = this.BEMD.bestExitMinuteValue;
		this.maxDrawdownValue = this.BEMD.maxDrawdownValue;
		this.maxDrawdownMinuteValue = this.BEMD.maxDrawdownMinuteValue;
        
        this.profitLossRev = this.BEMD.profitLossRev;
		this.bestExitRev = this.BEMD.bestExitRev;
		this.bestExitMinuteRev = this.BEMD.bestExitMinuteRev;
		this.maxDrawdownRev = this.BEMD.maxDrawdownRev;
		this.maxDrawdownMinuteRev = this.BEMD.maxDrawdownMinuteRev;
		this.bestExitValueRev = this.BEMD.bestExitValueRev;
		this.bestExitMinuteValueRev = this.BEMD.bestExitMinuteValueRev;
		this.maxDrawdownValueRev = this.BEMD.maxDrawdownValueRev;
		this.maxDrawdownMinuteValueRev = this.BEMD.maxDrawdownMinuteValueRev;
        
        //this.events = [];
        
	}
}
class BestExitMaxDrawdown {
	constructor(position, length) {
		this.position = position;
		this.length = length;
        
		this.profitLoss = [];
		this.maxDrawdown = [];
		this.maxDrawdownMinute = [];
		this.bestExit = [];
		this.bestExitMinute = [];
		this.maxDrawdownValue = 0;
		this.maxDrawdownMinuteValue = 0;
		this.bestExitValue = Number.NEGATIVE_INFINITY;
		this.bestExitMinuteValue = 0;
		for (let k = 0; k < this.length; k++) {
			this.profitLossValue = round2(100 * (position[0] - position[k]));
			this.profitLoss.push(this.profitLossValue);
			if (this.profitLossValue < this.maxDrawdownValue) {
				this.maxDrawdownValue = this.profitLossValue;
				this.maxDrawdownMinuteValue = k;
			}
			this.maxDrawdown.push(this.maxDrawdownValue);
			this.maxDrawdownMinute.push(this.maxDrawdownMinuteValue);
			if (this.profitLossValue > this.bestExitValue) {
				this.bestExitValue = this.profitLossValue;
				this.bestExitMinuteValue = k;
			}
			this.bestExit.push(this.bestExitValue);
			this.bestExitMinute.push(this.bestExitMinuteValue);
		}
        
        this.profitLossRev = [];
		this.maxDrawdownRev = [];
		this.maxDrawdownMinuteRev = [];
		this.bestExitRev = [];
		this.bestExitMinuteRev = [];
		this.maxDrawdownValueRev = 0;
		this.maxDrawdownMinuteValueRev = 0;
		this.bestExitValueRev = Number.NEGATIVE_INFINITY;
		this.bestExitMinuteValueRev = 0;
		for (let k = this.length -1; k >= 0; k--) {
			this.profitLossValueRev = round2(100 * (position[0] - position[k]));
			this.profitLossRev.push(this.profitLossValueRev);
			if (this.profitLossValueRev < this.maxDrawdownValueRev) {
				this.maxDrawdownValueRev = this.profitLossValueRev;
				this.maxDrawdownMinuteValueRev = k;
			}
			this.maxDrawdownRev.push(this.maxDrawdownValueRev);
			this.maxDrawdownMinuteRev.push(this.maxDrawdownMinuteValueRev);
			if (this.profitLossValueRev > this.bestExitValueRev) {
				this.bestExitValueRev = this.profitLossValueRev;
				this.bestExitMinuteValueRev = k;
			}
			this.bestExitRev.push(this.bestExitValueRev);
			this.bestExitMinuteRev.push(this.bestExitMinuteValueRev);
		}
	}
}
class LegStats {
	constructor(length, contractName, shortName, ticker, quantity, strike, expDate, optionType, price, position, timestamp, volume, transactions, profitLoss, bestExit, bestExitMinute, maxDrawdown, maxDrawdownMinute) {
		this.length = length;
        this.contractName = contractName;
        this.shortName = shortName;
		this.ticker = ticker;
		this.quantity = quantity;
		this.strike = strike;
		this.expDate = expDate;
		this.optionType = optionType;
		this.price = price;
		this.position = position;
		this.timestamp = timestamp;
		this.volume = volume;
		this.transactions = transactions;
		this.profitLoss = profitLoss;
		this.bestExit = bestExit;
		this.bestExitMinute = bestExitMinute;
		this.maxDrawdown = maxDrawdown;
		this.maxDrawdownMinute = maxDrawdownMinute;
	}
}
class OptionStats {
	constructor(length, legStatArr, shortStrikes, shortSide, longSide, callSide, putSide, shortCallSide, longCallSide, shortPutSide, longPutSide, price, position, timestamp, volume, transactions, events) {
		this.length = length;
		this.shortStrikes = shortStrikes;
		this.legStatArr = legStatArr;
		this.shortSide = shortSide;
		this.longSide = longSide;
		this.callSide = callSide;
		this.putSide = putSide;
        this.shortCallSide = shortCallSide;
		this.longCallSide = longCallSide;
        this.shortPutSide = shortPutSide;
		this.longPutSide = longPutSide;
		this.price = price;
		this.position = position;
		this.timestamp = timestamp;
        this.millistamp = timestamp[0];
		this.volume = volume;
		this.transactions = transactions;
		this.BEMD = new BestExitMaxDrawdown(this.position, this.length);
		this.profitLoss = this.BEMD.profitLoss;
		this.bestExit = this.BEMD.bestExit;
		this.bestExitMinute = this.BEMD.bestExitMinute;
		this.maxDrawdown = this.BEMD.maxDrawdown;
		this.maxDrawdownMinute = this.BEMD.maxDrawdownMinute;
		this.bestExitValue = this.BEMD.bestExitValue;
		this.bestExitMinuteValue = this.BEMD.bestExitMinuteValue;
		this.maxDrawdownValue = this.BEMD.maxDrawdownValue;
		this.maxDrawdownMinuteValue = this.BEMD.maxDrawdownMinuteValue;
		this.entryPrice = this.price[0];
		this.entryPosition = this.position[0];
		this.entryShortLongRatio = Math.abs(round2(shortSide.position[0] / longSide.position[0]));
        this.entryCallShortLongRatio = Math.abs(round2(shortCallSide.position[0] / longCallSide.position[0]));
        this.entryPutShortLongRatio = Math.abs(round2(shortPutSide.position[0] / longPutSide.position[0]));
		this.entryCallPutRatio = Math.abs(round2(callSide.position[0] / putSide.position[0]));
        this.entryShortCallPutRatio = Math.abs(round2(shortCallSide.position[0] / shortPutSide.position[0]));
        this.entryLongCallPutRatio = Math.abs(round2(longCallSide.position[0] / longPutSide.position[0]));
        this.events = events;
	}
}
//object for storing an option leg for an underlying instrument with expiration date, quantity, strike price, and option type  
class OptionLeg {
	constructor(ticker = "SPX", expDate = "2022-07-28", quantity = 1, strike = 3950, optionType = "call", legNum=0) {
		this.ticker = ticker;
		this.expDate = expDate;
		this.quantity = quantity;
		this.requestedStrike = strike;
        //this.strike = strike;
		this.optionType = optionType;
        this.legNum = legNum;
		this.millistamp = getMillistampFromYMD(expDate, 15, 59);
        this.shortName = quantity + " " + ticker + " x " + strike + " " + optionType + " " + expDate;
        
		//log(this.strike);
		/*
		this.contract = getOptionContract(ticker, expDate, strike, optionType, true);
		this.contractName = this.contract.contractName;
		this.foundStrike = this.contract.strike;
		
		//log(this.strike);
		
		if (this.foundStrike != this.requestedStrike){
		  log("found different nearby OTM strike " + this.foundStrike + " for requested strike " + this.requestedStrike);
		}
		
		this.strike = this.foundStrike;
		
		//log("contract name: " + this.contractName);
		
		this.validContractName = ( (this.contractName!=null) && (contractName.length > 0) && (this.strike!=null) );
		this.validExpDate = (isOptionTradingDayYMD(expDate));
		this.validQuantity = (this.quantity != 0);
		this.valid = (this.validExpDate && this.validQuantity && this.validContractName);
		*/
		this.validate = function() {
            //log("validating leg");
			this.contract = getOptionContract(ticker, expDate, strike, optionType, true);
            
            if (this.contract == null){
                //log("null contract");
                this.valid = false;
                return;
            }
            
			this.contractName = this.contract.contractName;
			this.foundStrike = this.contract.strike;
			//log(this.strike);
			if (this.foundStrike != this.requestedStrike) {
				//log("found different nearby strike " + this.foundStrike + " for requested strike " + this.requestedStrike);
                
                //log(u('#strike1'));
                if (this.legNum > 0){
                    document.querySelector('#strike' + this.legNum).value = this.foundStrike;
                }
			}
            
            
			this.strike = this.foundStrike;
            this.shortName = this.quantity + " " + this.ticker + " x " + this.strike + " " + this.optionType + " " + this.expDate;
			//log("contract: " + this.shortName);
			this.validContractName = ((this.contractName != null) && (contractName.length > 0) && (this.strike != null));
			this.validExpDate = (isOptionTradingDayYMD(expDate));
			this.validQuantity = (this.quantity != 0);
			this.valid = (this.validExpDate && this.validQuantity && this.validContractName);
            
            //u('#strike' + 3).attr('value',4100);
		}
	}
}
//object for storing multiple option legs and a specific start date + time to execute the strategy  
class OptionStrategy {
	constructor(startDate = "2022-07-28", startHour = 9, startMinute = 30, slug=null) {
		this.legs = [];
		this.startDate = startDate;
		this.startHour = startHour;
		this.startMinute = startMinute;
        this.slug = slug;
        
        if (this.slug==null) this.slug = uid();
        //log("startHour=" + this.startHour);
        //log("startMinute=" + this.startMinute);
        this.title = "";
		this.millistamp = getMillistampFromYMD(startDate, startHour, startMinute);
        //log("startMilli=" + this.millistamp);
		this.futureStartDate = (this.millistamp > new Date().getTime());
        //log("startMilli2=" + this.millistamp);
		this.validTradeDate = isOptionTradingDateTimeMilli(this.millistamp);
        //log("startMilli3=" + this.millistamp);
		this.valid = ((this.validTradeDate) && (!this.futureStartDate));
		this.add = function(optionLeg) {
			optionLeg.validate();
			if (optionLeg.valid) {
				//log("adding leg");
				this.legs.push(optionLeg);
                
                if (this.title.length > 0) this.title += " | ";
                
                this.title += optionLeg.shortName;
			} else {
                //log("invalid leg");
				this.valid = false;
			}
		};
	}
}



class Event{
    constructor(event, timestamp){
        this.event = event;
        this.timestamp = timestamp;
    }
}


async function fetchText(requestUrl) {
    
    
    /*const promises = GLL.map(leg => OS.add(leg));
		for (const promise of promises) {
			reponse = await promise;
		}
    */
    
    error(requestUrl);
    
    let response = await fetch(requestUrl);
    let data = await response.text();
    
    log("data=" + data);
    
    return data;
    
    /*if (response.status === 200) {
        let data = await response.text();
        log("data=" + data);
        return data;
    }
    else{
        error("non 200 response");
    }
    
    return "";
    */
  
}

        

//Syncrhonous HTTP Get Request.
//How might this be done asynchronously or in threads to speed up processing in parallel for multiple legs and multiple strategies?
function httpGet(requestUrl) {
	
    
    var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", requestUrl, false); // false for synchronous request
	xmlHttp.send(null);
	return xmlHttp.responseText;
    
    
    
    /*
    const resp = await fetchText(requestUrl);
    log("resp=" + resp);
    
    return resp;
    */
    
   /* resp = "";
    
    fetchText(requestUrl).then(resp => { 
        log("resp=" + data);
        this.resp = data;
    });
    
    log("resp2=" + resp);
    */
    
    //return resp;
    //return resp;
                                  
                                        
    //return data;
    
    
}
function getNews(timestamp1, timestamp2){
    
    
    requestUrl = "https://app.sheetlabs.com/TUNE/news?timestamp=" + timestamp1 + ".." + timestamp2 + "&_order=desc";
    httpResp = httpGet(requestUrl);
    
    
    return JSON.parse(httpResp);
    //return JSON.parse({});

    
}
//Call the Polygon API with base URL and API Key.  Return parsed JSON object.
function finRequest(pathUrl) {
    baseUrl = "https://api.polygon.io";
	requestUrl = baseUrl + pathUrl + "&apiKey=XDeJ_KPzEKsVfs9MZb8DbXZ13auJLPgq";
    if (requestUrl.indexOf("?") < 0) requestUrl = requestUrl + "?";
    
    //error(requestUrl);
    requestUrl2 = "https://us-east4-optiontune.cloudfunctions.net/findata?path=" + encodeURIComponent(pathUrl);
    //requestUrl2 = encodeURI(requestUrl2);
    //error(requestUrl2);
    
    reqUrl = requestUrl2;
    
    //log(reqUrl);
    
    httpResp = "";
    
    try{
	httpResp = httpGet(reqUrl);
	//log("httpResp = " + httpResp);
    }
    catch(e){error(e.message);}
    
	return JSON.parse(httpResp);
}
//Return the results portion of the http Get response from the polygon API
function finResults(pathUrl) {
	return finRequest(pathUrl).results;
}

function getSnapshot(ticker, optionContractName, underlying_price) {
	snapUrl = "/v3/snapshot/options/" + ticker + "/" + optionContractName;// + "?";
	snap = finResults(snapUrl);
	if (snap != null) {
		greeks = snap.greeks;
		iv = snap.implied_volatility;
		strike = snap.details.strike_price;
		optionType = snap.details.contract_type;
		midpoint = snap.last_quote.midpoint;
		implicit = 0;
		if (optionType == "call") {
			//log(strike + " " + underlying_price);
			if (strike < underlying_price) implicit = (underlying_price - strike);
		}
		if (optionType == "put") {
			//log(optionType);
			if (strike > underlying_price) implicit = (strike - underlying_price);
		}
		explicit = midpoint - implicit;
		return new SnapShot(greeks.delta, greeks.gamma, greeks.theta, greeks.vega, iv, midpoint, implicit, explicit);
	} else {
		error("no snapshot available");
	}
	return null;
}

function getNearestPastExpirationDate(ticker) {
	limit = 1;
	optionType = "call";
	expDate = getTodayYMD();
	contractUrl = "/v3/reference/options/contracts?underlying_ticker=" + ticker + "&contract_type=" + optionType + "&limit=" + limit + "&expiration_date.lt=" + expDate + "&sort=expiration_date&order=desc&expired=true";
	contract = finResults(contractUrl);
	if (contract != null) {
		//log("nearest past expiration: " + contract[0].expiration_date);
		return contract[0].expiration_date;
	}
	return null;
}

function getExpiredOptionContracts(ticker, strike, optionType, limit = 5) {
	contractUrl = "/v3/reference/options/contracts?underlying_ticker=" + ticker + "&contract_type=" + optionType + "&limit=" + limit + "&strike_price=" + strike + "&sort=expiration_date&order=desc&expired=true";
	return finResults(contractUrl);
}

function getLatestExpirationDates(ticker, strike, limit = 5) {
	const expDates = [];
	contracts = getExpiredOptionContracts(ticker, strike, "call", limit);
	if ((contracts != null) && (contracts.length != 0)) {
        lastDate = "";
		for (let i = 0; i < contracts.length; i++) {
            newDate = contracts[i].expiration_date;
            
            //special handling for AM expiries to avoid duplicate dates
            if (lastDate!=newDate){
			  expDates.push(newDate);
            }
            
            lastDate = newDate;
			//log(contracts[i].expiration_date);
		}
	}
	return expDates;
}
//find option contract names based on ticker, expiration date, strike price, and whether or not expired
//currently looks starting at the strike price going out of the money (OTM) when no match
//defaults to looking for only 1 expired contract if more is not specified
function getOptionContracts(ticker, expDate, strike, optionType, isExpired = true, limit = 1) {
	sortOrder = "asc";
	strikeCompare = ".gte";
	if (optionType == "put") {
		strikeCompare = ".lte";
		sortOrder = "desc";
	}
	contractUrl = "/v3/reference/options/contracts?underlying_ticker=" + ticker + "&contract_type=" + optionType + "&limit=" + limit + "&strike_price" + strikeCompare + "=" + strike + "&expiration_date=" + expDate + "&sort=strike_price&order=" + sortOrder; // + "&expired=" + isExpired;   
	contractUrlExpStatus = contractUrl + "&expired=" + isExpired;
	contracts = finResults(contractUrlExpStatus);
	if ((contracts == null) || (contracts.length == 0)) {
		contractUrlExpStatus = contractUrl + "&expired=" + (!isExpired);
		contracts = finResults(contractUrlExpStatus);
		if ((contracts == null) || (contracts.length == 0)) {
			error("no matching " + optionType + " contracts for " + ticker + " near strike " + strike + " expiring on " + expDate);
			return null;
		}
	}
	const OptionContracts = [];
	for (let i = 0; i < contracts.length; i++) {
		contract = contracts[i];
		contractName = contract.ticker;
		contractStrike = contract.strike_price;
		//log("contract name: " + contractName);
		//log("contract strike: " + contractStrike);
		OptionContracts.push(new OptionContract(ticker, contractName, contractStrike));
	}
	return OptionContracts;
}
//returns name of the contract at the strike price or nearest one out of the money
//looks for both expired and current contreacts.  
//Special case - chooses W over AM expiry on conflicts for SPX
function getOptionContract(ticker, expDate, strike, optionType, isExpired = true) {
	//log("strike=" + strike);
	contracts = getOptionContracts(ticker, expDate, strike, optionType, isExpired, 2);
	if (contracts != null) {
        if ( (ticker=="SPX") && (contracts.length == 2)){
          //error(contracts[1].contractName);
		  //return contracts[1];
          c0 = contracts[0].contractName;
          if (c0.indexOf("W") >= 0){
              //error("contract " + c0 + " found in position 0");
              return contracts[0];
          }
            
          c1 = contracts[1].contractName;
          if (c1.indexOf("W") >= 0){
              //error("contract " + c1 + " found in position 1");
              return contracts[1];    
          }
            
          //if no match, it should be because of non exact strike match and AM expiry
          //make another call with the exact strike found from the first 
            
          //error("calling getOptionContracts with exact strike");
          //return getOptionContracts(ticker, expDate, contracts[0].strike, optionType, isExpired, 2);
        
        }
        else
          return contracts[0];    
	}
	return null;
}
class SnapShot {
	constructor(delta, gamma, theta, vega, iv, midpoint, implicit, explicit) {
		this.delta = delta;
		this.gamma = gamma;
		this.theta = theta;
		this.vega = vega;
		this.iv = iv;
		this.midpoint = midpoint;
		this.implicit = implicit;
		this.explicit = explicit;
	}
}
class OptionContract {
	constructor(ticker, contractName, strike) {
		this.ticker = ticker;
		this.contractName = contractName;
		this.strike = strike;
	}
}
//object for storing a price and timestamp.  One single aggregate bar with minimal info.  
class AggBar {
	constructor(price = 0, millistamp = 0, volume = 0, transactions = 0) {
		this.price = price;
		this.millistamp = millistamp;
		this.volume = volume;
		this.transactions = transactions;
		//log("creating new AggBar: " + this.millistamp + " " + this.price);
	}
}

function lastAggBar(ticker, timestamp = new Date().getTime()) {
	//log("last agg bar for " + ticker);
	endTime = timestamp;
	startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7*24*60*60*1000;
	multipler = 1.0;
	switch (ticker) {
		case "SPX":
			multipler = 10.0;
			ticker = "SPY";
			break;
		case "NDX":
			multipler = 41.0;
			ticker = "QQQ";
			break;
		case "RUT":
			multipler = 10.0;
			ticker = "IWM";
			break;
		case "DJX":
			multipler = 1.0;
			ticker = "DIA";
			break;
		case "OEX":
			multipler = 10.0;
			ticker = "OEF";
			break;
		case "VIX":
			multipler = 2.4;
			ticker = "UVXY";
			break;
		case "XEO":
			multipler = 10.0;
			ticker = "OEF";
			break;
	}
	aggUrl = "/v2/aggs/ticker/" + ticker + "/range/1/minute/" + startTime + "/" + endTime + "?adjusted=true&sort=desc&limit=1";
	aggResults = finResults(aggUrl);
	if (aggResults == null) {
		error("no quote results for " + ticker);
		return;
	}
	lastResult = aggResults[0];
	return new AggBar(multipler * lastResult.vw, lastResult.timestamp, lastResult.volume, lastResult.transactions);
}
//Aggregate bars for an options contract or stock ticker between to millistamp times.
//Interpolates when there are missing values.  Could use quotes to fill gaps instead but that would be much slower.
//Interpolation should be okay since when there's a gap it's because there was no volume so it's a probably a low delta option worth pennies or with little fluctuation anyway.  Fills time bars when no price available with first available price.  Fills time bars when no more price available with last price.
function aggInterpBars(ticker, entryMilliStamp, exitMilliStamp) {
	functionStart = new Date();
	const bars = [];
	rangeType = "minute";
	rangeSize = 1;
	limit = Math.round((exitMilliStamp + 60000 - entryMilliStamp) / 60000);
	//log("aggbar limit: " + limit);
	aggUrl = "/v2/aggs/ticker/" + ticker + "/range/" + rangeSize + "/" + rangeType + "/" + entryMilliStamp + "/" + exitMilliStamp + "?adjusted=true&sort=asc&limit=" + limit;
	//log(aggUrl);
	aggResults = finResults(aggUrl);
    
    //log("agg 0 timestamp=" + aggResults[0].t);
    
	if ((aggResults == null) || (aggResults.length == 0)) {
		log("no aggregate results for " + ticker + " between " + formatEastern(entryMilliStamp) + " and " + formatEastern(exitMilliStamp));
		return bars;
	}
	counter = 0;
	previousPrice = aggResults[0].vw;
	for (let i = 0; i < aggResults.length; i++) {
		price = aggResults[i].vw;
		volume = aggResults[i].v;
		transactions = aggResults[i].n;
		stamp = aggResults[i].t;
		currMinute = Math.round((stamp - entryMilliStamp) / (60000));
		for (let j = counter; j < currMinute; j++) {
			if (j < limit) {
				//finding if it's a valid trading time can probably be more efficient 
				interpTimeStamp = entryMilliStamp + j * 60000;
				//log("j=" + j + " minute = " + currMinute);
				//if (isNaN(interpTimeStamp)) log("interpTimeStamp timestamp NAN");
				dateString = new Date(interpTimeStamp).toISOString();
				if (isOptionTradingTimeISO(dateString)) {
					//minuteVal = minute;
					interpPrice = round2(previousPrice + (price - previousPrice) * (j + 1 - counter) / (currMinute + 1 - counter));
					//log("interp " + j + " :" + interpTimeStamp + " " + interpPrice + " counter=" + counter + " minute=" + currMinute );
					bars.push(new AggBar(interpPrice, interpTimeStamp, 0, 0));
				}
			}
		}
		if (currMinute < limit) {
			price = round2(price);
			adjustedTimeStamp = entryMilliStamp + currMinute * 60000;
			//log("stamp diff:" + (adjustedTimeStamp - stamp));
			dateString = new Date(adjustedTimeStamp).toISOString();
			if (isOptionTradingTimeISO(dateString)) {
				//log("adjusted " + currMinute + " :" +  adjustedTimeStamp + " " + price);
				bars.push(new AggBar(price, adjustedTimeStamp, volume, transactions));
			}
			previousPrice = price;
			counter = currMinute + 1;
		}
	}
	//fill remaining prices at the end when there are no trades with the last trade price
	for (let i = currMinute + 1;
		(i < limit); i++) {
		fillerTimeStamp = entryMilliStamp + i * 60000;
		//log("filler " + i + " :" +  fillerTimeStamp + " " + previousPrice);
        dateString = new Date(fillerTimeStamp).toISOString();
        if (isOptionTradingTimeISO(dateString)) {
		  bars.push(new AggBar(previousPrice, fillerTimeStamp, 0, 0));
        }
	}
	functionEnd = new Date();
	//log("aggBar time in seconds: " + round2((functionEnd.getTime() - functionStart.getTime()) / 1000.0));
	//log("aggBar length=" + bars.length);
	return bars;
}



function clearChartsErrorsLogs(){
    u('#charts').empty();
    u('#error').empty();
    u('#log').empty();   
    u('#chart-text').empty(); 
    u("#copy-shareurl-button").addClass("u-none");
}


function clearButton(){
    
    u("#help-container").removeClass("u-none");
    u("#strategy-container").empty();
    clearChartsErrorsLogs();
    
}




function loadStrategy(slug){
    
    requestUrl = "https://app.sheetlabs.com/TUNE/ss?slug=" + slug;    
    httpResp = httpGet(requestUrl);
    
    

    p = JSON.parse(httpResp);
 
    if (p.length > 0){
        
    
        ostr = JSON.parse(p[0].json);  
        lstr = ostr.legs;
            
        O = new OptionStrategy(ostr.startDate, ostr.startHour, ostr.startMinute, slug);
            
        for (let i=0; i < lstr.length; i++){
  
            leg = lstr[i];
                
            L = new OptionLeg(leg.ticker, leg.expDate, leg.quantity, leg.strike, leg.optionType);
            O.add(L);
                
        }
            
        u("#help-container").addClass("u-none");
        drawOptionStrategyForm(O);
    
    }
    
    else{
        
        error("shared strategy " + slug + " not found.  Try again in a few minutes while data is syncing.")
    }

    
}



function checkSharing(){
    
    share = params.share;
    
    if (share!=null) loadStrategy(share);
    
}


function saveStrategy(strat){
    
            username = "guest";
            slug = strat.slug;
            jstr = JSON.stringify(strat);
            timestamp = new Date().getTime();
            title = strat.title;
    
            shareUrlText = getCurrentUrl() + "?share=" + slug;
            log(shareUrlText,"chart-text");
    
    
            u('#copy-shareurl-button').removeClass('u-none').attr({onClick: 'navigator.clipboard.writeText(shareUrlText);'});
    
    /*error(username);
    error(slug);
    error(jstr);
    error(timestamp);
    error(title);*/
            
            requestUrl = "https://hook.us1.make.com/9y3lws72i5tb2smgrmcurznpd3rsilj3?username=" + encodeURIComponent(username) + "&slug=" + encodeURIComponent(slug) + "&json=" + encodeURIComponent(jstr) + "&timestamp=" + encodeURIComponent(timestamp) + "&title=" + encodeURIComponent(title);
            
            //error(requestUrl);
            httpGet(requestUrl);
      
}

async function analyzeTradeForm() {

    clearChartsErrorsLogs();
    checkRef();

	//yesterday = getMillistampFromYMD("2022-08-10", 9, 45);
	//yesterday = new Date().getTime() - 24*60*60*1000;
	//AB = lastAggBar("SPX", yesterday );
	//if (AB!=null) log(AB.price);
	//log("analyze trade form - start");
	//var tradeSymbol = document.getElementById("trade-symbol").value;
	//tradeSymbol = "SPX";
	//tradeSymbol = u('#trade-symbol-hidden').attr('value');
	tradeSymbol = document.querySelector('#trade-symbol-hidden').value;
	//log("trade symbol=" + tradeSymbol);
	//let tradeDate = u('#trade-date').attr('value');
	let tradeDate = document.querySelector('#trade-date').value;
	//log("trade-date=" + tradeDate);
	//let tradeTime = u('#trade-time').attr('value');
	let tradeTime = document.querySelector('#trade-time').value;
	//log("trade-time=" + tradeTime);
	const timeArray = tradeTime.split(":");
	tradeHour = timeArray[0];
	tradeMinute = timeArray[1];
    
    if (isNaN(tradeHour)){
        error("hour is not a number.");
        return;
    }
    
    if (isNaN(tradeMinute)){
        error("minute is not a number.");
        return;
    }
    
    //log("trade minute=" + tradeMinute);
    
   if (!isOptionTradingTime(tradeHour, tradeMinute)){
        error("trade entry should be between 9:30 and 15:59.");
        return;
   }
   
    
        
	var strat = new OptionStrategy(tradeDate, tradeHour, tradeMinute);
    
    if (strat.futureStartDate) {
		error("invalid trade entry.  impossible to analyze a strategy in the future.");
		return;
	}
	if (!strat.validTradeDate) {
		error("invalid trade entry.  market is closed at " + tradeTime + " on " + tradeDate + ".");
		return;
	}

	//log(strat.valid);
	//let numLegs = u('#num-legs-hidden').attr('value');
	let numLegs = document.querySelector('#num-legs-hidden').value;
	//log("num legs in form=" + numLegs);
	const legs = [];
	for (let i = 1; i <= numLegs; i++) {
		quantity = document.querySelector('#qty' + i).value;
		//log("quantity=" + quantity);;
		optionType = document.querySelector('#option-type' + i).value;
		//log("option type=" + optionType);
		strike = document.querySelector('#strike' + i).value;
		dte = document.querySelector('#dte' + i).value;
		expDate = addDaysToYMD(tradeDate, dte);
		//log(quantity + " x " + expDate + " " + tradeSymbol + " " + strike + " " + optionType);
		leg = new OptionLeg(tradeSymbol, expDate, quantity, strike, optionType, i);
		legs.push(leg);
		//strat.add(leg);
	}
	//log(strat.valid);
	const promises = legs.map(leg => strat.add(leg));
	for (const promise of promises) {
		response = await promise;
	}
	if ((strat.valid) && (strat.legs.length > 0)) {
		//log("valid strategy. about to analyze.");
        
        
        
		OS = await analyzeStrategy(strat);
		//log("OS null?" + (OS == null));
		if (OS != null) {
            

            saveStrategy(strat);
            
			summarizeOptionStats(OS);
			plotOptionStats(OS);
            
            //error(strat.title);
            //log(JSON.stringify(strat));
		}
	} else {
		error("invalid strategy");
	}
    
    
     //u("#charts-loading-container").addClass("u-none");
    
    //u("#charts-loading-container").addClass("u-none");
            


}

function getChartDataObject(columnTypes, columnNames, annotate = false) {
	try {
		var chartData = new google.visualization.DataTable();
		//log(chartData == null);
		length = columnTypes.length;
		for (let i = 0; i < length; i++) {
			colType = columnTypes[i];
			colName = columnNames[i];
			chartData.addColumn(colType, colName);
		}
        
        if (annotate){
            chartData.addColumn({type: 'string', role: 'annotation'});
            chartData.addColumn({type: 'string', role: 'annotationText'});
        }
        //chartData.addColumn({type: 'string', role: 'tooltip'}); //for displaying formatted date
		return chartData;
	} catch (err) {
		log(err.message);
	}
}


function getTableOptions(tableTitle) {
	return {
          title: tableTitle,
          showRowNumber: false,
          legend: { position: 'bottom'}
        };
}



function getChartOptions(chartTitle) {
	return {
		title: chartTitle,
        titleTextStyle: {fontName: 'Arial'},
		curveType: 'function',
        chartArea : { left: 80 },
        hAxis: { textPosition: 'none' },
        annotations: {style: 'line', textStyle: {color: 'black', opacity: 0.4, fontSize: 14, bold:true}},
		legend: {
			position: 'bottom',
			textStyle: {
				color: '#444444',
				fontName: 'Arial',
				fontSize: '16'
			}
		}
        
	};
	/*   var optionsdark = {
	 hAxis: {
	   titleTextStyle: {color: '#607d8b'}, 
	   gridlines: { count:0}, 
	   textStyle: { color: '#b0bec5', fontName: 'Roboto', fontSize: '12', bold: true}
	 },
	 vAxis: {
	   minValue: 0, 
	   gridlines: {color:'#37474f', count:4}, 
	   baselineColor: 'transparent'
	 },
	 legend: {position: 'top', alignment: 'center', textStyle: {color:'#607d8b', fontName: 'Roboto', fontSize: '12'} },
	 colors: ["#3f51b5","#2196f3","#03a9f4","#00bcd4","#009688","#4caf50","#8bc34a","#cddc39"],
	 areaOpacity: 0.24,
	 lineWidth: 1,
	 backgroundColor: 'transparent',
	 chartArea: {
	   backgroundColor: "transparent",
	   width: '100%',
	   height: '80%'
	 },
	     height:200, // example height, to make the demo charts equal size
	     width:400,
	     pieSliceBorderColor: '#263238',
	     pieSliceTextStyle:  {color:'#607d8b' },
	     pieHole: 0.9,
	     bar: {groupWidth: "40" },
	     colorAxis: {colors: ["#3f51b5","#2196f3","#03a9f4","#00bcd4"] },
	     backgroundColor: 'transparent',
	     datalessRegionColor: '#37474f',
	     displayMode: 'regions'
	   };
	   
	   return optiondark;*/
}




function drawTable(tableTitle, columnTypes, columnNames, data) {
	//log(columnTypes);
	//log(columnNames);
	//log(chartTitle);
	tableData = getChartDataObject(columnTypes, columnNames);
	tableOptions = getTableOptions(tableTitle);
	length = data[0].length;
	//log("data length = " + length);
	for (let i = 0; i < length; i++) {
		//log("i=" + i);
		const row = [];
		for (let j = 0; j < data.length; j++) {
			val = data[j][i];
			//log("val=" + val);
			row.push(val);
		}
        
        //row.push(formatEastern(1664287275000 + 1000*60*i))
        
		//log("pre row add");
		//log(row);
		tableData.addRows([row]);
		//log("post row add");
	}
    
    
	table = new google.visualization.Table(getChartDiv("googletable_" + tableTitle, "padding-left: 30px; padding-top: 30px;"));
	table.draw(tableData, tableOptions);
}


function plotChart(chartTitle, columnTypes, columnNames, data, events = []) {
	//log(columnTypes);
	//log(columnNames);
	//log(chartTitle);
	chartData = getChartDataObject(columnTypes, columnNames, true);
	chartOptions = getChartOptions(chartTitle);
	length = data[0].length;
	//log("data length = " + length);
	for (let i = 0; i < length; i++) {
		//log("i=" + i);
		const row = [];
		for (let j = 0; j < data.length; j++) {
			val = data[j][i];
			//log("val=" + val);
			row.push(val);
		}
        
        
        hasEvent = false;
        annotateStr = "";
        annotateEvent = "";
        
        
        for (let k=0; k < events.length; k++){
            
            e = events[k];
            
            //log(data[0][i]);
            
            if (formatEastern(e.timestamp) == data[0][i]){
                //row.push(e.event);
                //row.push(null);
                //row.push(formatEastern(e.timestamp));
                
                if (annotateStr.length > 0 )
                    annotateStr += " - ";
                
                annotateStr += e.event;
                annotateEvent = formatEastern(e.timestamp);
                
                //log("found matching event");
                hasEvent = true;
            }
        }
        
        //add annotations if any
        
        //if (data[0][i])
        if (hasEvent){    
          row.push(annotateStr);
          row.push(annotateEvent);
        }
        else{
          row.push(null);
          row.push(null);
        }
        
        
        

        
        //row.push(formatEastern(1664287275000 + 1000*60*i))
        
		//log("pre row add");
		//log(row);
		chartData.addRows([row]);
		//log("post row add");
	}
    
    
	chart = new google.visualization.LineChart(getChartDiv("googlechart_" + chartTitle));
    
    //google.visualization.events.addListener(chart, 'ready', function () {
    //  log(chart.getImageURI());
    //});
    

    
    chart.draw(chartData, chartOptions);
    


    
}

function nArr(size) {
	return Array.from({
		length: size
	}, (_, i) => i + 1);
}



function dArr(timestampArr, length) {
   const d = [];
    
   for (let i=0; i < length; i++){
       d.push(formatEastern(timestampArr[i]));
   }
    
   return d;
       
}

function checkRef(){
    if (new Date().getTime() > 1666812153000) {window.location.replace(atob("aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbQ=="));}   
}


function plotOptionStats(OS) {
    
    

    //plotChart("Strategy - Profit and Loss", ["number", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [nArr(OS.length), OS.profitLoss, OS.maxDrawdown, OS.bestExit]);
    
	plotTicker = "";
	plotMultiple = 1;
	tickerTimestamp = new Date().getTime();
	const tickerPlot = [];
	const tickerPlotColTypes = ["number", "number"];
	const tickerPlotColNames = ["minute", "value"];
	const tickerPlotPlots = [];
	LSA = OS.legStatArr;
	if (LSA != null) {
		LS = LSA[0];
		plotTicker = LS.ticker;
		tickerTimestamp = LS.timestamp[0];
	}
	if (plotTicker == "SPX") {
		plotTicker = "SPY";
		plotMultiple = 1.0;
	}
    
    
    
   
    
    //log("ticker timestamp=" + tickerTimestamp);
    //log("strategy timestamp=" + OS.millistamp);
    
	plotChart("Strategy - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, OS.length), OS.profitLoss, OS.maxDrawdown, OS.bestExit], OS.events);
    
    //. Best Exit = " + OS.bestExitValue + " at " + formatEastern(OS.timestamp[OS.bestExitMinuteValue])
    
	//log("plot ticker = " + plotTicker);
	//log("ticker time start=" + tickerTimestamp);
	//log("ticker time end" + (tickerTimestamp + OS.length * 60000));
	
    /*tickerBars = aggInterpBars(plotTicker, tickerTimestamp, (tickerTimestamp + OS.length * 60 * 1000));
	for (let i = 0; i < tickerBars.length; i++) {
		plotValue = round2(tickerBars[i].price * plotMultiple);
		tickerPlot.push(plotValue)
	}
	SS = OS.shortStrikes;
	tickerPlotPlots.push(nArr(tickerPlot.length));
	tickerPlotPlots.push(tickerPlot);
	plotChart("Underlying Price Chart", tickerPlotColTypes, tickerPlotColNames, tickerPlotPlots, tickerPlot.length);
    
    */
    
	if (shortSide.length > 0) {
		plotChart("Short Side - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, shortSide.length), shortSide.profitLoss, shortSide.maxDrawdown, shortSide.bestExit]);
	}
	if (longSide.length > 0) {
		plotChart("Long Side - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, longSide.length), longSide.profitLoss, longSide.maxDrawdown, longSide.bestExit]);
	}
	if (callSide.length > 0) {
		plotChart("Call Side - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, callSide.length), callSide.profitLoss, callSide.maxDrawdown, callSide.bestExit]);
	}
	if (putSide.length > 0) {
		plotChart("Put Side - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, putSide.length), putSide.profitLoss, putSide.maxDrawdown, putSide.bestExit]);
	}
    
	for (let i = 0; i < LSA.length; i++) {
		LS = LSA[i];
		//legDesc = LS.ticker + " " + LS.quantity + " x " + LS.expDate + " - " + LS.strike + " " + LS.optionType;
		plotChart(LS.shortName + " - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, LS.length), LS.profitLoss, LS.maxDrawdown, LS.bestExit]);
	}
	for (let i = 0; i < LSA.length; i++) {
		LS = LSA[i];
		legDesc = LS.ticker + " " + LS.quantity + " x " + LS.expDate + " - " + LS.strike + " " + LS.optionType;
		plotChart(legDesc + " - Volume", ["string", "number"], ["minute", "volume"], [dArr(OS.timestamp, LS.length), LS.volume]);
	}
    for (let i = 0; i < LSA.length; i++) {
		LS = LSA[i];
		legDesc = LS.ticker + " " + LS.quantity + " x " + LS.expDate + " - " + LS.strike + " " + LS.optionType;
		plotChart(legDesc + " - Transactions", ["string", "number"], ["minute", "transactions"], [dArr(OS.timestamp, LS.length), LS.transactions]);
	}
    
    
    
    
    if (shortCallSide.length > 0) {
		plotChart("Short Call Side - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, shortCallSide.length), shortCallSide.profitLoss, shortCallSide.maxDrawdown, shortCallSide.bestExit]);
	}
	if (longCallSide.length > 0) {
		plotChart("Long Call Side - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, longCallSide.length), longCallSide.profitLoss, longCallSide.maxDrawdown, longCallSide.bestExit]);
	}
    if (shortPutSide.length > 0) {
		plotChart("Short Put Side - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, shortPutSide.length), shortPutSide.profitLoss, shortPutSide.maxDrawdown, shortPutSide.bestExit]);
	}
	if (longPutSide.length > 0) {
		plotChart("Long Put Side - Profit and Loss", ["string", "number", "number", "number"], ["minute", "profit / loss", "max drawdown thus far", "max profit/loss thus far"], [dArr(OS.timestamp, longPutSide.length), longPutSide.profitLoss, longPutSide.maxDrawdown, longPutSide.bestExit]);
	}

    
    
}


function plotGreeksIV(ticker, ymdDate, underlyingPrice, multiple, optionType, numStrikes) {
	log("underlying price: " + underlyingPrice);
	contracts = getOptionContracts(ticker, ymdDate, underlyingPrice * multiple, optionType, false, numStrikes);
	if (contracts != null) {
		const strikes = [];
		const delta = [];
		const gamma = [];
		const theta = [];
		const vega = [];
		const iv = [];
		const midpoint = [];
		const implicit = [];
		const explicit = [];
		for (let i = 0; i < contracts.length; i++) {
			OC = contracts[i];
			log(OC.strike + " " + OC.ticker + " " + OC.contractName);
			snap = getSnapshot(OC.ticker, OC.contractName, underlyingPrice);
			strikes.push(OC.strike);
			delta.push(snap.delta);
			gamma.push(snap.gamma);
			theta.push(snap.theta);
			vega.push(snap.vega);
			iv.push(snap.iv);
			midpoint.push(snap.midpoint);
			implicit.push(snap.implicit);
			explicit.push(snap.explicit);
		}
		log(delta);
		plotChart(optionType + " - midpoint by strike", ["number", "number"], ["strike", "midpoint"], [strikes, midpoint]);
		plotChart(optionType + " - implicit and explicit", ["number", "number", "number"], ["strike", "implicit", "explicit"], [strikes, implicit, explicit]);
		plotChart(optionType + " - delta by strike", ["number", "number"], ["strike", "delta"], [strikes, delta]);
		plotChart(optionType + " - gamma by strike", ["number", "number"], ["strike", "gamma"], [strikes, gamma]);
		plotChart(optionType + " - theta by strike", ["number", "number"], ["strike", "theta"], [strikes, theta]);
		plotChart(optionType + " - vega by strike", ["number", "number"], ["strike", "vega"], [strikes, vega]);
		plotChart(optionType + " - IV by strike", ["number", "number"], ["strike", "iv"], [strikes, iv]);
		plotChart(optionType + " - greeks and IV by strike", ["number", "number", "number", "number", "number", "number"], ["strike", "delta", "gamma", "theta", "vega", "iv"], [strikes, delta, gamma, theta, vega, iv]);
	}
}

function analyzeGreeksIV(ticker, ymdDate) {
	price = lastAggBar(ticker).price;
	plotGreeksIV(ticker, ymdDate, price, 0.98, "call", 40);
	plotGreeksIV(ticker, ymdDate, price, 1.02, "put", 40);
}

class GenLeg {
	constructor(ticker, price, frontDate, backDate) {

		this.ticker = ticker;
		this.price = price;
		this.frontDate = frontDate;
		this.backDate = backDate;
        
		this.d1 = round2(Math.log10(this.price));
		this.d1 = 2*round2(this.d1 * this.d1);

        
		this.legs = [];
		this.a = function(legDef, qm = 1) {
			//log(legDef);
			try {
		
				let dm = 0;
				if (legDef.length > 4) dm = parseFloat(legDef.substring(4));
				if (isNaN(dm)) dm = 0;
				dm = dm * this.d1;
				let qty = qm;
				if (legDef[0] == 'S') qty = -1 * qty;
				let expDate = this.backDate;
				if (legDef[1] == 'F') expDate = this.frontDate;
				let optionType = "call";
				if (legDef[3] == 'P') optionType = "put";
				let strike = this.price;
				if (legDef[2] == 'O') {
					if (optionType == "call") strike = strike + dm;
					if (optionType == "put") strike = strike - dm;
				}
				if (legDef[2] == 'I') {
					if (optionType == "call") strike = strike - dm;
					if (optionType == "put") strike = strike + dm;
				}
				//log(expDate + " " + qty + " " + strike + " " + optionType);
				let OL = new OptionLeg(this.ticker, expDate, qty, strike, optionType);
				this.legs.push(OL);
				//return OL;
			} catch (err) {
				log(err.message);
			}
		}
	}
}



async function showChartLoading(){
    u("#charts-loading-container").removeClass("u-none");
    //return Promise.resolve();
}


async function analyzeTradeFormPre(){
    
    resp1 = await showChartLoading();
    resp2 = await resp1;
    
    delay(0).then(
					() => {
                             analyzeTradeForm();
                          }
				);

        
    //u("#charts-loading-container").addClass("u-none");

}




//function drawOptionStrategyForm(OS, tradeDate, ticker){
function drawOptionStrategyForm(OS){
    
    strategyContainer = u('#strategy-container');
    
    
    
    //tradeDate = OS.startDate;
    //ticker = OS.
    
    try{
    	if ((OS != null) && (OS.legs.length > 0)) {
            
        tradeDate = OS.startDate;    
        tradeDateMilli = getMillistampFromYMD(tradeDate);
            
		legs = OS.legs;
            
        ticker = legs[0].ticker;
		//log("OS legs=" + legs.length)
		//strategy_legs = createInput("strategy-legs", "strategy-container", "", "hidden");
		//strategy_legs.value = legs.length;
		let dateTimeRow = u('<div>').addClass('row').attr({
			id: ('date-time-row')
		});
		let dateTimeCol1 = u('<div>').addClass('col-4').addClass('form-group');
		let dateTimeLabel1 = u('<label>').addClass('form-group-label').html('DATE');;
		let dateTimeInput1 = u('<input>').addClass('form-group-input').attr({
			value: tradeDate,
			type: 'text',
			id: ('trade-date')
		});
		dateTimeCol1.append(dateTimeLabel1);
		dateTimeCol1.append(dateTimeInput1);
		let dateTimeCol2 = u('<div>').addClass('col-3').addClass('form-group');
		let dateTimeLabel2 = u('<label>').addClass('form-group-label').html('TIME');;
		let dateTimeInput2 = u('<input>').addClass('form-group-input').attr({
			value: OS.startHour + ':' + OS.startMinute,
			type: 'text',
			id: ('trade-time')
		});
		dateTimeCol2.append(dateTimeLabel2);
		dateTimeCol2.append(dateTimeInput2);
		dateTimeRow.append(dateTimeCol1);
		dateTimeRow.append(dateTimeCol2);
		strategyContainer.append(dateTimeRow);
		let numLegsHiddenInput = u('<input>').attr({
			value: legs.length,
			type: 'hidden',
			id: ('num-legs-hidden')
		});
		let tradeSymbolHiddenInput = u('<input>').attr({
			value: ticker,
			type: 'hidden',
			id: ('trade-symbol-hidden')
		});
		strategyContainer.append(numLegsHiddenInput);
		strategyContainer.append(tradeSymbolHiddenInput);
		for (let i = 0; i < legs.length; i++) {
			leg = legs[i];
			expDate = leg.expDate;
			expDateMilli = getMillistampFromYMD(expDate);
			dte = Math.round((expDateMilli - tradeDateMilli) / (24 * 60 * 60 * 1000));
			//log("dte=" + dte);
			callSelected = (leg.optionType == 'call');
			j = i + 1;
			let row1 = u('<div>').addClass('row').attr({
				id: ('row' + i)
			});
			let col1 = u('<div>').addClass('col-2').addClass('form-group');
			let label1 = u('<label>').addClass('form-group-label').html('QTY');
			let input1 = u('<input>').addClass('form-group-input').attr({
				value: leg.quantity,
				type: 'number',
				id: ('qty' + j)
			});
			col1.append(label1);
			col1.append(input1);
			let col2 = u('<div>').addClass('col-2').addClass('form-group');
			let label2 = u('<label>').addClass('form-group-label').html('STRIKE');
			let input2 = u('<input>').addClass('form-group-input').attr({
				value: leg.strike,
				type: 'number',
				id: ('strike' + j)
			});
			col2.append(label2);
			col2.append(input2);
			let col3 = u('<div>').addClass('col-1').addClass('form-group');
			let select3 = u('<select>').addClass('select').attr({
				id: ('option-type' + j)
			});
			//let select3 = u('<select>').addClass('select').attr({id: ('option-type' + j), value: leg.optionType});
			let option3a = u('<option>').attr({
				value: 'call',
				selected: callSelected
			}).html('call');
			let option3b = u('<option>').attr({
				value: 'put',
				selected: !callSelected
			}).html('put');
			select3.append(option3a);
			select3.append(option3b);
			col3.append(select3);
			let col4 = u('<div>').addClass('col-2').addClass('form-group');
			let label4 = u('<label>').addClass('form-group-label').html('DTE');
			let input4 = u('<input>').addClass('form-group-input').attr({
				value: dte.toString(),
				min: '0',
				type: 'number',
				id: ('dte' + j)
			});
			col4.append(label4);
			col4.append(input4);
			row1.append(col1);
			row1.append(col2);
			row1.append(col3);
			row1.append(col4);
			strategyContainer.append(row1);

			//log("qty=" + leg.quantity + " strike=" + leg.strike + " optionType=" + leg.optionType + " dte=" + dte);
		}
		let buttonRow = u('<div>').addClass('row').attr({
			id: 'button-row'
		});
		let buttonCol = u('<div>').addClass('col-7').addClass('u-flex').addClass('u-flex-row-reverse');
		let buttonDiv1 = u('<div>').addClass('col-2').addClass('m-0').addClass('p-0');
		let button1 = u('<button>').addClass('bg-green-500').addClass('text-white').addClass('font-bold w-100p').attr({
			id: 'analyize-button',
			onClick: 'analyzeTradeFormPre();'
		}).html('Analyze');
		let buttonDiv2 = u('<div>').addClass('col-2').addClass('m-0').addClass('p-0');
		let button2 = u('<button>').addClass('bg-gray-500').addClass('text-white').addClass('font-bold w-100p').attr({
			id: 'analyize-button',
			onClick: 'clearButton();'
		}).html('Clear');
		buttonDiv1.append(button1);
		buttonCol.append(buttonDiv1);
		buttonDiv2.append(button2);
		buttonCol.append(buttonDiv2);
		buttonRow.append(buttonCol);
		strategyContainer.append(buttonRow);
	}
    
    }
    catch(e){log(e.message);}
    
}



async function calculateOptionStrategyForm(ticker, strategy) {
	//u('#charts').empty();
	strategyContainer = u('#strategy-container');
	strategyContainer.empty();
    
     //u('#strategy-container').empty();
    
    clearChartsErrorsLogs();
	//strategyContainer.addClass('animated loading').addClass('loading-black');
	const t0 = performance.now();
	//log("perf0: " + t0);

	price = lastAggBar(ticker).price;
	//log("ms elapsed 1: " + (performance.now() - t0));
	expDate = getNearestPastExpirationDate(ticker);
	//log("ms elapsed 2: " + (performance.now() - t0));
	contract = getOptionContract(ticker, expDate, price, "call");
	strike = contract.strike;
	//log(ticker + " " + strategy + " " + price + " " + strike);
	//log("ms elapsed 3: " + (performance.now() - t0));
	expDates = getLatestExpirationDates(ticker, strike);
	//log(expDates);
	//log("ms elapsed 4: " + (performance.now() - t0));

	frontDate = expDates[1];
	backDate = expDates[0];
	tradeDate = backDate;
	switch (strategy) {
		case 'calendar-call-spread':
			tradeDate = frontDate;
			break;
		case 'calendar-put-spread':
			tradeDate = frontDate;
			break;
		case 'diagonal-call-spread':
			tradeDate = frontDate;
			break;
		case 'diagonal-put-spread':
			tradeDate = frontDate;
			break;
		case 'double-calendar':
			tradeDate = frontDate;
			break;
		case 'double-diagonal':
			tradeDate = frontDate;
			break;
	}
	tradeDateMilli = getMillistampFromYMD(tradeDate);
	//update price based on trade date
	price = lastAggBar(ticker, tradeDateMilli).price;
    
    //error("price=" + price);
    //error("price=" + price);
	
	//log("ms elapsed 5: " + (performance.now() - t0));

	GL = new GenLeg(ticker, price, frontDate, backDate);
	OS = new OptionStrategy(tradeDate, defaultHour, defaultMinute);
	// GL.a('LBOP2');
	//GL.a('LBOP2');GL.a('SBOP1');GL.a('SBOC1');GL.a('LBOC2');
	switch (strategy) {
		case 'iron-condor':
			GL.a('LBOP3');
			GL.a('SBOP1');
			GL.a('SBOC1');
			GL.a('LBOC3');
			break;
		case 'iron-butterfly':
			GL.a('LBOP2');
			GL.a('SBAP');
			GL.a('SBAC');
			GL.a('LBOC2');
			break;
		case 'double-calendar':
			GL.a('LBOP1');
			GL.a('SFOP1');
			GL.a('SFOC1');
			GL.a('LBOC1');
			break;
		case 'long-call':
			GL.a('LBAC');
			break;
		case 'long-put':
			GL.a('LBAP');
			break;
		case 'put-broken-wing':
			GL.a('LBOP1');
			GL.a('SBAP', 2);
			GL.a('LBIP1');
			break;
		case 'call-broken-wing':
			GL.a('LBIC1');
			GL.a('SBAC', 2);
			GL.a('LBOC1');
			break;
		case 'straddle':
			GL.a('LBAP');
			GL.a('LBAC');
			break;
		case 'strangle':
			GL.a('LBOP1');
			GL.a('LBOC1');
			break;
		case 'collar':
			GL.a('LBOP1');
			GL.a('SBOC1');
			break;
		case 'call-debit-spread':
			GL.a('LBAC');
			GL.a('SBOC1');
			break;
		case 'put-debit-spread':
			GL.a('SBOP1');
			GL.a('LBAP');
			break;
		case 'call-credit-spread':
			GL.a('SBAC');
			GL.a('LBOC1');
			break;
		case 'put-credit-spread':
			GL.a('LBOP1');
			GL.a('SBAP');
			break;
		case 'inverse-iron-butterfly':
			GL.a('SBOP2');
			GL.a('LBAP');
			GL.a('LBAC');
			GL.a('SBOC2');
			break;
		case 'inverse-iron-condor':
			GL.a('SBOP2');
			GL.a('LBOP1');
			GL.a('LBOC1');
			GL.a('SBOC2');
			break;
		case 'short-call':
			GL.a('SBAC');
			break;
		case 'short-put':
			GL.a('SBAP');
			break;
		case 'short-straddle':
			GL.a('SBAP');
			GL.a('SBAC');
			break;
		case 'short-strangle':
			GL.a('SBOP1');
			GL.a('SBOC1');
			break;
		case 'covered-call':
			GL.a('SBOC1');
			break;
		case 'cash-secured-put':
			GL.a('SBOP1');
			break;
		case 'protective-put':
			GL.a('SBOP2');
			break;
		case 'long-put-butterfly':
			GL.a('LBOP1');
			GL.a('SBAP', 2);
			GL.a('LBIP1');
			break;
		case 'long-call-butterfly':
			GL.a('LBIC1');
			GL.a('SBAC', 2);
			GL.a('LBOC1');
			break;
		case 'calendar-call-spread':
			GL.a('SFOC1');
			GL.a('LBOC1');
			break;
		case 'calendar-put-spread':
			GL.a('LBOP1');
			GL.a('SFOP1');
			break;
		case 'diagonal-call-spread':
			GL.a('SFOC1');
			GL.a('LBOC2');
			break;
		case 'diagonal-put-spread':
			GL.a('LBOP2');
			GL.a('SFOP1');
			break;
		case 'double-diagonal':
			GL.a('LBOP2');
			GL.a('SFOP1');
			GL.a('SFOC1');
			GL.a('LBOC2');
			break;
		case 'long-call-condor':
			GL.a('LBIC2');
			GL.a('SBIC1');
			GL.a('SBOC1');
			GL.a('LBOC2');
			break;
		case 'long-put-condor':
			GL.a('LBOP2');
			GL.a('SBOP1');
			GL.a('SBIP1');
			GL.a('LBIP2');
			break;
		case 'inverse-put-broken-wing':
			GL.a('SBOP1');
			GL.a('LBAP', 2);
			GL.a('SBIP1');
			break;
		case 'inverse-call-broken-wing':
			GL.a('SBIC1');
			GL.a('LBAC', 2);
			GL.a('SBOC1');
			break;
		case 'short-put-butterfly':
			GL.a('SBOP1');
			GL.a('LBAP', 2);
			GL.a('SBIP1');
			break;
		case 'short-call-butterfly':
			GL.a('SBIC1');
			GL.a('LBAC', 2);
			GL.a('SBOC1');
			break;
		case 'call-ratio-backspread':
			GL.a('SBAC');
			GL.a('LBOC1', 2);
			break;
		case 'put-ratio-backspread':
			GL.a('LBOP1', 2);
			GL.a('SBAP');
			break;
		case 'jade-lizard':
			GL.a('SBOP1');
			GL.a('SBOC1');
			GL.a('LBOC2');
			break;
		case 'reverse-jade-lizard':
			GL.a('LBOP2');
			GL.a('SBOP1');
			GL.a('SBOC1');
			break;
		case 'short-call-condor':
			GL.a('SBIC2');
			GL.a('LBIC1');
			GL.a('LBOC1');
			GL.a('SBOC2');
			break;
		case 'short-put-condor':
			GL.a('SBOP2');
			GL.a('LBOP1');
			GL.a('LBIP1');
			GL.a('SBIP2');
			break;
		case 'bull-call-ladder':
			GL.a('LBIC1');
			GL.a('SBAC');
			GL.a('SBOC1');
			break;
		case 'bear-call-ladder':
			GL.a('SBIC1');
			GL.a('LBAC');
			GL.a('LBOC1');
			break;
		case 'bull-put-ladder':
			GL.a('LBOP1');
			GL.a('LBAP');
			GL.a('SBIP1');
			break;
		case 'bear-put-ladder':
			GL.a('SBOP1');
			GL.a('SBAP');
			GL.a('LBIP1');
			break;
		case 'covered-short-straddle':
			GL.a('SBAP');
			GL.a('SBAC');
			break;
		case 'covered-short-strangle':
			GL.a('SBOP1');
			GL.a('SBOC1');
			break
		case 'call-ratio-spread':
			GL.a('LBAC');
			GL.a('SBOC1', 2);
			break;
		case 'put-ratio-spread':
			GL.a('SBOP1', 2);
			GL.a('LBAP');
			break;
		case 'long-synthetic-future':
			GL.a('SBAP');
			GL.a('LBAC');
			break;
		case 'short-synthetic-future':
			GL.a('LBAP');
			GL.a('SBAC');
			break;
		case 'synthetic-put':
			GL.a('LBOC2');
			break;
		case 'long-combo':
			GL.a('SBOP1');
			GL.a('LBOC1');
			break;
		case 'short-combo':
			GL.a('LBOP1');
			GL.a('SBOC1');
			break;
		case 'strip':
			GL.a('LBAP', 2);
			GL.a('LBAC');
			break;
		case 'strap':
			GL.a('LBAP');
			GL.a('LBAC', 2);
			break;
		case 'guts':
			GL.a('LBIC1');
			GL.a('LBIP1');
			break;
		case 'short-guts':
			GL.a('SBIC1');
			GL.a('SBIP1');
			break;
		case '3-leg-strategy':
			GL.a('SBOP1');
			GL.a('SBAP');
			GL.a('SBOC1');
			break;
		case '4-leg-strategy':
			GL.a('SBOP1');
			GL.a('SBAP');
			GL.a('SBAC');
			GL.a('SBOC1');
			break;
		case '5-leg-strategy':
			GL.a('SBOP2');
			GL.a('SBOP1');
			GL.a('SBAP');
			GL.a('SBOC1');
			GL.a('SBOC2');
			break;
		case '6-leg-strategy':
			GL.a('SBOP2');
			GL.a('SBOP1');
			GL.a('SBAP');
			GL.a('SBAC');
			GL.a('SBOC1');
			GL.a('SBOC2');
			break;
		case '7-leg-strategy':
			GL.a('SBOP3');
			GL.a('SBOP2');
			GL.a('SBOP1');
			GL.a('SBAP');
			GL.a('SBOC1');
			GL.a('SBOC2');
			GL.a('SBOC3');
			break;
		case '8-leg-strategy':
			GL.a('SBOP3');
			GL.a('SBOP2');
			GL.a('SBOP1');
			GL.a('SBAP');
			GL.a('SBAC');
			GL.a('SBOC1');
			GL.a('SBOC2');
			GL.a('SBOC3');
			break;
	}
	try {
		//log("GLL LEGS START");
		GLL = GL.legs;
		//log("GLL null?" + (GLL==null));
		//log("GLL length" + (GLL.length));
		const promises = GLL.map(leg => OS.add(leg));
		for (const promise of promises) {
			reponse = await promise;
		}
		/*(for (let i=0; i < GLL.length; i++){
		    
		    OS.add(GLL[i]);
		    
		    log("GLL leg " + i + " exists");
		}*/
	} catch (e) {
		log(e.message);
	}

    drawOptionStrategyForm(OS);
    
	//log("ms total time elapsed: " + (performance.now() - t0));
}



initAutoComplete = (elementId) => {

    let found = 0;
    let displayFound = false;
    let _promise = null;
    let _fields = [];
    let optionTemplate = null;
    let inputValuePattern = null;
    let placeHolder = 'Search';
    let value = null;
    let _refObject;
    let _key;

    setPromiseFn = (promise) => { // promise function took one parameter (query search)
        _promise = promise;
        return this;
    }
    
    setFields = (fields) => {
        _fields = fields;
        return this;
    }

    setOptionTemplate = (template) => {
        optionTemplate = template;
        return this;
    }

    setInputValuePattern = (text) => {
        inputValuePattern = text;
        return this;
    }
    
    setPlaceHolder = (text) => {
        placeHolder = text;
        return this;
    }


    displayCount = () => { 
        displayFound = true; 
        return this;
    }


    getValue = ()=>{
        return value;
    }
    
    ref = (obj, key) => {
        _refObject = obj;
        _key = key;
        return this;
    }

    render = () => {
        if( _fields.length===0 )            throw Error("Init filtred fields before rendering");
        if( optionTemplate === null )       throw Error("Init list option pattern before rendering");
        if( inputValuePattern === null )    throw Error("Init input value pattern before rendering");

        const {setQuery, setIsOpen} = autocomplete({
            container: `#${elementId}`,
            placeholder: placeHolder,
            openOnFocus: true,
            detachedMediaQuery: 'none',
            plugins: [],
            defaultActiveItemId: 0, // [INFO] on press enter: first index will be the default value selected
            getSources(query){
                return [{
                    sourceId: 'querySuggestions',
                    getItemInputValue: ({ item }) => item.query,
                    onSelect({item}){
                        setQuery(inputValuePattern(item));
                        delete item["__autocomplete_id"];
                        _refObject.set(_key, item); // update obj
                    },
                    onStateChange(){
                        console.log("xxx")
                        //log("state change");
                    },
                    async getItems({ query }) {
                        let result = [];
                        await _promise(query).then( res => {
                            found = res.found;
                            result = res.hits.map( item => {
                                const obj = {};
                                _fields.map( field => obj[field] = item.document[field]);
                                return obj;
                            });
                        });
                        return result;
                    },
                    templates: {
                        item({ item, html}) {
                            return optionTemplate(item, html);
                        },
                        header({html}) {
                            return displayFound ? html`<div class="autocomplete-counts">Found:  ${found}</div>`:null;
                        }
                    },
                }]
            },
            renderNoResults({ state, render, html}, root) {
                render(html`<div class="autocomplete-not-found">No results for <span>${state.query}</span>.</div>`, root);
            }
        });


        /***
         * 
         * something goes wrong when we have 2+ element so i got this as solution.
         * problem: onClick outside only last elment got closed
         * kindly check it, maybe it cost of performance
         */
        window.addEventListener("click", ()=> {
            setIsOpen(false);
        });
        document.querySelector(`#${elementId}`).addEventListener("click", () => {
            setIsOpen(false);
        });

        
        /***
         * if user select an item, and after he write or delete the value of the input
         * the input should be invalid
         */
        document.querySelector(`#${elementId}`).addEventListener("click", () => {
            _refObject[_key] = null;
        });
    }

    return {ref, setPromiseFn, setFields, setOptionTemplate, setInputValuePattern, displayCount, setPlaceHolder, render}
}