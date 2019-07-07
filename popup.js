const baseUrl = 'https://osu.ppy.sh/beatmapsets/search';
let cursorStore;
let queryStore;

const searchData = $("#searchData");
const searchButton = $("#searchButton");
const mapList = $("#beatmapList");
const audio = $("#previewAudio");
const moreButton = $("#listMore");

initData();

searchButton.bind("click", function () {
    $("#beatmapList").empty();
    let q = searchData.val();
    initData(undefined, q, true);
    queryStore = q;
});

moreButton.bind("click", function () {
    $(this).hide();
    initData(cursorStore, queryStore);
});

function initData(cursor, q, isSearch) {
    let param = '';
    if (q) {
        param += '&q=' + q;
    }
    if (cursor) {
        for (let key in cursor) {
           param += '&cursor%5B' + key +  '%5D=' + cursor[key];
        }
    }
    $.ajax({
        url: baseUrl + "?" + param.substring(1),
        type: 'get',
        success: function (res) {
            if (isSearch && res.cursor && !res.cursor._score) {
                searchData.val("");
                searchData.attr("placeholder", "请先前往官网登录");
                searchButton.addClass("warn");
                setTimeout(function () {
                    searchData.attr("placeholder", "请输入要检索的谱面");
                    searchButton.removeClass("warn");
                }, 2000);
            }
            appendList(res);
            cursorStore = res.cursor;
            moreButton.show();
        },
        error: function (e) {
            console.log(e);
        }
    });
}

function appendList(res) {
    for (let i in res.beatmapsets) {
        let item = $("<li></li>");
        item.append(buildItem(res.beatmapsets[i]));
        mapList.append(item);
        let backgroundUrl = res.beatmapsets[i].covers.card;
        item.find(".panel_up").css("background-image", "url(" + backgroundUrl + ")");
        item.bind("click", function () {
            let mapList = res.beatmapsets[i].beatmaps;
            chrome.tabs.create({
                'url': mapList[mapList.length - 1].url
            });
        });
    }
    bindPlay();
}

function bindPlay() {
    let playButton = mapList.find(".title_play");
    playButton.unbind("click").bind("click", function () {
        try {
            audio[0].pause();
            if ($(this).attr("src") === "play.png") {
                audio.attr("src", $(this).attr("preview"));
                audio[0].play();
                playButton.attr("src", "play.png");
                $(this).attr("src", "pause.png");
            } else if ($(this).attr("src") === "pause.png") {
                $(this).attr("src", "play.png");
            }
            return false;
        } catch (e) {
            console.log(e);
            return false;
        }
    });
}

function buildItem(beatmap) {
    return $('<div class="panel">' +
        '        <div id="preview_url" class="hidden">' + beatmap.preview_url + '</div>' +
        '        <div class="panel_up">' +
        '            <div class="status">' +
        '                <span class="rank_status">' + beatmap.status + '</span>' +
        '                <span class="play_status">' +
        '                <span>' + beatmap.play_count + ' plays</span><br>' +
        '                <span>' + beatmap.favourite_count + ' loves</span>' +
        '            </div>' +
        '            <div class="title">' +
        '                <div class="title_info">' +
        '                    <h4>' + beatmap.title + '</h4>' +
        '                    <h5>' + beatmap.artist + '</h5>' +
        '                </div>' +
        '                <img class="title_play" src="play.png" alt="" preview="http:' + beatmap.preview_url + '">' +
        '            </div>' +
        '        </div>' +
        '        <div class="panel_down">' +
        '            <span class="mapper">' + beatmap.creator + '</span>' +
        '            <span class="source">' + beatmap.source + '</span>' +
        '        </div>' +
        '    </div>');
}
