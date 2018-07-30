import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Button, Icon, DatePicker, Popover, Dropdown, Menu, Modal, Form, Select, Checkbox, Spin } from 'choerodon-ui';
import { Page, Header, Content, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import moment from 'moment';
import ReactEcharts from 'echarts-for-react';
import ScrumBoardStore from '../../../../../stores/project/scrumBoard/ScrumBoardStore';
import AccumulationStore from '../../../../../stores/project/accumulation/AccumulationStore';
import AccumulationFilter from '../AccumulationComponent/AccumulationFilter';
import './AccumulationHome.scss';
import '../../BurndownChart/BurndownChartHome/BurndownChartHome.scss';
import '../../../../main.scss';
import txt from '../test';
import SwithChart from '../../Component/switchChart';

const { AppState } = stores;
const { RangePicker } = DatePicker;
const Option = Select.Option;

@observer
class AccumulationHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeVisible: false,
      reportVisible: false,
      filterList: [],
      columnDatas: [],
      timeId: '',
      startDate: '',
      endDate: '',
      boardList: [],
      options: {},
      options2: {},
      optionsVisible: false,
      sprintData: {},
      loading: false,
    };
  }
  componentWillMount() {
    AccumulationStore.axiosGetFilterList().then((data) => {
      const newData = _.clone(data);
      for (let index = 0, len = newData.length; index < len; index += 1) {
        newData[index].check = false;
      }
      AccumulationStore.setFilterList(newData);
      ScrumBoardStore.axiosGetBoardList().then((res) => {
        const newData2 = _.clone(res);
        let newIndex;
        for (let index = 0, len = newData2.length; index < len; index += 1) {
          if (newData2[index].userDefault) {
            newData2[index].check = true;
            newIndex = index;
          } else {
            newData2[index].check = false;
          }
        }
        AccumulationStore.setBoardList(newData2);
        this.getColumnData(res[newIndex].boardId, true);
      }).catch((error) => {
      });
      // this.getData();
    }).catch((error) => {
    });
  }
  getColumnData(id, type) {
    ScrumBoardStore.axiosGetBoardData(id, 0, false, []).then((res2) => {
      const data2 = res2.columnsData.columns;
      for (let index = 0, len = data2.length; index < len; index += 1) {
        data2[index].check = true;
      }
      this.setState({
        sprintData: res2.currentSprint,
      });
      AccumulationStore.setColumnData(data2);
      AccumulationStore.axiosGetProjectInfo().then((res) => {
        AccumulationStore.setProjectInfo(res);
        AccumulationStore.setStartDate(moment(res.creationDate.split(' ')[0]));
        if (type) {
          this.getData();
        }
      }).catch((error) => {
      });
    }).catch((error) => {
    });
  }
  getData() {
    this.setState({
      loading: true,
    });
    const columnData = AccumulationStore.getColumnData;
    const endDate = AccumulationStore.getEndDate.format('YYYY-MM-DD HH:mm:ss');
    const filterList = AccumulationStore.getFilterList;
    const startDate = AccumulationStore.getStartDate.format('YYYY-MM-DD HH:mm:ss');
    const columnIds = [];
    const quickFilterIds = [];
    let boardId;
    for (let index = 0, len = AccumulationStore.getBoardList.length; index < len; index += 1) {
      if (AccumulationStore.getBoardList[index].check) {
        boardId = AccumulationStore.getBoardList[index].boardId;
      }
    }
    for (let index2 = 0, len2 = columnData.length; index2 < len2; index2 += 1) {
      if (columnData[index2].check) {
        columnIds.push(columnData[index2].columnId);
      }
    }
    for (let index3 = 0, len3 = filterList.length; index3 < len3; index3 += 1) {
      if (filterList[index3].check) {
        quickFilterIds.push(filterList[index3].filterId);
      }
    }
    AccumulationStore.axiosGetAccumulationData({
      columnIds,
      endDate,
      quickFilterIds,
      startDate,
      boardId,
    }).then((res) => {
      AccumulationStore.setAccumulationData(res);
      this.setState({
        loading: false,
      });
      this.getOption();
    }).catch((error) => {
      this.setState({
        loading: false,
      });
    });
  }
  getOption() {
    let data = _.clone(AccumulationStore.getAccumulationData);
    const legendData = [];
    for (let index = 0, len = data.length; index < len; index += 1) {
      legendData.push({
        icon: 'rect',
        name: data[index].name,
      });
    }
    const newxAxis = [];
    if (data.length > 0) {
      for (let index = 0, len = data.length; index < len; index += 1) {
        for (let index2 = 0, len2 = data[index].coordinateDTOList.length; index2 < len2; index2 += 1) {
          if (newxAxis.length === 0) {
            newxAxis.push(data[index].coordinateDTOList[index2].date.split(' ')[0]);
          } else if (newxAxis.indexOf(data[index].coordinateDTOList[index2].date.split(' ')[0]) === -1) {
            newxAxis.push(data[index].coordinateDTOList[index2].date.split(' ')[0]);
          }
        }
      }
    }
    const legendSeries = [];
    data = data.reverse();
    for (let index = 0, len = data.length; index < len; index += 1) {
      legendSeries.push({
        name: data[index].name,
        type: 'line',
        stack: true,
        areaStyle: { normal: {
          color: data[index].color,
        } },
        lineStyle: { normal: {
          color: data[index].color,
        } },
        itemStyle: {
          normal: { color: data[index].color },
        },
        data: [],
      });
      for (let index2 = 0, len2 = newxAxis.length; index2 < len2; index2 += 1) {
        let date = '';
        let max = 0;
        let flag = 0;
        for (let index3 = 0, len3 = data[index].coordinateDTOList.length; index3 < len3; index3 += 1) {
          if (data[index].coordinateDTOList[index3].date.split(' ')[0] === newxAxis[index2]) {
            flag = 1;
            if (date === '') {
              date = data[index].coordinateDTOList[index3].date;
              max = data[index].coordinateDTOList[index3].issueCount;
            } else if (moment(data[index].coordinateDTOList[index3].date).isAfter(date)) {
              date = data[index].coordinateDTOList[index3].date;
              max = data[index].coordinateDTOList[index3].issueCount;
            }
          }
        }
        if (flag === 1) {
          legendSeries[index].data.push(max);
        } else {
          legendSeries[index].data.push(legendSeries[index].data[legendSeries[index].data.length - 1]);
        }
      }
    }
    this.setState({
      options: {
        tooltip: {
          trigger: 'axis',
          // axisPointer: {
          //   type: 'cross',
          //   label: {
          //     backgroundColor: '#6a7985',
          //   },
          // },
        },
        legend: {
          right: '0%',
          data: legendData,
        },
        grid: {
          left: '3%',
          right: '3%',
          containLabel: true,
        },
        // toolbox: {
        //   left: 'left',
        //   feature: {
        //     restore: {},
        //     // dataZoom: {
        //     //   yAxisIndex: 'none',
        //     // },
        //   },
        // },
        xAxis: [
          {
            name: '日期',
            type: 'category',
            boundaryGap: false,
            data: newxAxis,
          },
        ],
        yAxis: [
          {
            name: '问题数',
            type: 'value',
          },
        ],
        series: legendSeries,
        dataZoom: [{
          startValue: newxAxis[0],
          type: 'slider',
          handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
          handleSize: '80%',
          handleStyle: {
            color: '#fff',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.6)',
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          },
          // right: '50%',
          // left: '0%',
        }],
      },
      optionsVisible: false,
    });
  }
  getTimeType(data, type, array) {
    let result;
    if (array) {
      result = [];
    }
    for (let index = 0, len = data.length; index < len; index += 1) {
      if (data[index].check) {
        if (array) {
          result.push(String(data[index][type]));
        } else {
          result = data[index][type];
        }
      }
    }
    return result;
  }
  
  setStoreCheckData(data, id, params, array) {
    const newData = _.clone(data);
    for (let index = 0, len = newData.length; index < len; index += 1) {
      if (array) {
        if (id.indexOf(String(newData[index][params])) !== -1) {
          newData[index].check = true;
        } else {
          newData[index].check = false;
        }
      } else if (String(newData[index][params]) === String(id)) {
        newData[index].check = true;
      } else {
        newData[index].check = false;
      }
    }
    return newData;
  }
  getFilterData() {
    return [{
      data: AccumulationStore.getBoardList,
      onChecked: id => String(this.getTimeType(AccumulationStore.getBoardList, 'boardId')) === String(id),
      onChange: (id, bool) => {
        AccumulationStore.setBoardList(this.setStoreCheckData(AccumulationStore.getBoardList, id, 'boardId'));
        this.getColumnData(id, true);
      },
      id: 'boardId',
      text: '看板',
    }, {
      data: AccumulationStore.getColumnData,
      onChecked: id => this.getTimeType(AccumulationStore.getColumnData, 'columnId', 'array').indexOf(String(id)) !== -1,
      onChange: (id, bool) => {
        AccumulationStore.changeColumnData(id, bool);
        this.getData();
      },
      id: 'columnId',
      text: '列',
    }, {
      data: AccumulationStore.getFilterList,
      onChecked: id => this.getTimeType(AccumulationStore.getFilterList, 'filterId', 'array').indexOf(String(id)) !== -1,
      onChange: (id, bool) => {
        AccumulationStore.changeFilterData(id, bool);
        this.getData();
      },
      id: 'filterId',
      text: '快速搜索',
    }];
  }
  // handleOnBrushSelected(params) {
  // }
  render() {
    const { history } = this.props;
    const urlParams = AppState.currentMenuType;
    return (
      <Page>
        <Header
          title="累积流量图"
          backPath={`/agile/reporthost?type=${urlParams.type}&id=${urlParams.id}&name=${urlParams.name}&organizationId=${urlParams.organizationId}`}
        >
          <SwithChart
            history={this.props.history}
            current="accumulation"
          />
          <Button funcType="flat" onClick={() => { this.getData(); }}>
            <Icon type="refresh icon" />
            <span>刷新</span>
          </Button>
        </Header>
        <Content
          title="累积流量图"
          description="显示状态的问题。这有助于您识别潜在的瓶颈, 需要对此进行调查。"
          link="#"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Spin spinning={this.state.loading}>
            <div className="c7n-accumulation-filter">
              <RangePicker
                value={[moment(AccumulationStore.getStartDate), moment(AccumulationStore.getEndDate)]}
                allowClear={false}
                onChange={(date, dateString) => {
                  AccumulationStore.setStartDate(moment(dateString[0]));
                  AccumulationStore.setEndDate(moment(dateString[1]));
                  this.getData();
                }}
              />
              {
                this.getFilterData().map((item, index) => (
                  <Popover
                    placement="bottom"
                    trigger="click"
                    getPopupContainer={() => document.getElementsByClassName('c7n-accumulation-filter')[0]}
                    content={(
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {
                          item.data.map(items => (
                            <Checkbox
                              checked={item.onChecked(items[item.id])}
                              onChange={(e) => {
                                item.onChange(items[item.id], e.target.checked);
                              }}
                            >
                              {items.name}
                            </Checkbox>
                          ))
                        }
                      </div>
                    )}
                  >
                    <Button 
                      style={{ 
                        marginLeft: index === 0 ? 20 : 0, 
                        color: '#3F51B5', 
                      }}
                    >
                      {item.text}
                      <Icon type="baseline-arrow_drop_down" />
                    </Button>
                  </Popover>
                ))
              }
              {
                this.state.optionsVisible ? (
                  <AccumulationFilter
                    visible={this.state.optionsVisible}
                    getTimeType={this.getTimeType.bind(this)}
                    getColumnData={this.getColumnData.bind(this)}
                    getData={this.getData.bind(this)}
                    onCancel={() => {
                      this.getColumnData(this.getTimeType(AccumulationStore.getBoardList, 'boardId'));
                      this.setState({
                        optionsVisible: false,
                      });
                    }}
                  />
                ) : ''
              }
            </div>
            <div className="c7n-accumulation-report" style={{ flexGrow: 1, height: '100%' }}>
              <ReactEcharts
                ref={(e) => { this.echarts_react = e; }}
                option={this.state.options}
                style={{
                  height: '600px',
                }}
                notMerge
                lazyUpdate
              />
            </div>
          </Spin>
        </Content>
      </Page>
    );
  }
}

export default Form.create()(AccumulationHome);
