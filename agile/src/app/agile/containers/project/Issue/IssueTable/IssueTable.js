import React, { Component } from 'react';
import { Table } from 'choerodon-ui';
import { observer } from 'mobx-react';
import { trace } from 'mobx';
import _ from 'lodash';
import IssueStore from '../../../../stores/project/sprint/IssueStore';
import IssueFilterControler from '../IssueFilterControler';
import {
  IssueNum, TypeCode, Summary, StatusName, Priority, Assignee, LastUpdateTime, Sprint, Epic,
} from './IssueTableComponent';
import EmptyBlock from '../../../../components/EmptyBlock';
import pic from '../../../../assets/image/emptyIssue.svg';
import QuickCreateIssue from '../QuickCreateIssue/QuickCraeteIssue';

let previousClick = false;
@observer
class IssueTable extends Component {
  constructor(props) {
    super(props);
    this.filterControler = new IssueFilterControler();
  }

  componentWillUnmount() {
    IssueStore.setClickedRow({
      selectedIssue: {},
      expand: false,
    });
  }

  /**
   * @param filters => Object => Table 传入的 filter
   * @param setArgs => function => 设置参数时需要调用的闭包函数
   */
  filterConvert = (filters, setArgs) => {
    // const convertedFilter = Object.keys(filters).map((key) => {
    //   let filterField = filters[key].map(item => JSON.parse(item));
    //   if (filterField.find(item => item.select)) {
    //     filterField = _.map(filterField, 'id');
    //   }
    //   return filterField;
    // });
    // console.log(convertedFilter);

    // 循环遍历 Object 中的每个键
    Object.keys(filters).forEach((key) => {
      // 根据对应的 key 传入对应的 mode
      switch (key) {
        // case 'statusId':
        // case 'priorityId':
        // case 'issueTypeId':
        //   setArgs('advArgs', filters);
        //   break;
        case 'label':
        case 'component':
        case 'version':
        case 'epic':
        case 'sprint':
          const { fieldSelected, fieldInput } = this.convertSelectOrInput(filters);
          setArgs('otherArgs', fieldSelected);
          setArgs('searchArgs', fieldInput);
          break;
        default:
          setArgs('searchArgs', {
            [key]: filters[key][0],
          });
          break;
      }
    });
  };

  convertSelectOrInput = (filters) => {
    const fieldSelected = {}; // {sprint: [1,2]}
    const fieldInput = {}; // {sprint: 'shjh'}
    Object.keys(filters).forEach((key) => {
      fieldSelected[key] = []; // 选中
      fieldInput[key] = ''; // 输入
      filters[key].forEach((fieldValue) => {
        try {
          const selected = JSON.parse(fieldValue);
          if (selected.id) {
            fieldSelected[key].push(selected.id);
          } else {
            throw new Error('没有id');
          }
        } catch (e) {
          fieldInput[key] = fieldValue;
        }
      });
    });
    return { fieldSelected, fieldInput };
  }

  /**
   *
   * @param barFilters => Array => Table Filter 生成的 barFilter，模糊搜索和 filter 受控会使用到
   * @param setArgs => function => 设置参数时会调用到的闭包函数
   */
  barFilterConvert = (barFilters, setArgs) => {
    // 复制 Array
    const temp = barFilters.slice();
    // 如果 paramFilter 在当前 barFilter 中能找到，则不调用模糊搜索
    if (barFilters.indexOf(IssueStore.getParamFilter) !== -1) {
      temp.shift();
    }
    setArgs('contents', {
      contents: temp,
    });
  };

  /**
   * Table 默认的 filter 处理函数
   * @param pagination => Object => 分页对象
   * @param filters => Object => Table 筛选对象
   * @param sorter => Object => 排序对象
   * @param barFilters => Object => filter 受控对象
   */
  handleFilterChange = (pagination, filters, sorter, barFilters) => {
    const setArgs = this.filterControler.initArgsFilter();
    this.filterConvert(filters, setArgs);
    this.barFilterConvert(barFilters, setArgs);
    IssueStore.setLoading(true);
    // 更新函数
    this.filterControler.update(
      pagination.current - 1,
      pagination.pageSize,
      sorter,
      barFilters,
    ).then(
      (res) => {
        IssueStore.updateFiltedIssue({
          current: res.number + 1,
          pageSize: res.size,
          total: res.totalElements,
        }, res.content, barFilters);
      },
    );
  };

