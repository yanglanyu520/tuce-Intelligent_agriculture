var myChart = echarts.init(document.getElementById("pageEcharts"));
var option = {
    tooltip: {
        trigger: 'item',
        formatter: "{a} <br/>{b}: {c} ({d}%)"
    },
    legend: {
        orient: 'vertical',
        x: 'left',
        data:['年末常用耕地面积(公顷)','农林牧渔及服务业总产值(亿元)','农作物播种面积(公顷)','粮食产量(万吨)'],
        textStyle:{
            color:'#fff',
            fontSize:15,
        },
    },
    series: [
        {
            name:'访问来源',
            type:'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
                normal: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    show: true,
                    textStyle: {
                        fontSize: '30',
                        fontWeight: 'bold'
                    }
                }
            },
            labelLine: {
                normal: {
                    show: false
                }
            },
            data:[
                {value:335, name:'年末常用耕地面积(公顷)'},
                {value:310, name:'农林牧渔及服务业总产值(亿元)'},
                {value:234, name:'农作物播种面积(公顷)'},
                {value:135, name:'粮食产量(万吨)'},
            ]
        }
    ]
};
myChart.setOption(option);
/*var option = {
    /!*  backgroundColor:'#000',*!/
    tooltip: {},
    grid:{
        top:'5%',
    },
    legend: {
        data:['西安市各区耕地面积统计(单位:万亩)'],
        right:'10%',
        top:'5%',
        textStyle:{
            color:'#fff',
            fontSize:12,
        }
    },
    xAxis: {
        data: ["新城","碑林","莲湖","雁塔"," 灞桥","未央","阎良","临潼","长安","高陵县","蓝田县","周至县","户县"],       //横坐标
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
        name: '西安市各区耕地面积统计(单位:万亩)',
        type: 'bar',
        barWidth:15,
        data: [30,49,26,60,26,30,20,30,40,50,30,20,30],        //数据
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
};*/
