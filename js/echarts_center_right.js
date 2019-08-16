
let myChart16 = echarts.init(document.getElementById("select4"));
let option16 = {
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
myChart16.setOption(option16);

let myChart17 = echarts.init(document.getElementById("select5"));
let option17 = {
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
myChart17.setOption(option17);

let myChart18 = echarts.init(document.getElementById("select6"));
let option18 = {
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
myChart18.setOption(option18);

let myChart19 = echarts.init(document.getElementById("select7"));
let option19 = {
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
myChart19.setOption(option19);