  render() {
    // Table 列配置
    const columns = [
      {
        title: '问题编号',
        dataIndex: 'issueNum',
        key: 'issueNum',
        className: 'issueId',
        sorterId: 'issueId',
        width: 128,
        sorter: true,
        filters: [],
        // fixed: true,
        render: text => <IssueNum text={text} />,
      },
      {
        title: '问题类型',
        key: 'issueTypeId',
        className: 'issueType',
        sorterId: 'issueTypeId',
        width: 128,
        sorter: true,
        // filters: IssueStore.getColumnFilter.get('typeId'),
        // filterMultiple: true,
        // fixed: true,
        render: (text, record) => (
          <div style={{ lineHeight: 0 }}>
            <TypeCode record={record} />
          </div>
        ),
      },
      {
        title: '概要',
        dataIndex: 'summary',
        className: 'summary',
        key: 'summary',
        filters: [],
        // fixed: true,
        render: text => <Summary text={text} />,
      },
      {
        title: '状态',
        key: 'statusId',
        className: 'status',
        sorterId: 'statusId',
        width: 128,
        sorter: true,
        // filters: IssueStore.getColumnFilter.get('statusId'),
        // filterMultiple: true,
        render: (text, record) => <StatusName record={record} />,
      },
      {
        title: '优先级',
        key: 'priorityId',
        className: 'priority',
        sorterId: 'priorityId',
        sorter: true,
        width: 108,
        // filters: IssueStore.getColumnFilter.get('priorityId'),
        // filterMultiple: true,
        render: (text, record) => <Priority record={record} />,
      },
      {
        title: '经办人',
        dataIndex: 'assigneeName',
        className: 'assignee',
        width: 168,
        key: 'assignee',
        sorterId: 'assigneeId',
        sorter: true,
        render: (text, record) => (
          <Assignee
            text={text}
            id={record.assigneeId}
            img={record.assigneeImageUrl}
          />
        ),
      },
      {
        title: '冲刺',
        key: 'sprint',
        className: 'sprint',
        width: 128,
        filters: IssueStore.getColumnFilter.get('sprint'),
        filteredValue: [],
        filterMultiple: true,
        render: record => (
          <Sprint
            objArray={record.issueSprintDTOS}
            name={
              record.issueSprintDTOS && record.issueSprintDTOS.length
                ? record.issueSprintDTOS[0].sprintName
                : null
            }
          />
        ),
      },
      {
        title: '最后更新时间',
        dataIndex: 'lastUpdateDate',
        className: 'lastUpdateDate',
        key: 'lastUpdateDate',
        sorterId: 'lastUpdateDate',
        width: 160,
        sorter: true,
        render: text => <LastUpdateTime text={text} />,
      },
      {
        title: '报告人',
        dataIndex: 'reporterName',
        key: 'reporter',
        filters: [],
        hidden: true,
        render: (text, record) => (
          <Assignee
            text={text}
            id={record.reporterId}
            img={record.reporterImageUrl}
          />
        ),
      },
      {
        title: '版本',       
        key: 'version',
        filters: IssueStore.getColumnFilter.get('version'),
        filterMultiple: true,
        hidden: true,
        render: record => (
          <Sprint
            objArray={record.versionIssueRelDTOS}
            name={
            record.versionIssueRelDTOS && record.versionIssueRelDTOS.length
              ? record.versionIssueRelDTOS[0].name
              : null}
          />
        ),
      },
      {
        title: '模块',
        key: 'component',
        filters: IssueStore.getColumnFilter.get('component'),
        filterMultiple: true,
        hidden: true,
        render: record => (
          <Sprint
            objArray={record.componentIssueRelDTOList}
            name={
              record.componentIssueRelDTOList && record.componentIssueRelDTOList.length
                ? record.componentIssueRelDTOList[0].name
                : null
            }
          />
        ),
      },
      {
        title: '史诗',
        dataIndex: 'epicName',
        key: 'epic',
        filters: IssueStore.getColumnFilter.get('epic'),
        filterMultiple: true,
        hidden: true,
        render: (text, record) => <Epic name={record.epicName} color={record.epicColor} />,
      },
      {
        title: '标签',
        key: 'label',
        filters: IssueStore.getColumnFilter.get('label'),
        filterMultiple: true,
        hidden: true,
      },
    ];
    // 表格列配置
    return (
      <Table
        rowKey={record => record.issueId}
        {...this.props}
        columns={columns}
        dataSource={IssueStore.getIssues}
        // scroll={{ x: 1600 }}
        empty={(
          <EmptyBlock
            style={{ marginTop: 60, marginBottom: 60 }}
            border
            pic={pic}
            title="根据当前搜索条件没有查询到问题"
            des="尝试修改您的过滤选项或者在下面创建新的问题"
          />
          )}
        filterBarPlaceholder="过滤表"
        noFilter
        filters={IssueStore.getBarFilter}
        loading={IssueStore.getLoading}
        pagination={IssueStore.getPagination}
        footer={() => (<QuickCreateIssue />)}
        // onChange={this.handleFilterChange}
        className="c7n-Issue-table"
        onRow={record => ({
          onClick: (e) => {
            // 点击时设置当前点击元素 style
            if (previousClick) {
              // 如果上一次点击过，就清空 previousClick 中保存的 style
              previousClick.style.background = '';
              previousClick.style.borderLeft = '';
            } else {
              e.currentTarget.scrollIntoView(true);
            }
            e.currentTarget.style.background = 'rgba(140, 158, 255, 0.08)';
            e.currentTarget.style.borderLeft = '3px solid #3f51b5';
            // 将这次的点击元素设置为 previousClick 供下次使用
            previousClick = e.currentTarget;
            IssueStore.setClickedRow({
              selectedIssue: record,
              expand: true,
            });
            IssueStore.setFilterListVisible(false);
          },
          onBlur: (e) => {
            // 点击隐藏详情时无法触发 onClick，所以需要利用 onBlur 触发
            e.currentTarget.style.background = '';
            e.currentTarget.style.borderLeft = '';
          },
        })
          }
      />
    );
  }
}

export default IssueTable;
