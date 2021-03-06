/**
 *  Peers.tv plugin for Showtime by Buksa
 *
 *  Copyright (C) 2015 Buksa
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
// Version 0.4.6
//
var plugin = JSON.parse(Plugin.manifest);
var PREFIX = plugin.id;
var BASE_URL = "http://peers.tv";
var ICON = Plugin.path + "logo.png"

var service = require('showtime/service');
var settings = require('showtime/settings');
var page = require('showtime/page');
var http = require('showtime/http');
var XML = require('showtime/xml');
var html = require('showtime/html');
var io = require('native/io');
var data ={};

var tos = 'The developer has no affiliation with the sites what so ever.\n';
tos += 'Nor does he receive money or any other kind of benefits for them.\n\n';
tos += 'The software is intended solely for educational and testing purposes,\n';
tos += 'and while it may allow the user to create copies of legitimately acquired\n';
tos += 'and/or owned content, it is required that such user actions must comply\n';
tos += 'with local, federal and country legislation.\n\n';
tos += 'Furthermore, the author of this software, its partners and associates\n';
tos += 'shall assume NO responsibility, legal or otherwise implied, for any misuse\n';
tos += 'of, or for any loss that may occur while using plugin.\n\n';
tos += 'You are solely responsible for complying with the applicable laws in your\n';
tos += 'country and you must cease using this software should your actions during\n';
tos += 'plugin operation lead to or may lead to infringement or violation of the\n';
tos += 'rights of the respective content copyright holders.\n\n';
tos += "plugin is not licensed, approved or endorsed by any online resource\n ";
tos += "proprietary. Do you accept this terms?";



// Service creation link na home page
service.create(plugin.title, PREFIX + ":start", "video", true, ICON);
/*******************************************************************************
 * // Settings
 ******************************************************************************/
settings.globalSettings(plugin.id, plugin.title, ICON, plugin.synopsis);
// General settings
//settings.createInfo('info' , LOGO,"Plugin developed by " + plugin.author + ".")
settings.createDivider("General");
settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin)", false, function(v) {
    service.tosaccepted = v;
});
// Enable / disable debug setting
settings.createBool("debug", "Debug", false, function(v) {
    service.debug = v;
});

