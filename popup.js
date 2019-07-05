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
        '            <h4>' + beatmap.title + '</h4>' +
        '            <h5>' + beatmap.artist + '</h5>' +
        '        </div>' +
        '    </div>' +
        '    <div class="panel_down">' +
        '        <span class="mapper">' + beatmap.creator + '</span>' +
        '        <span class="source">' + beatmap.source + '</span>' +
        '    </div>' +
        '</div>');
}
