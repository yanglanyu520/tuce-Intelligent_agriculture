var map = new AMap.Map("bigPic", {
    resizeEnable: true,
    center: [109.471763,34.643056],
    mapStyle: 'amap://styles/c60552abf431f4b75caf3f066a7cb351',
    zoom:12
});
var marker = new AMap.Marker({
    map: map,
    position: [109.221279,34.660357]
});
//鼠标点击marker弹出自定义的信息窗体
AMap.event.addListener(marker, 'click', function () {
    infoWindow.open(map, marker.getPosition());
});
//实例化信息窗体
//实例化信息窗体
var title = '<span style="font-size:14px;color:#fff;font-weight: bold;font-size: 21px">凤凰路街道办</span>',
    content = [];
content.push("<div class='input-card content-window-card'>");
content.push("<div style=\"height: 220px\"><!--<h4>高德软件</h4>-->");
content.push("<ul class='u1' style='margin-left: -10px;margin-top: -87px;width:140px;line-height: 35px'>");
content.push("<li>总产值:11971</li>" +
    "<li>农业产值:7531</li>" +
    "<li>林业业产值:70</li>" +
    "<li>牧业产值:4370</li>" +
    "<li>渔业产值:4370</li>" +
    "<li>多种经营:4370</li>" +
    "</ul></div></div>");

var infoWindow = new AMap.InfoWindow({
    isCustom: true,  //使用自定义窗体
    content: createInfoWindow(title, content.join("<br/>")),
    offset: new AMap.Pixel(16, -45)
});

//构建自定义信息窗体
function createInfoWindow(title, content) {
    var info = document.createElement("div");
    var top = document.createElement("div");
    var titleD = document.createElement("div");
    var closeX = document.createElement("img");
    top.className = "info-top";
    titleD.style.height="35px";
    titleD.style.backgroundColor="#000000";
    titleD.innerHTML = title;
    closeX.src = "https://webapi.amap.com/images/close2.gif";
    closeX.onclick = closeInfoWindow;
    top.appendChild(titleD);
    top.appendChild(closeX);
    info.appendChild(top);

    // 定义中部内容
    var middle = document.createElement("div");
    middle.className = "info-middle";
    middle.style.backgroundColor = 'white';
    middle.innerHTML = content;
    info.appendChild(middle);


    // 定义底部内容
    var bottom = document.createElement("div");
    bottom.className = "info-bottom";
    bottom.style.position = 'relative';
    bottom.style.top = '0px';
    bottom.style.margin = '0 auto';
    var sharp = document.createElement("img");
    sharp.src = "https://webapi.amap.com/images/sharp.png";
    bottom.appendChild(sharp);
    info.appendChild(bottom);
    return info;
}
//关闭信息窗体
function closeInfoWindow() {
    map.clearInfoWindow();
}



var marker1 = new AMap.Marker({
    map: map,
    position: [109.242576,34.65826]
});
//鼠标点击marker弹出自定义的信息窗体
AMap.event.addListener(marker1, 'click', function () {
    infoWindow1.open(map, marker1.getPosition());
});
//实例化信息窗体
var title = '<span style="font-size:14px;color:#fff;font-weight: bold;font-size: 21px">新华路街道办</span>',
    content = [];
content.push("<div class='input-card content-window-card'>");
content.push("<div style=\"height: 220px\"><!--<h4>高德软件</h4>-->");
content.push("<ul class='u1' style='margin-left: -10px;margin-top: -87px;width:140px;line-height: 35px'>");
content.push("<li>总产值:11971</li>" +
    "<li>农业产值:7531</li>" +
    "<li>林业业产值:70</li>" +
    "<li>牧业产值:4370</li>" +
    "<li>渔业产值:4370</li>" +
    "<li>多种经营:4370</li>" +
    "</ul></div></div>");

