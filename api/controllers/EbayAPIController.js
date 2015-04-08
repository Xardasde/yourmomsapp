/**
 * Ebay_apiController
 *
 * @description :: Server-side logic for managing ebay_apis
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var request = require("request");

var AUTH = {
  username: "hpi_hackathon",
  pass: "dsk38a1l",
};

module.exports = {
  test: function(req, res) {
    request({
      url: "https://api.ebay-kleinanzeigen.de/api/ads.json",
      auth: AUTH,
    }, function(error, response, body) {
      res.send(body);
    });
  },
  
  ads: function(req, res) {
    var query = req.body.query;
    
    // api seems to be slooooow
    var maxPages/* = 1*/; // set in function load
    var perPage = 100;
    
    var markersIDs = [];
    var markers = [];
    var generateHandler = function(callback) {
      return function(error, response, body) {
        var data = JSON.parse(body);
        var ads = data["{http://www.ebayclassifiedsgroup.com/schema/ad/v1}ads"].value.ad;
        
        for (var i in ads) {
          var ad = ads[i];
          if (markersIDs.indexOf(ad.id) != -1)
            continue;
          markersIDs.push(marker);
          
          var url = "";
          for (var j in ad.link) {
            var link = ad.link[j];
            if (link.rel == "self-public-website")
              url = link.href;
          }
          
          var image = "", imageThumbnail = "";
          for (var j in ad.pictures.picture) {
            for (var k in ad.pictures.picture[j].link) {
              var img = ad.pictures.picture[j].link[k];
              //console.log(img);
              if (img.rel == "large")
                image = img.href;
              if (img.rel == "teaser")
                imageThumbnail = img.href;
            }
          }
          
          var price = -1;
          if ("price" in ad) {
            if (ad.price["price-type"].value == "FREE")
              price = 0;
            else if (ad.price.amount.value !== undefined)
              price = ad.price.amount.value;
          }
          
          var marker = {
            id: ad.id,
            title: ad.title.value,
            description: ad.description.value,
            price: price,
            latLng: [ad["ad-address"].latitude.value, ad["ad-address"].longitude.value],
            url: url,
            image: image,
            imageThumbnail: imageThumbnail,
          };
          markers.push(marker);
          //console.log(marker);
        }
        
        var paging = data["{http://www.ebayclassifiedsgroup.com/schema/ad/v1}ads"].value.paging;
        var next = "";
        for (var i in paging.link) {
          if (paging.link[i].rel == "next") {
            next = paging.link[i].href;
            break;
          }
        }
        
        maxPages--;
        if (maxPages <= 0 || next == "") {
          //res.send({"markers" : markers});
          callback();
        } else {
          console.log("Loading " + next);
          request({
            url: next,
            auth: AUTH,
          }, handler);
        }
      };
    };
    
    function load(url, callback) {
      maxPages = 1;
      console.log("Loading " + url);
      request({
        url: url,
        auth: {
          username: "hpi_hackathon",
          pass: "dsk38a1l",
        },
      }, generateHandler(callback));
    }

    /*
    // Berlin
    load("https://api.ebay-kleinanzeigen.de/api/ads.json?locationId=3331&size=" + perPage + "&q=" + query, function() {
      // Potsdam
      load("https://api.ebay-kleinanzeigen.de/api/ads.json?locationId=7958&size=" + perPage + "&q=" + query, function() {      
        // Neubrandenburg
        load("https://api.ebay-kleinanzeigen.de/api/ads.json?locationId=249&size=" + perPage + "&q=" + query, function() {
          // Bonn
          load("https://api.ebay-kleinanzeigen.de/api/ads.json?locationId=1038&size=" + perPage + "&q=" + query, function() {
            res.send({"markers" : markers});
          });
        });
      });
    });
    */
    
    function genURL(index) {
      var point = req.body.points[index];
      return "https://api.ebay-kleinanzeigen.de/api/ads.json?size=200&latitude=" + point.lat + "&longitude=" + point.lng + "&distance=" + point.radius / 1000 + "&q=" + query;
    }
    
    var index = 0;
    var myhandler = function() {
      index++;
      if (index >= req.body.points.length) {
        res.send({"markers" : markers })
      } else {
        load(genURL(index), myhandler);
      }
    }
    
    load(genURL(0), myhandler);
    
    /*
    for (i in req.body.points) {
      var point = req.body.points[i];
      
      var url = "https://api.ebay-kleinanzeigen.de/api/ads.json?";
      url += "q=" + query;
      url += "&latitude=" + point.lat;
      url += "&longitude=" + point.lng;
      url += "&distance=" + point.radius + "&distanceUnit=KM";
      console.log(url);
    }
    */
  },
};
