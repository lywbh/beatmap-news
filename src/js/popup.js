const baseUrl = 'https://osu.ppy.sh';
let cursorStore;
let queryStore;
let downloadingSet = new Set();

const searchData = $("#searchData");
const searchButton = $("#searchButton");
const mapList = $("#beatmapList");
const audio = $("#previewAudio");
const moreButton = $("#listMore>.more");
const loading = $("#listMore>.loading");

initData();

searchButton.bind("click", function () {
    mapList.empty();
    initData(undefined, searchData.val());
    queryStore = searchData.val();
});

moreButton.bind("click", function () {
    initData(cursorStore, queryStore);
});

function initData(cursor, q) {
    switchMore();
    let param = '';
    if (q) {
        param += '&q=' + q;
    }
    if (cursor) {
        for (let key in cursor) {
            param += '&cursor%5B' + key + '%5D=' + cursor[key];
        }
    }
    $.ajax({
        url: baseUrl + "/beatmapsets/search?" + param.substring(1),
        type: 'get',
        success: function (res) {
            checkLogin(q, res.cursor);
            appendList(res);
            if (res.cursor) {
                cursorStore = res.cursor;
            }
            switchMore();
        },
        error: function (e) {
            console.log(e);
        }
    });

    function checkLogin(q, cursor) {
        if (q && cursor && !cursor._score) {
            searchData.val("");
            searchData.attr("placeholder", "请先前往官网登录");
            searchButton.addClass("warn");
            setTimeout(function () {
                searchData.attr("placeholder", "请输入要检索的谱面");
                searchButton.removeClass("warn");
            }, 2000);
        }
    }

    function switchMore() {
        if (moreButton.is(":visible")) {
            moreButton.hide();
            loading.show();
        } else {
            loading.hide();
            moreButton.show();
        }
    }
}

function appendList(res) {
    for (let i in res.beatmapsets) {
        let mapInfo = res.beatmapsets[i];
        let item = $("<li></li>").append(buildItem(mapInfo));
        mapList.append(item);
        let imgPanel = item.find(".panel_up");
        imgPanel.css("background-image", "url(" + mapInfo.covers.card + ")");
        imgPanel.bind("click", function () {
            let mapList = mapInfo.beatmaps;
            chrome.tabs.create({url: mapList[mapList.length - 1].url});
        });
        item.find(".mapper").bind("click", function () {
            chrome.tabs.create({url: baseUrl + "/users/" + mapInfo.user_id});
        });
        bindPlay(item, mapInfo);
        bindDownload(item, mapInfo);
    }

    function bindDownload(item, mapInfo) {
        let button = item.find(".download");
        let progress = item.find(".progress");
        button.one("click", function () {
            if (downloadingSet.has(mapInfo.id)) {
                button.addClass("warn");
                setTimeout(function () {
                    button.removeClass("warn");
                    bindDownload(item, mapInfo);
                }, 1000);
            } else {
                chrome.downloads.download({
                    url: baseUrl + "/beatmapsets/" + mapInfo.id + "/download",
                    filename: mapInfo.id + " - " + mapInfo.title + ".osz",
                    saveAs: true
                }, function (downloadId) {
                    downloadingSet.add(mapInfo.id);
                    bindDownload(item, mapInfo);
                    progressMonitor(downloadId, mapInfo.id);
                });
            }
        });

        function progressMonitor(downloadId, mapId) {
            let progressThread = setInterval(function() {
                chrome.downloads.search({id: downloadId}, function(dlItem) {
                    if (dlItem[0].state === "in_progress") {
                        let cb = dlItem[0].bytesReceived;
                        let tb = dlItem[0].totalBytes;
                        progress.css("margin-right", (1 - cb / tb) * 100 + "%");
                    } else {
                        clearInterval(progressThread);
                        progress.css("margin-right", "100%");
                        downloadingSet.delete(mapId);
                    }
                });
            }, 1000);
        }
    }

    function bindPlay(item, mapInfo) {
        let button = item.find(".title_play");
        button.bind("click", function () {
            try {
                audio[0].pause();
                if ($(this).text() === "▲") {
                    audio.attr("src", "https:" + mapInfo.preview_url);
                    audio[0].play();
                    mapList.find(".title_play").text("▲");
                    $(this).text("〓");
                } else if ($(this).text() === "〓") {
                    $(this).text("▲");
                }
            } catch (e) {
                console.log(e);
            }
            return false;
        });
    }
}

function buildItem(mapInfo) {
    return $('<div class="con">' +
        '        <div class="panel">' +
        '            <div class="panel_up">' +
        '                <div class="status">' +
        '                    <span class="rank_status">' + mapInfo.status.toUpperCase() + '</span>' +
        '                    <span class="play_status">' +
        '                    <span>' + mapInfo.play_count + ' plays</span><br>' +
        '                    <span>' + mapInfo.favourite_count + ' loves</span>' +
        '                </div>' +
        '                <div class="title">' +
        '                    <div class="title_info">' +
        '                        <h4>' + mapInfo.title + '</h4>' +
        '                        <h5>' + mapInfo.artist + '</h5>' +
        '                    </div>' +
        '                    <a class="title_play">▲</a>' +
        '                </div>' +
        '            </div>' +
        '            <div class="progress"></div>' +
        '            <div class="panel_down">' +
        '                <span class="mapper">' + mapInfo.creator + '</span>' +
        '                <span class="source">' + mapInfo.source + '</span>' +
        '            </div>' +
        '        </div>' +
        '        <a class="download">↓</a>' +
        '    </div>');
}