var infoWindow1 = new AMap.InfoWindow({
    isCustom: true,  //使用自定义窗体
    content: createInfoWindow(title, content.join("<br/>")),
    offset: new AMap.Pixel(16, -45)
});

//构建自定义信息窗体
function createInfoWindow(title, content) {
    var info = document.createElement("div");
    var top = document.createElement("div");
    var titleD = document.createElement("div");
    var closeX = document.createElement("img");
    top.className = "info-top";
    titleD.style.height="35px";
    titleD.style.backgroundColor="#000000";
    titleD.innerHTML = title;
    closeX.src = "https://webapi.amap.com/images/close2.gif";
    closeX.onclick = closeInfoWindow;
    top.appendChild(titleD);
    top.appendChild(closeX);
    info.appendChild(top);

    // 定义中部内容
    var middle = document.createElement("div");
    middle.className = "info-middle";
    middle.style.backgroundColor = 'white';
    middle.innerHTML = content;
    info.appendChild(middle);


    // 定义底部内容
    var bottom = document.createElement("div");
    bottom.className = "info-bottom";
    bottom.style.position = 'relative';
    bottom.style.top = '0px';
    bottom.style.margin = '0 auto';
    var sharp = document.createElement("img");
    sharp.src = "https://webapi.amap.com/images/sharp.png";
    bottom.appendChild(sharp);
    info.appendChild(bottom);
    return info;
}
//关闭信息窗体
function closeInfoWindow() {
    map.clearInfoWindow();
}


var marker2 = new AMap.Marker({
    map: map,
    position: [109.196508,34.667291]
});
//鼠标点击marker弹出自定义的信息窗体
AMap.event.addListener(marker2, 'click', function () {
    infoWindow2.open(map, marker2.getPosition());
});
//实例化信息窗体
var title = '<span style="font-size:14px;color:#fff;font-weight: bold;font-size: 21px">振兴街道办</span>',
    content = [];
content.push("<div class='input-card content-window-card'>");
content.push("<div style=\"height: 220px\"><!--<h4>高德软件</h4>-->");
content.push("<ul class='u1' style='margin-left: -10px;margin-top: -87px;width:140px;line-height: 35px'>");
content.push("<li>总产值:11971</li>" +
    "<li>农业产值:7531</li>" +
    "<li>林业业产值:70</li>" +
    "<li>牧业产值:4370</li>" +
    "<li>渔业产值:4370</li>" +
    "<li>多种经营:4370</li>" +
    "</ul></div></div>");

var infoWindow2 = new AMap.InfoWindow({
    isCustom: true,  //使用自定义窗体
    content: createInfoWindow(title, content.join("<br/>")),
    offset: new AMap.Pixel(16, -45)
});

//构建自定义信息窗体
function createInfoWindow(title, content) {
    var info = document.createElement("div");
    var top = document.createElement("div");
    var titleD = document.createElement("div");
    var closeX = document.createElement("img");
    top.className = "info-top";
    titleD.style.height="35px";
    titleD.style.backgroundColor="#000000";
    titleD.innerHTML = title;
    closeX.src = "https://webapi.amap.com/images/close2.gif";
    closeX.onclick = closeInfoWindow;
    top.appendChild(titleD);
    top.appendChild(closeX);
    info.appendChild(top);

    // 定义中部内容
    var middle = document.createElement("div");
    middle.className = "info-middle";
    middle.style.backgroundColor = 'white';
    middle.innerHTML = content;
    info.appendChild(middle);


    // 定义底部内容
    var bottom = document.createElement("div");
    bottom.className = "info-bottom";
    bottom.style.position = 'relative';
    bottom.style.top = '0px';
    bottom.style.margin = '0 auto';
    var sharp = document.createElement("img");
    sharp.src = "https://webapi.amap.com/images/sharp.png";
    bottom.appendChild(sharp);
    info.appendChild(bottom);
    return info;
}
//关闭信息窗体
function closeInfoWindow() {
    map.clearInfoWindow();
}




