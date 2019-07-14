const baseUrl = 'https://osu.ppy.sh';
const bloodUrl = "https://bloodcat.com/osu/s";

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

searchButton.bind("click", () => {
    mapList.empty();
    initData(undefined, searchData.val());
    queryStore = searchData.val();
});

moreButton.bind("click", () => {
    initData(cursorStore, queryStore);
});

function initData(cursor, q) {
    switchMore();
    let param = [];
    if (q) {
        param.push("q=" + q);
    }
    if (cursor) {
        for (let key in cursor) {
            param.push("&cursor%5B" + key + "%5D=" + cursor[key]);
        }
    }
    $.ajax({
        url: baseUrl + "/beatmapsets/search?" + param.join("&"),
        type: 'get',
        success: res => {
            checkLogin(q, res.cursor);
            appendList(res);
            if (res.cursor) {
                cursorStore = res.cursor;
            }
            switchMore();
        },
        error: e => {
            console.log(e);
        }
    });

    function checkLogin(q, cursor) {
        if (q && cursor && !cursor._score) {
            searchData.val("");
            searchData.attr("placeholder", "请先前往官网登录");
            searchButton.addClass("warn");
            setTimeout(() => {
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
        let item = buildItem(mapInfo);
        mapList.append($("<li></li>").append(item));
        item.find(".panel_up").bind("click", () => {
            let mapList = mapInfo.beatmaps;
            chrome.tabs.create({url: mapList[mapList.length - 1].url});
        });
        item.find(".mapper").bind("click", () => {
            chrome.tabs.create({url: baseUrl + "/users/" + mapInfo.user_id});
        });
        bindPlay(item, mapInfo);
        bindDownload(item, mapInfo);
    }

    function bindDownload(item, mapInfo) {
        let button = item.find(".download");
        button.one("click", () => {
            if (downloadingSet.has(mapInfo.id)) {
                button.addClass("warn");
                setTimeout(() => {
                    button.removeClass("warn");
                    bindDownload(item, mapInfo);
                }, 1000);
            } else {
                chrome.downloads.download({
                    url: bloodUrl + "/" + mapInfo.id
                }, downloadId => {
                    downloadingSet.add(mapInfo.id);
                    progressMonitor(downloadId, mapInfo.id);
                    bindDownload(item, mapInfo);
                });
            }
        });

        function progressMonitor(downloadId, mapId) {
            pro();
            let progressThread = setInterval(() => {
                pro();
            }, 1000);

            function pro() {
                chrome.downloads.search({id: downloadId}, dlItem => {
                    if (dlItem[0].state === "in_progress") {
                        let cb = dlItem[0].bytesReceived;
                        let tb = dlItem[0].totalBytes;
                        button.css("background-position", "0 " + (1 - cb / tb) * button.height() + "px");
                    } else {
                        clearInterval(progressThread);
                        button.css("background-position", "0 " + button.height() + "px");
                        downloadingSet.delete(mapId);
                    }
                });
            }
        }
    }

    function bindPlay(item, mapInfo) {
        let button = item.find(".title_play");
        let progress = item.find(".progress");
        button.bind("click", () => {
            return false;
        });
        button.one("click", () => {
            audio[0].pause();
            if (button.text() === "▲") {
                setTimeout(function () {
                    audio.attr("src", "https:" + mapInfo.preview_url);
                    audio[0].play().then(() => {
                        progressMonitor(item);
                        button.text("〓");
                        bindPlay(item, mapInfo);
                    }).catch(e => {
                        console.log(e);
                        bindPlay(item, mapInfo);
                    });
                }, 100);
            } else if (button.text() === "〓") {
                button.text("▲");
                bindPlay(item, mapInfo);
            }
            return false;
        });

        function progressMonitor(item) {
            pro();
            let progressThread = setInterval(() => {
                pro();
            }, 100);

            function pro() {
                if (!audio[0].ended && !audio[0].paused) {
                    progress.css("margin-right", (1 - audio[0].currentTime / audio[0].duration) * 100 + "%");
                } else {
                    clearInterval(progressThread);
                    item.find(".title_play").text("▲");
                    progress.css("margin-right", "100%");
                }
            }
        }
    }
}

function buildItem(mapInfo) {
    return $('<div class="con">' +
                '<div class="panel">' +
                    '<div class="panel_up" style="background-image: url(' + mapInfo.covers.card + ')">' +
                        '<div class="status">' +
                            '<span class="rank_status">' + mapInfo.status.toUpperCase() + '</span>' +
                            '<span class="play_status">' +
                            '<span>' + mapInfo.play_count + ' plays</span><br>' +
                            '<span>' + mapInfo.favourite_count + ' loves</span>' +
                        '</div>' +
                        '<div class="title">' +
                            '<div class="title_info">' +
                                '<h4>' + mapInfo.title + '</h4>' +
                                '<h5>' + mapInfo.artist + '</h5>' +
                            '</div>' +
                            '<a class="title_play">▲</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="progress"></div>' +
                    '<div class="panel_down">' +
                        '<span class="mapper">' + mapInfo.creator + '</span>' +
                        '<span class="source">' + mapInfo.source + '</span>' +
                    '</div>' +
                '</div>' +
                '<a class="download">↓</a>' +
            '</div>');
}
