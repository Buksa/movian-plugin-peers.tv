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
// Version 0.3.1
//

var http = require('showtime/http');

(function(plugin) {
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    var BASE_URL = "http://peers.tv";
    var logo = plugin.path + plugin_info.icon;
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

    var service = plugin.createService("Peers.tv", PREFIX + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin_info.title, logo, plugin_info.synopsis);
    settings.createInfo("info", logo, "Plugin developed by " + plugin_info.author + ". \n");
    settings.createDivider('Settings:');
    settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin):", false, function(v) {
        service.tosaccepted = v;
    });
    settings.createBool("debug", "Debug", false, function(v) {
        service.debug = v;
    });
    plugin.addHTTPAuth(".*tvstream.cn.ru.*", function(authreq) {
        authreq.setHeader("Referer", 'http://peers.tv/');
    });




    function startPage(page) {
        page.metadata.title = "Peers.tv : Список Каналов";
        page.metadata.logo = plugin.path + logo;
        page.type = "directory";
        page.contents = "items"
        //var respond = http.request('http://api.peers.tv/registry/2/whereami.json').toString();
        //p('respond:' + respond)

        //ch_list(page,getChannels(BASE_URL))
        ShowChannelList(page, BASE_URL)
        page.loading = false;

    }

    function getChannels(url) {
        var respond = http.request(url).toString();
        
        var re = /"id": (\d+).*?"url": "(.*?)","title": "(.*?)","href": "(.*?)".*?"logo_large": "(.*?)".*?"magnet": "(.*?)","stream": "(.*?)"/g
        var channels = [],
            i = 0

        var item = re.exec(respond);

        while (item) {
            var channel = {
                id: item[1],
                url: item[2],
                title: item[3],
                href: item[4],
                ico: item[5],
                stream: item[7]
            };
            channels.push(channel)
            item = re.exec(respond);
        }
        p('Returning list with ' + channels.length + ' channels');
        return channels;
    }

    function ShowChannelList(page, url) {
        var respond = http.request(url).toString();
        var data = {}

        data.date =   date()
      function date(){now=new Date;year=""+now.getFullYear();month=""+(now.getMonth()+1);1==month.length&&(month="0"+month);day=""+now.getDate();1==day.length&&(day="0"+day);return year+"-"+month+"-"+day};
        p(data.date)
            var re = /(\{"id": \d+,"url": ".*","title":.*?stream.*\})/g
            //var re = new RegExp('"id": (\\d+),"url": "(.*)","title":.*}','g')

            m = re.execAll(respond);
            
            for (i = 0; i < m.length; i++) {
                //p(i)
                item = JSON.parse(m[i][0])
               // p(item)
                data.liveurl = item.stream
                data.channelId = item.id

        
                page.appendItem(PREFIX + ":arhivdate:" + escape(JSON.stringify(data)), 'video', {
                title: item.title,
                icon: item.logo.apps ? 'http:'+item.logo.apps.src : logo
                })
            }



    }

    function ArhivDates(page, data) {
        data = JSON.parse(unescape(data));
        p(data)
        page.metadata.title = "Peers.tv : Программа Канала за " + data.date;
        page.metadata.logo = plugin.path + logo;
        page.type = "directory";
        page.contents = "items"
        page.loading = true;
        var respond = http.request('http://peers.tv/ajax/program/' + data.channelId + '/' + data.date + '/',{method: 'POST'}).toString();
            page.appendItem(data.liveurl, 'video', {
                title: new showtime.RichText('live'),
                description: new showtime.RichText('live'),
                icon: logo
            });
        var jsonResp = JSON.parse(respond)
        
        for (i in jsonResp.week) {
            if (jsonResp.week[i].recs) {
                data.date = jsonResp.week[i].href.match(/(\d{4}-\d{2}-\d{2})/)[1]
                page.appendItem(PREFIX + ":arhivdate:" + escape(JSON.stringify(data)), 'directory', {
                    title: new showtime.RichText(jsonResp.week[i].date),
                    description: new showtime.RichText(jsonResp.week[i].date),
                    icon: logo
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
                
            } else {color = '#a6a6a6'
            movie = data.liveurl
            }
            if (onair) {
                color = '#92cd00';
                movie = data.liveurl
            }

            p(movie)



            page.appendItem(movie, 'video', {
                title: new showtime.RichText('<font color="' + color + '">[' + item.time.substring(11, 16) + "-" + item.ends.substring(11, 16) + '] ' + item.title + '</font>'),
                description: new showtime.RichText(item.desc),
                icon: 'http:' + item.image
            });

        }
    page.loading = false;    
    }







    function ch_list(page, items) {
        for (var i in items) {
            page.appendItem(items[i].stream /*PREFIX + ':channel:' + channel.url + ':' + date + ':' + channel.title*/ , 'video', {
                title: new showtime.RichText(items[i].title),
                icon: BASE_URL + items[i].ico
            });
        }
    }

    function p(message) {
        if (service.debug == '1') {
            print(message);
            if (typeof(message) === 'object') print(dump(message));
        }
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

    plugin.addURI(PREFIX + ":start", startPage);
    plugin.addURI(PREFIX + ":arhivdate:(.*)", ArhivDates)

    
    
        // Add to RegExp prototype
	RegExp.prototype.execAll = function(str) {
		var match = null
		for (var matches = []; null !== (match = this.exec(str));) {
			var matchArray = [],i;
			for (i in match) {
				parseInt(i, 10) == i && matchArray.push(match[i]);
			}
			matches.push(matchArray);
		}
		if (this.exec(str) == null) return null
		return matches;
	};
})(this);