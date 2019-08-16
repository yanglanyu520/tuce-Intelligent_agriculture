let myChart4 = echarts.init(document.getElementById("yibiao"));
let option4 = {
    title: {
        show: true
    },
    tooltip: {
        show: true,
        formatter: "{a}：{b}{c}%"
    },
    series: [
        {
            name: "彩虹仪表盘",
            data: [{ value: 35, name: "空气温度" }],
            type: "gauge",
            min: 0,
            max: 100,
            splitNumber: 6,
            radius: "100%",
            center: ["50%", "40%"],
            axisLine: {
                show: true,
                lineStyle: {
                    width: 2,
                    shadowBlur: 0,
                    color: [[0.2, "#22bbb9"], [0.8, "#614ec0"], [1, "#ee4b72"]]
                }
            },
            axisTick: {
                show: false //小刻度
            },
            axisLabel: {
                show: false,
                textStyle: {
                    fontSize: 12
                }
            },
            splitLine: {
                show: true,
                length: 8, // 分隔线线长。支持相对半径的百分比,默认 30。
                lineStyle: {
// 分隔线样式。
                    color: "auto", //线的颜色,默认 #eee。//刻度颜色
                    opacity: 1, //图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。
                    width: 2, //线度,默认 2。
                    type: "solid", //线的类型,默认 solid。 此外还有 dashed,dotted
                    shadowBlur: 10, //(发光效果)图形阴影的模糊大小。该属性配合 shadowColor,shadowOffsetX, shadowOffsetY 一起设置图形的阴影效果。
                    shadowColor: "#fff" //阴影颜色。支持的格式同color。
                }
            },
            pointer: {
                show: true,
                width: "8%",
                length: "60%",
                color: "#fff"
            },
            itemStyle: {//指针颜色
                normal: {
                    color: "#ffb739"
                }
            },
            title: {
                offsetCenter: [0, "135%"],
                textStyle: {
                    fontSize: 16,
                    color: "#fff"
                }
            },
            detail: {
                formatter: "{value}℃",
                offsetCenter: ["0", "55%"],
                textStyle: {
                    fontSize: 12,
                    color: "#fff"
                },

            },
        }
    ]
};
myChart4.setOption(option4);

let myChart5 = this.echarts.init(document.getElementById("yibiao1"));
let option5 = {
    title: {
        show: true
    },
    tooltip: {
        show: true,
        formatter: "{a}：{b}{c}%"
    },
    series: [
        {
            name: "彩虹仪表盘",
            data: [{ value: 60, name: "空气湿度" }],
            type: "gauge",
            min: 0,
            max: 100,
            splitNumber: 6,
            radius: "100%",
            center: ["50%", "40%"],
            axisLine: {
                show: true,
                lineStyle: {
                    width: 2,
                    shadowBlur: 0,
                    color: [[0.2, "#22bbb9"], [0.8, "#614ec0"], [1, "#ee4b72"]]
                }
            },
            axisTick: {
                show: false //小刻度
            },
            axisLabel: {
                show: false,
                textStyle: {
                    fontSize: 12
                }
            },
            splitLine: {
                show: true,
                length: 8, // 分隔线线长。支持相对半径的百分比,默认 30。
                lineStyle: {
// 分隔线样式。
                    color: "auto", //线的颜色,默认 #eee。//刻度颜色
                    opacity: 1, //图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。
                    width: 2, //线度,默认 2。
                    type: "solid", //线的类型,默认 solid。 此外还有 dashed,dotted
                    shadowBlur: 10, //(发光效果)图形阴影的模糊大小。该属性配合 shadowColor,shadowOffsetX, shadowOffsetY 一起设置图形的阴影效果。
                    shadowColor: "#fff" //阴影颜色。支持的格式同color。
                }
            },
            pointer: {
                show: true,
                width: "8%",
                length: "60%",
                color: "#fff"
            },
            itemStyle: {//指针颜色
                normal: {
                    color: "#ffb739"
                }
            },
            title: {
                offsetCenter: [0, "135%"],
                textStyle: {
                    fontSize: 16,
                    color: "#fff"
                }
            },
            detail: {
                formatter: "{value}%",
                offsetCenter: ["0", "55%"],
                textStyle: {
                    fontSize: 12,
                    color: "#fff"
                },

            },
        }
    ]
};
myChart5.setOption(option5);

