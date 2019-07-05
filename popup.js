$.ajax({
    url: 'https://osu.ppy.sh/beatmapsets/search',
    type: 'get',
    success: function (res) {
        console.log(res);
        let itemLi = $("#beatmapList");
        for (let i in res.beatmapsets) {
            let item = $("<li></li>");
            item.append(buildItem(res.beatmapsets[i]));
            itemLi.append(item);
            let backgroundUrl = res.beatmapsets[i].covers.card;
            item.find(".panel_up").css("background-image","url(" + backgroundUrl + ")");
            item.bind("click", function () {
                let mapList = res.beatmapsets[i].beatmaps;
                chrome.tabs.create({
                    'url': mapList[mapList.length - 1].url
                });
            });
            let playButton = item.find(".title_play");
            playButton.bind("click", function () {
                // TODO 把整个列表的播放按钮都变回播放
                // TODO 把当前按钮至为暂停
                // TODO 播放音乐
                if (playButton.attr("src") === "play.png") {
                    playButton.attr("src", "pause.png");
                } else {
                    playButton.attr("src", "play.png");
                }
                return false;
            });
        }
    }
});

function buildItem(beatmap) {
   return $('<div class="panel">' +
        '    <div class="panel_up">' +
        '        <div class="status">' +
        '            <span class="rankStatus">' + beatmap.status + '</span>' +
        '            <span class="playStatus">' +
        '                <span>' + beatmap.play_count + ' plays</span><br>' +
        '                <span>' + beatmap.favourite_count + ' loves</span>' +
        '            </span>' +
        '        </div>' +
        '        <div class="title">' +
        '            <div class="title_info">' +
        '                <h4>' + beatmap.title + '</h4>' +
        '                <h5>' + beatmap.artist + '</h5>' +
        '            </div>' +
        '            <img class="title_play" src="play.png" alt="">' +
        '        </div>' +
        '    </div>' +
        '    <div class="panel_down">' +
        '        <span class="mapper">' + beatmap.creator + '</span>' +
        '        <span class="source">' + beatmap.source + '</span>' +
        '    </div>' +
        '</div>');
}