var marker3 = new AMap.Marker({
    map: map,
    position: [109.278273,34.666176]
});
//鼠标点击marker弹出自定义的信息窗体
AMap.event.addListener(marker3, 'click', function () {
    infoWindow3.open(map, marker3.getPosition());
});
//实例化信息窗体
var title = '<span style="font-size:14px;color:#fff;font-weight: bold;font-size: 21px">新兴街道办</span>',
    content = [];
content.push("<div class='input-card content-window-card'>");
content.push("<div style=\"height: 220px\"><!--<h4>高德软件</h4>-->");
content.push("<ul class='u1' style='margin-left: -10px;margin-top: -87px;width:140px;line-height: 35px'>");
content.push("<li>总产值:11971</li>" +
    "<li>农业产值:7531</li>" +
    "<li>林业业产值:70</li>" +
    "<li>牧业产值:4370</li>" +
    "<li>渔业产值:4370</li>" +
    "<li>多种经营:4370</li>" +
    "</ul></div></div>");

var infoWindow3 = new AMap.InfoWindow({
    isCustom: true,  //使用自定义窗体
    content: createInfoWindow(title, content.join("<br/>")),
    offset: new AMap.Pixel(16, -45)
});

//构建自定义信息窗体
function createInfoWindow(title, content) {
    var info = document.createElement("div");
    var top = document.createElement("div");
    var titleD = document.createElement("div");
    var closeX = document.createElement("img");
    top.className = "info-top";
    titleD.style.height="35px";
    titleD.style.backgroundColor="#000000";
    titleD.innerHTML = title;
    closeX.src = "https://webapi.amap.com/images/close2.gif";
    closeX.onclick = closeInfoWindow;
    top.appendChild(titleD);
    top.appendChild(closeX);
    info.appendChild(top);

    // 定义中部内容
    var middle = document.createElement("div");
    middle.className = "info-middle";
    middle.style.backgroundColor = 'white';
    middle.innerHTML = content;
    info.appendChild(middle);


    // 定义底部内容
    var bottom = document.createElement("div");
    bottom.className = "info-bottom";
    bottom.style.position = 'relative';
    bottom.style.top = '0px';
    bottom.style.margin = '0 auto';
    var sharp = document.createElement("img");
    sharp.src = "https://webapi.amap.com/images/sharp.png";
    bottom.appendChild(sharp);
    info.appendChild(bottom);
    return info;
}
//关闭信息窗体
function closeInfoWindow() {
    map.clearInfoWindow();
}


var marker4 = new AMap.Marker({
    map: map,
    position: [109.236058,34.616973]
});
//鼠标点击marker弹出自定义的信息窗体
AMap.event.addListener(marker4, 'click', function () {
    infoWindow4.open(map, marker4.getPosition());
});
//实例化信息窗体
var title = '<span style="font-size:14px;color:#fff;font-weight: bold;font-size: 21px">北屯街道办</span>',
    content = [];
content.push("<div class='input-card content-window-card'>");
content.push("<div style=\"height: 220px\"><!--<h4>高德软件</h4>-->");
content.push("<ul class='u1' style='margin-left: -10px;margin-top: -87px;width:140px;line-height: 35px'>");
content.push("<li>总产值:11971</li>" +
    "<li>农业产值:7531</li>" +
    "<li>林业业产值:70</li>" +
    "<li>牧业产值:4370</li>" +
    "<li>渔业产值:4370</li>" +
    "<li>多种经营:4370</li>" +
    "</ul></div></div>");

var infoWindow4 = new AMap.InfoWindow({
    isCustom: true,  //使用自定义窗体
    content: createInfoWindow(title, content.join("<br/>")),
    offset: new AMap.Pixel(16, -45)
});

