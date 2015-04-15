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
    var search = req.body;
    console.log(req.body);
    var url = "https://api.ebay-kleinanzeigen.de/api/ads.json?size=200&latitude=" + search.lat + "&longitude=" + search.lng + "&distance=" + search.radius + "&q=" + search.query;
    console.log("Requesting " + url);
    
    request({
      url: url,
      auth: AUTH
    }, function(error, response, body) {
      //console.log(body);
      var data = JSON.parse(body);
      var ads = data["{http://www.ebayclassifiedsgroup.com/schema/ad/v1}ads"].value.ad;
      
      var results = [];
      for (var i in ads) {
        var ad = ads[i];
        
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
        results.push(marker);
        //console.log(marker);
      }
      
      res.send({"ads" : results});
      
      /*
      var paging = data["{http://www.ebayclassifiedsgroup.com/schema/ad/v1}ads"].value.paging;
      var next = "";
      for (var i in paging.link) {
        if (paging.link[i].rel == "next") {
          next = paging.link[i].href;
          break;
        }
      }
      */
    });
  },
};
