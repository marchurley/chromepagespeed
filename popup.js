//JQuery Prepare document
$(document).ready(function() {
    //hide areas on page load
    $("#loading").hide();
    $("#openlist,#imglist,#disclaimer,.hide,#downloadImageSelection,#noReco,#clickDetail").hide();
    //event handler when checkPage is clicked
    $("#checkPage").click(function() {
        //looking for active tabs
        chrome.tabs.query({
            active: true,
            currentWindow: true
            //Callback function that only runs when an active tab is found, passing the tab as argument
        }, function(tabs) {
            var url = tabs[0].url;
            encodedUrl = encodeURIComponent(url);
            //run the calltogoogle api. pass the url as argument
            calltogoogle(url);
            //show loading gif after click on button
            $("#or, #optImg, #googleInfo").hide();
            $("#loading").show();
        });
    });
    //download optimized images from google after button is clicked
    $("#optImg").click(function() {
        //looking for active tabs
        chrome.tabs.query({
            active: true,
            currentWindow: true
            //Callback function that only runs when an active tab is found, passing the tab as argument
        }, function(tabs) {
            var url = tabs[0].url;
            //prepare the url
            var google1 = "https://developers.google.com/speed/pagespeed/insights/optimizeContents?url=";
            encodedUrl2 = encodeURIComponent(url);
            var google2 = "&strategy=desktop";
            finalUrl = google1 + encodedUrl2 + google2;
            window.open(finalUrl);
        });
    });
});

// global variable for encoded url (can't be inside jquery document ready)
var encodedUrl;

////////////////////////////////////////////////////////////////////////
// Our JSONP callback. Checks for errors, then invokes our callback handlers.
function runPagespeedCallbacks(result) {
    //run this code if there are errors
    if (result.error) {
        $("#loading").hide();
        $("#or, #optImg, #googleInfo").show();
        var errors = result.error.errors;
        for (var i = 0, len = errors.length; i < len; ++i) {
            if (errors[i].reason == 'badRequest' && API_KEY == 'yourAPIKey') {
                $("#error").text('Please specify your Google API key in the API_KEY variable.');
            } else {
                $("#error").text(errors[i].message);
            }
        }
        return;
    }
    if (result.invalidRules) {
        $("#loading,#checkPage").hide();
        $("#noReco").show();
    }

    //if we get a speed score, put it in variable and display
    if (result.ruleGroups && result.ruleGroups.SPEED && result.ruleGroups.SPEED.score) {
        var resultNumber = result.ruleGroups.SPEED.score;
        $("#loading,#checkPage").hide();
        $("#clickDetail").show();
        if (resultNumber < 60) {
            $("#result").html("<p id='poor'><a href='https://developers.google.com/speed/pagespeed/insights/?url=" + encodedUrl + "' target='_blank'>Google Page Speed Score: " +
                "<strong style='text-decoration: underline;'>" + resultNumber + "</strong>/100<br>Poor score. Please optimize!</a></p>");
        } else if (resultNumber < 80) {
          $("#result").html("<p id='needswork'><a href='https://developers.google.com/speed/pagespeed/insights/?url=" + encodedUrl + "' target='_blank'>Google Page Speed Score: " +
              "<strong style='text-decoration: underline;'>" + resultNumber + "</strong>/100<br>Might need some rework. Ideal score is above 80!</p>");
        } else {
          $("#result").html("<p id='good'><a href='https://developers.google.com/speed/pagespeed/insights/?url=" + encodedUrl + "' target='_blank'>Google Page Speed Score: " +
              "<strong style='text-decoration: underline;'>" + resultNumber + "</strong>/100<br>Great score!</p>");
        }
    }
    //if we get images that needs optimization, change height & width and display them here
    //always check that a property is there before evaluating it. otherwise error
    if (result.formattedResults && result.formattedResults.ruleResults &&
        result.formattedResults.ruleResults &&
        result.formattedResults.ruleResults.OptimizeImages &&
        result.formattedResults.ruleResults.OptimizeImages.urlBlocks &&
        result.formattedResults.ruleResults.OptimizeImages.urlBlocks.length === 1 &&
        result.formattedResults.ruleResults.OptimizeImages.urlBlocks[0].urls) {
        $("#openlist,#imglist,#disclaimer,.hide,#downloadImageSelection").show(); //show divs when there are images returned
        $("html").width(400).height(400); // Change size of plugin
        $("#optImg, #googleInfo").show();
        $("#loading").hide(); // hide loading gif
        //put the returned images from google into a variable
        var imagearray = result.formattedResults.ruleResults.OptimizeImages.urlBlocks[0].urls;
        //put html code for image list download into variable
        var imagelist = ["<!doctype html><html><body style='text-align: center;'><h1>These images might be too large.<br>I recommend to minimize images above 150 KB!</h1><p>"];

        //Add images to html
        for (var x = 0; x < imagearray.length; x++) {
            appendImage(x, imagearray);
        }

        //download image list when button is clicked
        $("#openlist").click(function() {
            //for loop to put all the images formatted as html into imagelist variable
            for (var y = 0; y < imagearray.length; y++) {
                var imageHtml = "<a href='" + imagearray[y].result.args[0].value +
                    "' target='_blank'><img src='" + imagearray[y].result.args[0].value +
                    "'style='width:200px'></a><br><strong>" +
                    "Filesize: " + imagearray[y].result.args[0].size +
                    " KB<br><br></strong>";
                imagelist += imageHtml;
            }
            imagelist += "</body></html>";
            //call download function the download the list
            download("img_list.html", imagelist);
        });

        //download image selection with images to optimize individually when button is clicked
        $("#downloadImageSelection").click(function() {
            downloadImageSelection(imagearray);
        });
    }

}

