import React, { Component } from 'react';
import { Spin } from 'choerodon-ui';
import { stores, axios } from 'choerodon-front-boot';
import ReactEcharts from 'echarts-for-react';
import _ from 'lodash';
import EmptyBlockDashboard from '../../../../../../components/EmptyBlockDashboard';
import pic from '../../EmptyPics/no_sprint.svg';
import pic2 from '../../EmptyPics/no_version.svg';
import './Assignee.scss';

const { AppState } = stores;

class VersionProgress extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sprintId: undefined,
      loading: true,
      assigneeInfo: [],
    };
  }

  componentWillReceiveProps(nextProps) {
    const { sprintId } = this.props;
    if (nextProps.sprintId !== sprintId) {
      const newSprintId = nextProps.sprintId;
      this.setState({
        sprintId: newSprintId,
      });
      this.loadAssignee(newSprintId);
    }
  }

  getOption() {
    const { assigneeInfo } = this.state;
    const data = assigneeInfo.map(v => ({
      name: v.assigneeName,
      value: v.issueNum,
    }));
    const allCount = _.reduce(assigneeInfo, (sum, n) => sum + n.issueNum, 0);
    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        textStyle: {
          color: '#000',
        },
        formatter(params) {
          const res = `${params.name}：${params.value}<br/>占比：
            ${((params.value / allCount).toFixed(2) * 100).toFixed(0)}%`;
          return res;
        },
        extraCssText: 
          'box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2); border: 1px solid #ddd; border-radius: 0;',
      },
      series: [
        {
          color: ['#FFB100', '#4D90FE', '#00BFA5'],
          type: 'pie',
          radius: '60px',
          hoverAnimation: false,
          center: ['50%', '50%'],
          data,
          itemStyle: {
            normal: {
              borderWidth: 2,
              borderColor: '#fff',
            },
          },
        },
      ],
    };
    return option;
  }

  loadAssignee(sprintId) {
    const projectId = AppState.currentMenuType.id;
    this.setState({ loading: true });
    axios.get(`/agile/v1/projects/${projectId}/iterative_worktable/assignee_id?sprintId=${sprintId}`)
      .then((res) => {
        this.setState({
          loading: false,
          assigneeInfo: res,
        });
      });
  }

  renderContent() {
    const { loading, sprintId, assigneeInfo } = this.state;
    if (loading) {
      return (
        <div className="c7n-loadWrap">
          <Spin />
        </div>
      );
    }
    if (!sprintId) {
      return (
        <div className="c7n-loadWrap">
          <EmptyBlockDashboard
            pic={pic}
            des="当前项目下无活跃或结束冲刺"
          />
        </div>
      );
    }
    if (assigneeInfo.every(v => v.issueNum === 0)) {
      return (
        <div className="c7n-loadWrap">
          <EmptyBlockDashboard
            pic={pic2}
            des="当前冲刺下无问题"
          />
        </div>
      );
    }
    return (
      <ReactEcharts
        option={this.getOption()}
        style={{ height: 232 }}
      />
    );
  }


  render() {
    return (
      <div className="c7n-sprintDashboard-assignee">
        {this.renderContent()}
      </div>
    );
  }
}

export default VersionProgress;