//构建自定义信息窗体
function createInfoWindow(title, content) {
    var info = document.createElement("div");
    var top = document.createElement("div");
    var titleD = document.createElement("div");
    var closeX = document.createElement("img");
    top.className = "info-top";
    titleD.style.height="35px";
    titleD.style.backgroundColor="#000000";
    titleD.innerHTML = title;
    closeX.src = "https://webapi.amap.com/images/close2.gif";
    closeX.onclick = closeInfoWindow;
    top.appendChild(titleD);
    top.appendChild(closeX);
    info.appendChild(top);

    // 定义中部内容
    var middle = document.createElement("div");
    middle.className = "info-middle";
    middle.style.backgroundColor = 'white';
    middle.innerHTML = content;
    info.appendChild(middle);


    // 定义底部内容
    var bottom = document.createElement("div");
    bottom.className = "info-bottom";
    bottom.style.position = 'relative';
    bottom.style.top = '0px';
    bottom.style.margin = '0 auto';
    var sharp = document.createElement("img");
    sharp.src = "https://webapi.amap.com/images/sharp.png";
    bottom.appendChild(sharp);
    info.appendChild(bottom);
    return info;
}
//关闭信息窗体
function closeInfoWindow() {
    map.clearInfoWindow();
}





var marker5 = new AMap.Marker({
    map: map,
    position: [109.304503,34.638013]
});
//鼠标点击marker弹出自定义的信息窗体
AMap.event.addListener(marker5, 'click', function () {
    infoWindow5.open(map, marker5.getPosition());
});
//实例化信息窗体
var title = '<span style="font-size:14px;color:#fff;font-weight: bold;font-size: 21px">武屯镇</span>',
    content = [];
content.push("<div class='input-card content-window-card'>");
content.push("<div style=\"height: 220px\"><!--<h4>高德软件</h4>-->");
content.push("<ul class='u1' style='margin-left: -10px;margin-top: -87px;width:140px;line-height: 35px'>");
content.push("<li>总产值:11971</li>" +
    "<li>农业产值:7531</li>" +
    "<li>林业业产值:70</li>" +
    "<li>牧业产值:4370</li>" +
    "<li>渔业产值:4370</li>" +
    "<li>多种经营:4370</li>" +
    "</ul></div></div>");

var infoWindow5 = new AMap.InfoWindow({
    isCustom: true,  //使用自定义窗体
    content: createInfoWindow(title, content.join("<br/>")),
    offset: new AMap.Pixel(16, -45)
});

//构建自定义信息窗体
function createInfoWindow(title, content) {
    var info = document.createElement("div");
    var top = document.createElement("div");
    var titleD = document.createElement("div");
    var closeX = document.createElement("img");
    top.className = "info-top";
    titleD.style.height="35px";
    titleD.style.backgroundColor="#000000";
    titleD.innerHTML = title;
    closeX.src = "https://webapi.amap.com/images/close2.gif";
    closeX.onclick = closeInfoWindow;
    top.appendChild(titleD);
    top.appendChild(closeX);
    info.appendChild(top);

    // 定义中部内容
    var middle = document.createElement("div");
    middle.className = "info-middle";
    middle.style.backgroundColor = 'white';
    middle.innerHTML = content;
    info.appendChild(middle);


    // 定义底部内容
    var bottom = document.createElement("div");
    bottom.className = "info-bottom";
    bottom.style.position = 'relative';
    bottom.style.top = '0px';
    bottom.style.margin = '0 auto';
    var sharp = document.createElement("img");
    sharp.src = "https://webapi.amap.com/images/sharp.png";
    bottom.appendChild(sharp);
    info.appendChild(bottom);
    return info;
}
//关闭信息窗体
function closeInfoWindow() {
    map.clearInfoWindow();
}


var marker6 = new AMap.Marker({
    map: map,
    position: [109.381348,34.691388]
});
//鼠标点击marker弹出自定义的信息窗体
AMap.event.addListener(marker6, 'click', function () {
    infoWindow6.open(map, marker6.getPosition());
});
//实例化信息窗体
var title = '<span style="font-size:14px;color:#fff;font-weight: bold;font-size: 21px">关山镇</span>',
    content = [];
