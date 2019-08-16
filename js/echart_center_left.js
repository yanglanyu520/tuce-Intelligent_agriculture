
let myChart = echarts.init(document.getElementById("select"));
let option = {
    backgroundColor: "transparent",
    color: ["#9932CD"],
    tooltip: {
        trigger: 'axis'
    },
    xAxis:[
        {
            type: 'category',
            splitLine:{show: false},
            boundaryGap: false,
            data: ['1', '3', '5', '7', '9', '11', '13','15','17','19'],
            axisLabel: {
                show: true,
                textStyle: {
                    color: '#ffffff'
                }
            }
        },
    ],
    yAxis: {
        x: 'center',
        type: 'value',
        axisLabel: {
            show: true,
            textStyle: {
                color: '#ffffff'
            }
        },
        splitLine: {
            show: true,
            lineStyle:{
                color: ['#6089ff'],
                width: 1,
                type: 'solid'
            },

        }
    },
    series: [{
        name: '温度',
        type: 'line',
        data: [20, 25, 10, 30, 40, 20, 50,10,60,15]
    }]
};
myChart.setOption(option);

let myChart1 = echarts.init(document.getElementById("select1"));
let option1 = {
    backgroundColor: "transparent",
    color: ["#9932CD"],
    tooltip: {
        trigger: 'axis'
    },
    xAxis:[
        {
            type: 'category',
            splitLine:{show: false},
            boundaryGap: false,
            data: ['1', '3', '5', '7', '9', '11', '13','15','17','19'],
            axisLabel: {
                show: true,
                textStyle: {
                    color: '#ffffff'
                }
            }
        },
    ],
    yAxis: {
        x: 'center',
        type: 'value',
        axisLabel: {
            show: true,
            textStyle: {
                color: '#ffffff'
            }
        },
        splitLine: {
            show: true,
            lineStyle:{
                color: ['#6089ff'],
                width: 1,
                type: 'solid'
            },

        }
    },
    series: [{
        name: '温度',
        type: 'line',
        data: [10, 20, 60, 20, 10, 50, 40,30,20,60]
    }]
};
myChart1.setOption(option1);

let myChart2 = echarts.init(document.getElementById("select2"));
let option2 = {
    backgroundColor: "transparent",
    color: ["#9932CD"],
    tooltip: {
        trigger: 'axis'
    },
    xAxis:[
        {
            type: 'category',
            splitLine:{show: false},
            boundaryGap: false,
            data: ['1', '3', '5', '7', '9', '11', '13','15','17','19'],
            axisLabel: {
                show: true,
                textStyle: {
                    color: '#ffffff'
                }
            }
        },
    ],
    yAxis: {
        x: 'center',
        type: 'value',
        axisLabel: {
            show: true,
            textStyle: {
                color: '#ffffff'
            }
        },
        splitLine: {
            show: true,
            lineStyle:{
                color: ['#6089ff'],
                width: 1,
                type: 'solid'
            },

        }
    },
    series: [{
        name: '温度',
        type: 'line',
        data: [10, 2, 30, 20, 30, 60, 20,10,60,5]
    }]
};
myChart2.setOption(option2);

let myChart3 = echarts.init(document.getElementById("select3"));
let option3 = {
    backgroundColor: "transparent",
    color: ["#9932CD"],
    tooltip: {
        trigger: 'axis'
    },
    xAxis:[
        {
            type: 'category',
            splitLine:{show: false},
            boundaryGap: false,
            data: ['1', '3', '5', '7', '9', '11', '13','15','17','19'],
            axisLabel: {
                show: true,
                textStyle: {
                    color: '#ffffff'
                }
            }
        },
    ],
    yAxis: {
        x: 'center',
        type: 'value',
        axisLabel: {
            show: true,
            textStyle: {
                color: '#ffffff'
            }
        },
        splitLine: {
            show: true,
            lineStyle:{
                color: ['#6089ff'],
                width: 1,
                type: 'solid'
            },

        }
    },
    series: [{
        name: '温度',
        type: 'line',
        data: [60, 15, 10, 60, 50, 20, 30,60,60,15]
    }]
};
myChart3.setOption(option3);