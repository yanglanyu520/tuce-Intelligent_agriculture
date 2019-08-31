
var myChart1 = echarts.init(document.getElementById("p1"));
var option1 = {
    /*  backgroundColor:'#000',*/
    tooltip: {},
    grid:{
        top:'5%',
    },
    legend: {
        data:['阎良区各街镇总产值统计(单位:万元)'],
        right:'10%',
        top:'5%',
        textStyle:{
            color:'#fff',
            fontSize:12,
        }
    },
    xAxis: {
        data: ["凤凰路街道办","新华路街道办","振兴街道办","新兴街道办"," 北屯街道办","武屯镇","关山镇"],       //横坐标
        axisTick:{
            show:false,
        },
        axisLabel:{
            interval: 0,
            rotate:25,
            textStyle: {
                color:'#fff',
                fontSize:12,
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
        name: '阎良区各街镇总产值统计(单位:万元)',
        type: 'bar',
        barWidth:15,
        data: [30,49,26,60,26,30,20],        //数据
        itemStyle: {
            normal: {
                color: new echarts.graphic.LinearGradient(
                    0, 0, 0, 1,
                    [
                        {offset: 0, color: '#06B5D7'},                   //柱图渐变色
                        {offset: 0.5, color: '#44C0C1'},                 //柱图渐变色
                        {offset: 1, color: '#71C8B1'},                   //柱图渐变色
                    ]
                )
            },
            emphasis: {
                color: new echarts.graphic.LinearGradient(
                    0, 0, 0, 1,
                    [
                        {offset: 0, color: '#71C8B1'},                  //柱图高亮渐变色
                        {offset: 0.7, color: '#44C0C1'},                //柱图高亮渐变色
                        {offset: 1, color: '#06B5D7'}                   //柱图高亮渐变色
                    ]
                )
            }
        },
    }]
};
myChart1.setOption(option1);


var myChart2 = echarts.init(document.getElementById("p2"));
var option2 = {
    /*  backgroundColor:'#000',*/
    tooltip: {},
    grid:{
        top:'5%',
    },
    legend: {
        data:['阎良区各街镇农业总产值统计(单位:万元)'],
        right:'10%',
        top:'5%',
        textStyle:{
            color:'#fff',
            fontSize:12,
        }
    },
    xAxis: {
        data: ["凤凰路街道办","新华路街道办","振兴街道办","新兴街道办"," 北屯街道办","武屯镇","关山镇"],       //横坐标
        axisTick:{
            show:false,
        },
        axisLabel:{
            interval: 0,
            rotate:25,
            textStyle: {
                color:'#fff',
                fontSize:12,
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
        name: '阎良区各街镇农业总产值统计(单位:万元)',
        type: 'bar',
        barWidth:15,
        data: [30,49,26,60,26,30,20],        //数据
        itemStyle: {
            normal: {
                color: new echarts.graphic.LinearGradient(
                    0, 0, 0, 1,
                    [
                        {offset: 0, color: '#CD8500'},                   //柱图渐变色
                        {offset: 0.5, color: '#CD6889'},                 //柱图渐变色
                        {offset: 1, color: '#71C8B1'},                   //柱图渐变色
                    ]
                )
            },
            emphasis: {
                color: new echarts.graphic.LinearGradient(
                    0, 0, 0, 1,
                    [
                        {offset: 0, color: '#71C8B1'},                  //柱图高亮渐变色
                        {offset: 0.7, color: '#CD6889'},                //柱图高亮渐变色
                        {offset: 1, color: '#CD8500'}                   //柱图高亮渐变色
                    ]
                )
            }
        },
    }]
};
myChart2.setOption(option2);




var myChart3 = echarts.init(document.getElementById("p3"));
var option3 = {
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        textStyle:{
            fontSize: 18,//字体大小
            color: '#ffffff'//字体颜色
        },
        data: ['林业'],
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
        data: ["凤凰路街道办","新华路街道办","振兴街道办","新兴街道办"," 北屯街道办","武屯镇","关山镇"],
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
        name: '林业',
        type: 'line',
        data: [800,900,220,130,660,289,100],
        color: "#ffffff",
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
myChart3.setOption(option3);


var myChart4 = echarts.init(document.getElementById("p4"));
var option4 = {
    /*  backgroundColor:'#000',*/
    tooltip: {},
    grid:{
        top:'5%',
    },
    legend: {
        data:['阎良区各街镇牧业总产值统计(单位:万元)'],
        right:'10%',
        top:'5%',
        textStyle:{
            color:'#fff',
            fontSize:12,
        }
    },
    xAxis: {
        data: ["凤凰路街道办","新华路街道办","振兴街道办","新兴街道办"," 北屯街道办","武屯镇","关山镇"], //横坐标
        axisTick:{
            show:false,
        },
        axisLabel:{
            interval: 0,
            rotate:25,
            textStyle: {
                color:'#fff',
                fontSize:12,
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
        name: '阎良区各街镇牧业总产值统计(单位:万元)',
        type: 'bar',
        barWidth:15,
        data: [30,49,26,60,26,30,20],        //数据
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
myChart4.setOption(option4);


var myChart5 = echarts.init(document.getElementById("p5"));
var option5 = {
    title : {
        text: '阎良区各街镇渔业总产值统计(单位:万元)',
        x:'center',
        textStyle:{
            color:'#fff',
            fontSize:12,
        }
    },
    tooltip : {
        trigger: 'item',
        formatter: "{a} <br/>{b} : {c} ({d}%)"
    },
    legend: {
        orient: 'vertical',
        left: 'left',
        data: ["凤凰路街道办","新华路街道办","振兴街道办","新兴街道办"," 北屯街道办","武屯镇","关山镇"],
        textStyle:{
            color:'#fff',
            fontSize:12,
        },
    },
    series : [
        {
            name: '访问来源',
            type: 'pie',
            radius : '55%',
            center: ['50%', '60%'],
            data:[
                {value:335, name:'凤凰路街道办'},
                {value:310, name:'新华路街道办'},
                {value:234, name:'振兴街道办'},
                {value:135, name:'新兴街道办'},
                {value:1548, name:'北屯街道办'},
                {value:1548, name:'武屯镇'},
                {value:1548, name:'关山镇'},
            ],
            itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }
    ]
};

myChart5.setOption(option5);