var map = new AMap.Map('bigPic', {
    center: [109.471763,34.643056],
    disableSocket: true,
    mapStyle: 'amap://styles/c60552abf431f4b75caf3f066a7cb351',
    // viewMode: '3D',
    // features: ['bg', 'road', 'building', 'point'],
    zoom: 12,
});
 var fhl = new AMap.Marker({
    map: map,
    position: [109.221279,34.660357],
    icon: new AMap.Icon({
        size: new AMap.Size(50, 50),  //图标大小
        image: 'img/fhj.png',
        imageOffset: new AMap.Pixel(0, -60)
    })
});
 var xhl=new AMap.Marker({
    map: map,
    position: [109.242576,34.65826],
    icon: new AMap.Icon({
        size: new AMap.Size(50, 50),  //图标大小
        image: "http://webapi.amap.com/theme/v1.3/images/newpc/way_btn2.png",
        imageOffset: new AMap.Pixel(0, -60)
    })
});
 var zxj = new AMap.Marker({
    map: map,
    position: [109.196508,34.667291],
    icon: new AMap.Icon({
        size: new AMap.Size(50, 50),  //图标大小
        image: "http://webapi.amap.com/theme/v1.3/images/newpc/way_btn2.png",
        imageOffset: new AMap.Pixel(0, -60)
    })
});
var xx = new AMap.Marker({
    map: map,
    position: [109.278273,34.666176],
    icon: new AMap.Icon({
        size: new AMap.Size(50, 50),  //图标大小
        image: "http://webapi.amap.com/theme/v1.3/images/newpc/way_btn2.png",
        imageOffset: new AMap.Pixel(0, -60)
    })
});
var bt = new AMap.Marker({
    map: map,
    position: [109.236058,34.616973],
    icon: new AMap.Icon({
        size: new AMap.Size(50, 50),  //图标大小
        image: "http://webapi.amap.com/theme/v1.3/images/newpc/way_btn2.png",
        imageOffset: new AMap.Pixel(0, -60)
    })
});
var wt = new AMap.Marker({
    map: map,
    position: [109.304503,34.638013],
    icon: new AMap.Icon({
        size: new AMap.Size(50, 50),  //图标大小
        image: "http://webapi.amap.com/theme/v1.3/images/newpc/way_btn2.png",
        imageOffset: new AMap.Pixel(0, -60)
    })
});
var gs = new AMap.Marker({
    map: map,
    position: [109.381348,34.691388],
    icon: new AMap.Icon({
        size: new AMap.Size(50, 50),  //图标大小
        image: "http://webapi.amap.com/theme/v1.3/images/newpc/way_btn2.png",
        imageOffset: new AMap.Pixel(0, -60)
    })
});
fhl.on("click",function () {
      alert("xxxx");
  })

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