let myChart6 = this.echarts.init(document.getElementById("yibiao2"));
let option6 = {
    title: {
        show: true
    },
    tooltip: {
        show: true,
        formatter: "{a}：{b}{c}%"
    },
    series: [
        {
            name: "彩虹仪表盘",
            data: [{ value: 75, name: "光照" }],
            type: "gauge",
            min: 0,
            max: 100,
            splitNumber: 6,
            radius: "100%",
            center: ["50%", "40%"],
            axisLine: {
                show: true,
                lineStyle: {
                    width: 2,
                    shadowBlur: 0,
                    color: [[0.2, "#22bbb9"], [0.8, "#614ec0"], [1, "#ee4b72"]]
                }
            },
            axisTick: {
                show: false //小刻度
            },
            axisLabel: {
                show: false,
                textStyle: {
                    fontSize: 12
                }
            },
            splitLine: {
                show: true,
                length: 8, // 分隔线线长。支持相对半径的百分比,默认 30。
                lineStyle: {
// 分隔线样式。
                    color: "auto", //线的颜色,默认 #eee。//刻度颜色
                    opacity: 1, //图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。
                    width: 2, //线度,默认 2。
                    type: "solid", //线的类型,默认 solid。 此外还有 dashed,dotted
                    shadowBlur: 10, //(发光效果)图形阴影的模糊大小。该属性配合 shadowColor,shadowOffsetX, shadowOffsetY 一起设置图形的阴影效果。
                    shadowColor: "#fff" //阴影颜色。支持的格式同color。
                }
            },
            pointer: {
                show: true,
                width: "8%",
                length: "60%",
                color: "#fff"
            },
            itemStyle: {//指针颜色
                normal: {
                    color: "#ffb739"
                }
            },
            title: {
                offsetCenter: [0, "135%"],
                textStyle: {
                    fontSize: 16,
                    color: "#fff"
                }
            },
            detail: {
                formatter: "{value}lux",
                offsetCenter: ["0", "55%"],
                textStyle: {
                    fontSize: 12,
                    color: "#fff"
                },

            },
        }
    ]
};
myChart6.setOption(option6);

let myChart7 = this.echarts.init(document.getElementById("yibiao3"));
let option7 = {
    title: {
        show: true
    },
    tooltip: {
        show: true,
        formatter: "{a}：{b}{c}%"
    },
    series: [
        {
            name: "彩虹仪表盘",
            data: [{ value: 35, name: "风速" }],
            type: "gauge",
            min: 0,
            max: 100,
            splitNumber: 6,
            radius: "100%",
            center: ["50%", "40%"],
            axisLine: {
                show: true,
                lineStyle: {
                    width: 2,
                    shadowBlur: 0,
                    color: [[0.2, "#22bbb9"], [0.8, "#614ec0"], [1, "#ee4b72"]]
                }
            },
            axisTick: {
                show: false //小刻度
            },
            axisLabel: {
                show: false,
                textStyle: {
                    fontSize: 12
                }
            },
            splitLine: {
                show: true,
                length: 8, // 分隔线线长。支持相对半径的百分比,默认 30。
                lineStyle: {
// 分隔线样式。
                    color: "auto", //线的颜色,默认 #eee。//刻度颜色
                    opacity: 1, //图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。
                    width: 2, //线度,默认 2。
                    type: "solid", //线的类型,默认 solid。 此外还有 dashed,dotted
                    shadowBlur: 10, //(发光效果)图形阴影的模糊大小。该属性配合 shadowColor,shadowOffsetX, shadowOffsetY 一起设置图形的阴影效果。
                    shadowColor: "#fff" //阴影颜色。支持的格式同color。
                }
            },
            pointer: {
                show: true,
                width: "8%",
                length: "60%",
                color: "#fff"
            },
            itemStyle: {//指针颜色
                normal: {
                    color: "#ffb739"
                }
            },
            title: {
                offsetCenter: [0, "135%"],
                textStyle: {
                    fontSize: 16,
                    color: "#fff"
                }
            },
            detail: {
                formatter: "{value}m/s",
                offsetCenter: ["0", "55%"],
                textStyle: {
                    fontSize: 12,
                    color: "#fff"
                },

            },
        }
    ]
};
myChart7.setOption(option7);