content.push("<div class='input-card content-window-card'>");
content.push("<div style=\"height: 220px\"><!--<h4>高德软件</h4>-->");
content.push("<ul class='u1' style='margin-left: -10px;margin-top: -87px;width:140px;line-height: 35px'>");
content.push("<li>总产值:11971</li>" +
    "<li>农业产值:7531</li>" +
    "<li>林业业产值:70</li>" +
    "<li>牧业产值:4370</li>" +
    "<li>渔业产值:4370</li>" +
    "<li>多种经营:4370</li>" +
    "</ul></div></div>");

var infoWindow6 = new AMap.InfoWindow({
    isCustom: true,  //使用自定义窗体
    content: createInfoWindow(title, content.join("<br/>")),
    offset: new AMap.Pixel(16, -45)
});

//构建自定义信息窗体
function createInfoWindow(title, content) {
    var info = document.createElement("div");
    var top = document.createElement("div");
    var titleD = document.createElement("div");
    var closeX = document.createElement("img");
    top.className = "info-top";
    titleD.style.height="35px";
    titleD.style.backgroundColor="#000000";
    titleD.innerHTML = title;
    closeX.src = "https://webapi.amap.com/images/close2.gif";
    closeX.onclick = closeInfoWindow;
    top.appendChild(titleD);
    top.appendChild(closeX);
    info.appendChild(top);

    // 定义中部内容
    var middle = document.createElement("div");
    middle.className = "info-middle";
    middle.style.backgroundColor = 'white';
    middle.innerHTML = content;
    info.appendChild(middle);


    // 定义底部内容
    var bottom = document.createElement("div");
    bottom.className = "info-bottom";
    bottom.style.position = 'relative';
    bottom.style.top = '0px';
    bottom.style.margin = '0 auto';
    var sharp = document.createElement("img");
    sharp.src = "https://webapi.amap.com/images/sharp.png";
    bottom.appendChild(sharp);
    info.appendChild(bottom);
    return info;
}
//关闭信息窗体
function closeInfoWindow() {
    map.clearInfoWindow();
}


var opts = {
    subdistrict: 0,
    extensions: 'all',
    level: 'city'
};
//利用行政区查询获取边界构建mask路径
//也可以直接通过经纬度构建mask路径
var district = new AMap.DistrictSearch(opts);
district.search('西安市', function (status, result) {
    var bounds = result.districtList[0].boundaries;
    var mask = []
    for (var i = 0; i < bounds.length; i += 1) {
        mask.push([bounds[i]])
    }
    var maskerIn = new AMap.Marker({
        position: [109.227843, 34.663092],
    })
    //添加高度面
    var object3Dlayer = new AMap.Object3DLayer({zIndex: 1});
    map.add(object3Dlayer)
    var height = -8000;
    var color = '#0088ffcc';//rgba
    var wall = new AMap.Object3D.Wall({
        path: bounds,
        height: height,
        color: color
    });
    wall.transparent = true
    object3Dlayer.add(wall)
    //添加描边
    for (var i = 0; i < bounds.length; i += 1) {
        new AMap.Polyline({
            path: bounds[i],
            strokeColor: '#0088ffcc',
            // strokeWeight: 4,
            map: map
        })
    }
});
var district1 = new AMap.DistrictSearch(opts);
district1.search('阎良区', function (status, result) {
    var bounds1 = result.districtList[0].boundaries;
    var polygon1 = new AMap.Polygon({
        map: map,
        path: bounds1,//设置多边形边界路径
        strokeColor: "#FF34FF", //线颜色
        strokeOpacity: 0.2, //线透明度
        strokeWeight: 3,    //线宽
        //fillColor: "yellow", //填充色
        fillOpacity: 0.8//填充透明度
    });

    /* polygon1.on('click', showInfoP)
     function showInfoP(){
         alert("阎良区");
     }*/
});