io.httpInspectorCreate('http.*peers.tv.*', function(req) {
    req.setHeader('User-Agent', 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 4 Build/LMY48T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.89 Mobile Safari/537.36');
    req.setHeader('Referer','http://m.peers.tv/')
});

function date(){
    now = new Date;
    year = "" + now.getFullYear();
    month = "" + (now.getMonth() + 1);
    1 == month.length && (month = "0" + month);
    day = "" + now.getDate();
    1 == day.length && (day = "0" + day);
    return year + "-" + month + "-" + day
};

new page.Route(PREFIX + ":start", function (page) {
    page.metadata.title = "Peers.tv : Список Каналов";
    page.metadata.logo = ICON;
    page.type = "directory";
    var d 
    //http://api.peers.tv/peerstv/xml/1/
    var resp = http.request('https://m.peers.tv',{//'http://peers.tv', {
        debug: service.debug,
        method: 'GET',
        headers: {
            "User-Agent": 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 4 Build/LMY48T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.89 Mobile Safari/537.36'
        }
    }).toString();
    p(resp.match(/ptv.initMobile\(([^\]]+\])/)[1])
    
    items = []

            json = JSON.parse(resp.match(/ptv.initMobile\(([^\]]+\])/)[1])
        for (var i in json) {
            p(dump(json[i]))
            items.push({
            href:json[i].href,    
            channelId: json[i].id,
            title: json[i].title,
            icon: Plugin.path + "img/" + json[i].id+ ".png",
            stream: json[i].stream,
            date: date()
            })

           
        }
    
    for (i = 0; i < items.length; i++) {
        data = items[i];
        page.appendItem(PREFIX + ":arhivdate:" + JSON.stringify(data), "video", {
            title: data.title,
            icon: data.icon
        });
    }
    

//var resp =http.request('http://api.peers.tv/peerstv/xml/1/')
// var myRe = /<title>(.*)<\/title>[\S\s]+?<image>(.*)<\/image>[\S\s]+?<cn:id>(\d+)/g;
//  var myArray;
//  i = 0;
//  while ((myArray = myRe.exec(resp)) !== null ) {
//    p('wget --output-document='+myArray[3]+'.png' + ' '+ myArray[2])
//    i++;
//  }

    page.loading = false;

});
new page.Route(PREFIX + ":channel:(.*)", function (page, data) {
    p(data)
    data = JSON.parse(data);
    p('https://m.peers.tv'+data.href)
     var resp = http.request('https://m.peers.tv'+data.href,{
        debug: service.debug,
        method: 'GET',
        headers: {
            "User-Agent": 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 4 Build/LMY48T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.89 Mobile Safari/537.36'
        }
    }).toString();
    p(resp)
});
new page.Route(PREFIX + ":arhivdate:(.*)", function (page, data) {
    data = JSON.parse(data);
    p(dump(data))
    page.metadata.title = "Peers.tv : Программа Канала за " + data.date;
    page.metadata.logo = data.icon;
    page.type = "directory";
    page.contents = "items"
    page.loading = true;
    var respond = http.request('http://peers.tv/ajax/program/' + data.channelId + '/' + data.date + '/', {
        debug: service.debug,
        method: 'POST',
        headers: {
            "User-Agent": 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0'
        }
    }).toString();
    http://m.peers.tv/program/rossija/
    page.appendItem('hls:' + data.stream, 'video', {
        title: new showtime.RichText('live'),
        description: new showtime.RichText('live'),
        icon: data.icon
    });
    var jsonResp = JSON.parse(respond)

    //page.appendItem(PREFIX + ":arhiv:"+JSON.stringify(jsonResp.week), 'directory', {
    //    title: new showtime.RichText('arhiv'),
    //    description: new showtime.RichText('arhiv'),
    //    icon: data.icon
    //});
    //  
    for (i in jsonResp.telecasts) {
        item = jsonResp.telecasts[i]
        p(item)

        try {
            onair = item.onair
        } catch (e) {
            onair = ''
        }
        try {
            movie = item.files[0].movie
        } catch (e) {
            movie = ''
        }
        if (movie) {
            color = '#0b94f3'

        } else {
            color = '#a6a6a6'
            movie = data.stream
        }
        if (onair) {
            color = '#92cd00';
            movie = data.stream
        }

        p(movie)



        page.appendItem('hls:' + movie, 'video', {
            title: new showtime.RichText('<font color="' + color + '">[' + item.time.substring(11, 16) + "-" + item.ends.substring(11, 16) + '] ' + item.title + '</font>'),
            description: new showtime.RichText(item.desc),
            icon: 'http:' + item.image
        });

    }
    page.loading = false;
});

new page.Route(PREFIX + ":arhiv:(.*)", function (page, json) {
    page.loading = true;
    page.type = 'directory';
    p(dump(json))
    json = JSON.parse(json);
    p(dump(json))



    for (var i =0; i < json.length; i++) {
            p('=============')
            
            data.date = json[i].href.match(/(\d{4}-\d{2}-\d{2})/)[1]
            p(dump(data))
            page.appendItem(PREFIX + ":arhivdate:" + JSON.stringify(data), 'directory', {
                title: new showtime.RichText(json[i].date),
                description: new showtime.RichText(json[i].date),
                icon: data.icon
            });
    }
    page.loading = false;
})


function p(message) {
    if (service.debug == '1') print(message)
}

function e(ex) {
    console.log(ex);
    console.log("Line #" + ex.lineNumber);
}

function dump(arr, level) {
  var dumped_text = "";
  if (!level) {
    level = 0;
  }
  var level_padding = "";
  for (var j = 0; j < level + 1; j++) {
    level_padding += "    ";
  }
  if (typeof arr == "object") {
    for (var item in arr) {
      var value = arr[item];
      if (typeof value == "object") {
        dumped_text += level_padding + "'" + item + "' ...\n";
        dumped_text += dump(value, level + 1);
      } else {
        dumped_text += level_padding + "'" + item + "' => \"" + value + '"\n';
      }
    }
  } else {
    dumped_text = "===>" + arr + "<===(" + typeof arr + ")";
  }
  return dumped_text;
}