function activeUrl() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
        //Callback function that only runs when an active tab is found, passing the tab as argument
    }, function(tabs) {
        var activeUrl = tabs[0].url;
    });
}

////////////////////////////////////////////////////////////////////////
//Function to calculate filesize and append image-preview & filesize to the DOM & add filesize to imagearray object
function appendImage(x, imagearray) {
    // Get Filesize
    var req = $.ajax({
        type: "HEAD",
        url: imagearray[x].result.args[0].value,
        success: function() {
            var fileSize = req.getResponseHeader("Content-Length");
            kilobyte = parseFloat(Math.round((fileSize / 1000) * 100) / 100).toFixed(2);
            // Append to DOM
            $("#imglist").append("<p><a href='" + imagearray[x].result.args[0].value +
                "' target='_blank'><img src='" + imagearray[x].result.args[0].value +
                "'style='width:200px'></a><br><strong>" +
                "Filesize: " + kilobyte +
                " KB</strong></p><br>");
            //Add size to imagearray
            imagearray[x].result.args[0].size = kilobyte;
        }
    });
}

////////////////////////////////////////////////////////////////////////
//Function to prepare the URL and run pagespeedcallback function
function calltogoogle(url) {
    var API_KEY = 'AIzaSyCorXZgoGduhFmi18X2W77zNultjh7O2xI';
    //url argument that gets passed from the active tab
    var URL_TO_GET_RESULTS_FOR = url;
    var API_URL = 'https://www.googleapis.com/pagespeedonline/v2/runPagespeed?';

    // Invokes the PageSpeed Insights API. The response will contain
    // JavaScript that invokes our callback with the PageSpeed results.
    function runPagespeed() {
        //create an empty script tag, with text javascript and async code
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        //build the query for the api call and run the callback function with the result
        var query = [
            'url=' + URL_TO_GET_RESULTS_FOR,
            'callback=runPagespeedCallbacks',
            'key=' + API_KEY,
            //join these 3 together with a & between
        ].join('&');
        //put the api_url + the created query (with the function stored inside) in a source tag
        s.src = API_URL + query;
        //place the s variable with the url & query with function stored inside
        //before the end of the head-tag in the popup.html
        document.head.insertBefore(s, null);
    }
    // Invoke the callback that fetches results. Async here so we're sure
    // to discover any callbacks registered below, but this can be
    // synchronous in your code.
    setTimeout(runPagespeed, 0);
}

////////////////////////////////////////////////////////////////////////
//Function to download all images individually from the imagearray and give them the filename
function downloadImageSelection(imagearray) {
    var link = document.createElement('a'); // adding a-tag to empty link variable
    link.style.display = 'none'; //setting the display attribute to none, they a-tags won't be displayed
    document.body.appendChild(link); //adding all the links to the body of the page

    //loop to get all images individually
    for (var i = 0; i < imagearray.length; i++) {
        var imageUrl = imagearray[i].result.args[0].value; //getting the image url
        var urlPar = imageUrl.split("/"); //creating an object with all parts of the url split where there is a "/"
        var imageName = urlPar[urlPar.length - 1]; //taking the last entry of the image, which is the image name
        link.setAttribute('href', imagearray[i].result.args[0].value); //add href attribute and urls to link variable
        link.setAttribute('download', imageName); // add download and name to link attribute
        link.click(); // manually clicking the link
    }
    document.body.removeChild(link); //removing all the links again from the body of the page
}

////////////////////////////////////////////////////////////////////////
//Function to download file with all the links. See above
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
