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
// Version 0.4.2
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

io.httpInspectorCreate('http.*\\.peers.tv.*', function(req) {
    req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0');
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
    var resp = http.request('http://peers.tv', {
        debug: service.debug,
        method: 'GET',
        headers: {
            "User-Agent": 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0'
        }
    }).toString();
  //  p(resp)
    items = []
    regExp = /(\{"id":.+?\d+,"url[\s\S]+?stream[\s\S]+?\})/g;
    while (((m = regExp.exec(resp)) !== null)) {

        item = /"id".+?(\d+).+?title.+?"([^"]+).+?src.+?"([^"]+).+?"stream.+?"([^"]+)/.exec(m)
        items.push({
            channelId: item[1],
            title: item[2],
            icon: 'http:' + item[3],
            stream: item[4].replace(/\\\//g, "/"),
            date: date()
        })
    }

    
    for (i = 0; i < items.length; i++) {
        item = items[i];
        page.appendItem(PREFIX + ":arhivdate:" + JSON.stringify(item), "video", {
            title: item.title,
            icon: item.icon
        });
    }

    page.loading = false;

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
    page.appendItem('hls:' + data.stream, 'video', {
        title: new showtime.RichText('live'),
        description: new showtime.RichText('live'),
        icon: data.icon
    });
    var jsonResp = JSON.parse(respond)

    for (i in jsonResp.week) {
        if (jsonResp.week[i].recs) {
            data.date = jsonResp.week[i].href.match(/(\d{4}-\d{2}-\d{2})/)[1]
            p(dump(data))
            page.appendItem(PREFIX + ":arhivdate:" + JSON.stringify(data), 'directory', {
                title: new showtime.RichText(jsonResp.week[i].date),
                description: new showtime.RichText(jsonResp.week[i].date),
                icon: data.icon
            });
            //code
        }


    }

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




function p(message) {
    if (service.debug == '1') print(message)
}

function e(ex) {
    console.log(ex);
    console.log("Line #" + ex.lineNumber);
}

function dump(arr, level) {
    var dumped_text = "";
    if (!level) level = 0;
    //The padding given at the beginning of the line.
    var level_padding = "";
    for (var j = 0; j < level + 1; j++) level_padding += "    ";
    if (typeof(arr) == 'object') { //Array/Hashes/Objects
        for (var item in arr) {
            var value = arr[item];
            if (typeof(value) == 'object') { //If it is an array,
                dumped_text += level_padding + "'" + item + "' ...\n";
                dumped_text += dump(value, level + 1);
            } else {
                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
            }
        }
    } else { //Stings/Chars/Numbers etc.
        dumped_text = arr;
    }
    return dumped_text;
}