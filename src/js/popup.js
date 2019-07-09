const baseUrl = 'https://osu.ppy.sh/beatmapsets';
let cursorStore;
let queryStore;

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
    moreButton.hide();
    loading.show();
    let param = '';
    if (q) {
        param += '&q=' + q;
    }
    if (cursor) {
        for (let key in cursor) {
            param += '&cursor%5B' + key + '%5D=' + cursor[key];
        }
    }
    console.log(baseUrl + "/search?" + param.substring(1));
    $.ajax({
        url: baseUrl + "/search?" + param.substring(1),
        type: 'get',
        success: function (res) {
            console.log(res);
            if (q && res.cursor && !res.cursor._score) {
                searchData.val("");
                searchData.attr("placeholder", "请先前往官网登录");
                searchButton.addClass("warn");
                setTimeout(function () {
                    searchData.attr("placeholder", "请输入要检索的谱面");
                    searchButton.removeClass("warn");
                }, 2000);
            }
            appendList(res);
            if (res.cursor) {
                cursorStore = res.cursor;
            }
            loading.hide();
            moreButton.show();
        },
        error: function (e) {
            console.log(e);
        }
    });
}

function appendList(res) {
    for (let i in res.beatmapsets) {
        let mapInfo = res.beatmapsets[i];
        let item = $("<li></li>");
        item.append(buildItem(mapInfo));
        mapList.append(item);
        let imgPanel = item.find(".panel_up");
        imgPanel.css("background-image", "url(" + mapInfo.covers.card + ")");
        imgPanel.bind("click", function () {
            let mapList = mapInfo.beatmaps;
            chrome.tabs.create({"url": mapList[mapList.length - 1].url});
        });
        item.find(".download").bind("click", function () {
            chrome.tabs.create({"url": baseUrl + "/" + mapInfo.id + "/download"});
        })
    }
    bindPlay();
}

function bindPlay() {
    let playButton = mapList.find(".title_play");
    playButton.unbind("click").bind("click", function () {
        try {
            audio[0].pause();
            if ($(this).attr("src") === "img/play.png") {
                audio.attr("src", $(this).attr("preview"));
                audio[0].play();
                $(this).attr("src", "img/pause.png");
                playButton.attr("src", "img/play.png");
            } else if ($(this).attr("src") === "img/pause.png") {
                $(this).attr("src", "img/play.png");
            }
        } catch (e) {
            console.log(e);
        }
        return false;
    });
}

function buildItem(mapInfo) {
    return $('<div class="con">' +
        '        <div class="panel">' +
        '            <div class="panel_up">' +
        '                <div class="status">' +
        '                    <span class="rank_status">' + mapInfo.status + '</span>' +
        '                    <span class="play_status">' +
        '                    <span>' + mapInfo.play_count + ' plays</span><br>' +
        '                    <span>' + mapInfo.favourite_count + ' loves</span>' +
        '                </div>' +
        '                <div class="title">' +
        '                    <div class="title_info">' +
        '                        <h4>' + mapInfo.title + '</h4>' +
        '                        <h5>' + mapInfo.artist + '</h5>' +
        '                    </div>' +
        '                    <img class="title_play" src="img/play.png" alt="" preview="http:' + mapInfo.preview_url + '">' +
        '                </div>' +
        '            </div>' +
        '            <div class="panel_down">' +
        '                <span class="mapper">' + mapInfo.creator + '</span>' +
        '                <span class="source">' + mapInfo.source + '</span>' +
        '            </div>' +
        '        </div>' +
        '        <a class="download">↓</a>' +
        '    </div>');
}
