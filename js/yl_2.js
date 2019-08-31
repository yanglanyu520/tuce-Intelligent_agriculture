
var myChart = echarts.init(document.getElementById("p1_1"));
var option = {
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        textStyle:{
            fontSize: 18,//字体大小
            color: '#ffffff'//字体颜色
        },
        data: ['总资产(年份)'],
      /*  color: ["#ffffff"],*/
        left: 'center',
        bottom: 'bottom'

    },
    grid: {
        top: 'middle',
        left: '3%',
        right: '4%',
        bottom: '3%',
        height: '80%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: [1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017],
        axisLabel:{
            formatter: function (value) {
                //x轴的文字改为竖版显示
                var str = value.split("");
                return str.join("\n");
            }
        },
        axisLine: {
            lineStyle: {
                color: "#ffffff",
                fontSize:2,
                formatter: function (value) {
                    //x轴的文字改为竖版显示
                    var str = value.split("");
                    return str.join("\n");
                }
            }
        }
    },
    yAxis: {
        type: 'value',
        splitLine: {
            lineStyle: {
                type: 'dashed',
                color: '#DDD'
            }
        },
        axisLine: {
            show: false,
            lineStyle: {
                color: "#ffffff"
            },
        },
        nameTextStyle: {
            color: "#999"
        },
        splitArea: {
            show: false
        }
    },
    series: [{
        name: '总资产(年份)',
        type: 'line',
        data: [800,900,220,130,660,289,100,100,100,200,300,120,100,110,140,250,350,180,130,200],
        color: "#ffffff",
        lineStyle: {
            normal: {
                width: 5,
                color: {
                    type: 'linear',
                    colorStops: [{
                        offset: 0,
                        color: '#FFCAD4' // 0% 处的颜色
                    }, {
                        offset: 0.4,
                        color: '#F58080' // 100% 处的颜色
                    }, {
                        offset: 1,
                        color: '#F58080' // 100% 处的颜色
                    }],
                    globalCoord: false // 缺省为 false
                },
                shadowColor: 'rgba(245,128,128, 0.5)',
                shadowBlur: 10,
                shadowOffsetY: 7
            }
        },
    },
    ]
};
myChart.setOption(option);

var myChart1 = echarts.init(document.getElementById("p3_3"));
var option1 = {
    /*  backgroundColor:'#000',*/
    tooltip: {},
    grid:{
        top:'5%',
    },
    legend: {
        data:['农业指数(单位:万元)'],
        right:'10%',
        top:'5%',
        textStyle:{
            color:'#fff',
            fontSize:10,
        }
    },
    xAxis: {
        data: [1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017], //横坐标
        axisTick:{
            show:false,
        },
        axisLabel:{
            interval: 0,
            rotate:25,
            textStyle: {
                color:'#fff',
                fontSize:11,
            }
        },
        axisLine: {
            lineStyle: {
                type: 'solid',
                color:'#fff',
                width:'1  ',                                                //坐标线的宽度

            }
        },
    },
    yAxis: {
        splitLine: {
            show: true,
            lineStyle:{
                color: '#40A1EA',                                         //网格横线颜色
                width: 1,
                type: 'solid'
            }
        },
        axisLabel: {
            textStyle: {
                color: '#fff',
                fontSize:12,//坐标值得具体的颜色
            }
        },
        axisLine: {
            show:false,
        },
    },
    series: [{
        name: '农业指数(单位:万元)',
        type: 'bar',
        barWidth:12,
        data: [800,900,220,130,660,289,100,100,100,200,300,120,100,110,140,250,350,180,130,200,100],        //数据
        itemStyle: {
            normal: {
                color: new echarts.graphic.LinearGradient(
                    0, 0, 0, 1,
                    [
                        {offset: 0, color: '#8B0A50'},                   //柱图渐变色
                        {offset: 0.5, color: '#8B008B'},                 //柱图渐变色
                        {offset: 1, color: '#8B2323'},                   //柱图渐变色
                    ]
                )
            },
            emphasis: {
                color: new echarts.graphic.LinearGradient(
                    0, 0, 0, 1,
                    [
                        {offset: 0, color: '#8B0A50'},                  //柱图高亮渐变色
                        {offset: 0.7, color: '#8B008B'},                //柱图高亮渐变色
                        {offset: 1, color: '#8B2323'}                   //柱图高亮渐变色
                    ]
                )
            }
        },
    }]
};
myChart1.setOption(option1);