let myChart8 = this.echarts.init(document.getElementById("yibiao4"));
let option8 = {
    title: {
        show: true
    },
    tooltip: {
        show: true,
        formatter: "{a}：{b}{c}%"
    },
    series: [
        {
            name: "彩虹仪表盘",
            data: [{ value: 35, name: "雨量" }],
            type: "gauge",
            min: 0,
            max: 100,
            splitNumber: 6,
            radius: "100%",
            center: ["50%", "40%"],
            axisLine: {
                show: true,
                lineStyle: {
                    width: 2,
                    shadowBlur: 0,
                    color: [[0.2, "#22bbb9"], [0.8, "#614ec0"], [1, "#ee4b72"]]
                }
            },
            axisTick: {
                show: false //小刻度
            },
            axisLabel: {
                show: false,
                textStyle: {
                    fontSize: 12
                }
            },
            splitLine: {
                show: true,
                length: 8, // 分隔线线长。支持相对半径的百分比,默认 30。
                lineStyle: {
// 分隔线样式。
                    color: "auto", //线的颜色,默认 #eee。//刻度颜色
                    opacity: 1, //图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。
                    width: 2, //线度,默认 2。
                    type: "solid", //线的类型,默认 solid。 此外还有 dashed,dotted
                    shadowBlur: 10, //(发光效果)图形阴影的模糊大小。该属性配合 shadowColor,shadowOffsetX, shadowOffsetY 一起设置图形的阴影效果。
                    shadowColor: "#fff" //阴影颜色。支持的格式同color。
                }
            },
            pointer: {
                show: true,
                width: "8%",
                length: "60%",
                color: "#fff"
            },
            itemStyle: {//指针颜色
                normal: {
                    color: "#ffb739"
                }
            },
            title: {
                offsetCenter: [0, "135%"],
                textStyle: {
                    fontSize: 16,
                    color: "#fff"
                }
            },
            detail: {
                formatter: "{value}%",
                offsetCenter: ["0", "55%"],
                textStyle: {
                    fontSize: 12,
                    color: "#fff"
                },

            },
        }
    ]
};
myChart8.setOption(option8);

let myChart9 = this.echarts.init(document.getElementById("yibiao5"));
let option9 = {
    title: {
        show: true
    },
    tooltip: {
        show: true,
        formatter: "{a}：{b}{c}%"
    },
    series: [
        {
            name: "彩虹仪表盘",
            data: [{ value: 35, name: "大气压" }],
            type: "gauge",
            min: 0,
            max: 100,
            splitNumber: 6,
            radius: "100%",
            center: ["50%", "40%"],
            axisLine: {
                show: true,
                lineStyle: {
                    width: 2,
                    shadowBlur: 0,
                    color: [[0.2, "#22bbb9"], [0.8, "#614ec0"], [1, "#ee4b72"]]
                }
            },
            axisTick: {
                show: false //小刻度
            },
            axisLabel: {
                show: false,
                textStyle: {
                    fontSize: 12
                }
            },
            splitLine: {
                show: true,
                length: 8, // 分隔线线长。支持相对半径的百分比,默认 30。
                lineStyle: {
// 分隔线样式。
                    color: "auto", //线的颜色,默认 #eee。//刻度颜色
                    opacity: 1, //图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。
                    width: 2, //线度,默认 2。
                    type: "solid", //线的类型,默认 solid。 此外还有 dashed,dotted
                    shadowBlur: 10, //(发光效果)图形阴影的模糊大小。该属性配合 shadowColor,shadowOffsetX, shadowOffsetY 一起设置图形的阴影效果。
                    shadowColor: "#fff" //阴影颜色。支持的格式同color。
                }
            },
            pointer: {
                show: true,
                width: "8%",
                length: "60%",
                color: "#fff"
            },
            itemStyle: {//指针颜色
                normal: {
                    color: "#ffb739"
                }
            },
            title: {
                offsetCenter: [0, "135%"],
                textStyle: {
                    fontSize: 16,
                    color: "#fff"
                }
            },
            detail: {
                formatter: "{value}pa",
                offsetCenter: ["0", "55%"],
                textStyle: {
                    fontSize: 12,
                    color: "#fff"
                },
            },
        }
    ]
};
myChart9.setOption(option9);