var myChart3 = echarts.init(document.getElementById("p2_2"));
var option3 = {
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        textStyle:{
            fontSize: 18,//字体大小
            color: '#ffffff'//字体颜色
        },
      /*  color: ["#F58080", "#47D8BE", "#F9A589"],*/
        data: ['林业指数(年份)'],
        left: 'center',
        bottom: 'bottom'
    },
    grid: {
        top: 'middle',
        left: '3%',
        right: '4%',
        bottom: '3%',
        height: '80%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: [1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017],
        axisLabel:{
            formatter: function (value) {
                //x轴的文字改为竖版显示
                var str = value.split("");
                return str.join("\n");
            }
        },
        axisLine: {
            lineStyle: {
                color: "#ffffff",
                fontSize:2,
                formatter: function (value) {
                    //x轴的文字改为竖版显示
                    var str = value.split("");
                    return str.join("\n");
                }
            }
        }
    },
    yAxis: {
        type: 'value',
        splitLine: {
            lineStyle: {
                type: 'dashed',
                color: '#DDD'
            }
        },
        axisLine: {
            show: false,
            lineStyle: {
                color: "#ffffff"
            },
        },
        nameTextStyle: {
            color: "#999"
        },
        splitArea: {
            show: false
        }
    },
    series: [{
        name: '林业指数(年份)',
        type: 'line',
        data: [800,900,220,130,660,289,100,100,100,200,300,120,100,110,140,250,350,180,130,200],
        color: "#F58080",
        lineStyle: {
            normal: {
                width: 5,
                color: {
                    type: 'linear',
                    colorStops: [{
                        offset: 0,
                        color: '#7A378B' // 0% 处的颜色
                    }, {
                        offset: 0.4,
                        color: '#7A378B' // 100% 处的颜色
                    }, {
                        offset: 1,
                        color: '#7A378B' // 100% 处的颜色
                    }],
                    globalCoord: false // 缺省为 false
                },
                shadowColor: 'rgba(245,128,128, 0.5)',
                shadowBlur: 10,
                shadowOffsetY: 7
            }
        },
    },
    ]
};
myChart3.setOption(option3);




var myChart4 = echarts.init(document.getElementById("p4_4"));
var option4 = {
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        textStyle:{
            fontSize: 18,//字体大小
            color: '#ffffff'//字体颜色
        },
        /*  color: ["#F58080", "#47D8BE", "#F9A589"],*/
        data: ['牧业指数(年份)'],
        left: 'center',
        bottom: 'bottom'
    },
    grid: {
        top: 'middle',
        left: '3%',
        right: '4%',
        bottom: '3%',
        height: '80%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: [1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017],
        axisLabel:{
            formatter: function (value) {
                //x轴的文字改为竖版显示
                var str = value.split("");
                return str.join("\n");
            }
        },
        axisLine: {
            lineStyle: {
                color: "#ffffff",
                fontSize:2,
                formatter: function (value) {
                    //x轴的文字改为竖版显示
                    var str = value.split("");
                    return str.join("\n");
                }
            }
        }
    },
    yAxis: {
        type: 'value',
        splitLine: {
            lineStyle: {
                type: 'dashed',
                color: '#DDD'
            }
        },
        axisLine: {
            show: false,
            lineStyle: {
                color: "#ffffff"
            },
        },
        nameTextStyle: {
            color: "#999"
        },
        splitArea: {
            show: false
        }
    },
    series: [{
        name: '牧业指数(年份)',
        type: 'line',
        data: [800,900,220,130,660,289,100,100,100,200,300,120,100,110,140,250,350,180,130,200],
        color: "#F58080",
        lineStyle: {
            normal: {
                width: 5,
                color: {
                    type: 'linear',
                    colorStops: [{
                        offset: 0,
                        color: '#76EEC6' // 0% 处的颜色
                    }, {
                        offset: 0.4,
                        color: '#76EE00' // 100% 处的颜色
                    }, {
                        offset: 1,
                        color: '#71C671' // 100% 处的颜色
                    }],
                    globalCoord: false // 缺省为 false
                },
                shadowColor: 'rgba(245,128,128, 0.5)',
                shadowBlur: 10,
                shadowOffsetY: 7
            }
        },
    },
    ]
};
myChart4.setOption(option4);


var myChart4 = echarts.init(document.getElementById("p5_5"));
var option4 = {
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        textStyle:{
            fontSize: 18,//字体大小
            color: '#ffffff'//字体颜色
        },
        /*  color: ["#F58080", "#47D8BE", "#F9A589"],*/
        data: ['渔业指数(年份)'],
        left: 'center',
        bottom: 'bottom'
    },
    grid: {
        top: 'middle',
        left: '3%',
        right: '4%',
        bottom: '3%',
        height: '80%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: [1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017],
        axisLabel:{
            formatter: function (value) {
                //x轴的文字改为竖版显示
                var str = value.split("");
                return str.join("\n");
            }
        },
        axisLine: {
            lineStyle: {
                color: "#ffffff",
                fontSize:2,
                formatter: function (value) {
                    //x轴的文字改为竖版显示
                    var str = value.split("");
                    return str.join("\n");
                }
            }
        }
    },
    yAxis: {
        type: 'value',
        splitLine: {
            lineStyle: {
                type: 'dashed',
                color: '#DDD'
            }
        },
        axisLine: {
            show: false,
            lineStyle: {
                color: "#ffffff"
            },
        },
        nameTextStyle: {
            color: "#999"
        },
        splitArea: {
            show: false
        }
    },
    series: [{
        name: '渔业指数(年份)',
        type: 'line',
        data: [800,900,220,130,660,289,100,100,100,200,300,120,100,110,140,250,350,180,130,200],
        color: "#F58080",
        lineStyle: {
            normal: {
                width: 5,
                color: {
                    type: 'linear',
                    colorStops: [{
                        offset: 0,
                        color: '#FFF000' // 0% 处的颜色
                    }, {
                        offset: 0.4,
                        color: '#FFF000' // 100% 处的颜色
                    }, {
                        offset: 1,
                        color: '#FFF000' // 100% 处的颜色
                    }],
                    globalCoord: false // 缺省为 false
                },
                shadowColor: 'rgba(245,128,128, 0.5)',
                shadowBlur: 10,
                shadowOffsetY: 7
            }
        },
    },
    ]
};
myChart4.setOption(option4);