import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Collapse } from 'choerodon-ui';
import './RenderSwimLaneContext.scss';
import SwimLaneHeader from './SwimLaneHeader.jsx';

const { Panel } = Collapse;

@inject('AppState')
@observer
class SwimLaneContext extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: [],
    };
  }

  componentWillReceiveProps(nextProps, nextContext) {
    this.setState({
      activeKey: [],
    });
  }

  getPanelKey = (mode, issue) => {
    const modeMap = new Map([
      ['swimlane_none', 'swimlaneContext-all'],
      ['assignee', `swimlaneContext-${issue.assigneeId || issue.type}`],
      ['swimlane_epic', `swimlaneContext-${issue.epicId || issue.type}`],
      ['parent_child', `swimlaneContext-${issue.issueId || issue.type}`],
    ]);
    return modeMap.get(mode);
  };

  getDefaultExpanded = (mode, issueArr, key) => {
    let retArr = issueArr;
    if (mode === 'parent_child') {
      retArr = retArr.filter(issue => !issue.isComplish || key === 'other');
    }
    return retArr.map(issue => this.getPanelKey(mode, issue));
  };

  getPanelItem = (key, parentIssue = null) => {
    const { children, mode, fromEpic } = this.props;
    return (
      <Panel
        key={this.getPanelKey(mode, parentIssue, key)}
        className={`c7n-swimlaneContext-container ${fromEpic ? 'shouldBeIndent' : ''}`}
        header={(
          <SwimLaneHeader
            parentIssue={parentIssue}
            mode={mode}
            keyId={key}
            subIssueDataLength={parentIssue instanceof Array ? parentIssue.length : parentIssue.subIssueData.length}
          />
        )}
      >
        {children(this.keyConverter(key, mode))}
      </Panel>
    );
  };

  panelOnChange = (arr) => {
    this.setState({
      activeKey: arr,
    });
  };

  keyConverter = (key, mode) => {
    const { epicPrefix } = this.props;
    const retMap = new Map([
      ['parent_child', `parent_child-${key}`],
      ['assignee', `assignee-${key}`],
      ['swimlane_none', 'swimlane_none-other'],
    ]);
    if (epicPrefix) {
      return `${epicPrefix}-${key}`;
    }
    return retMap.get(mode);
  };

  render() {
    const { parentIssueArr, otherIssueWithoutParent, mode } = this.props;
    const { activeKey } = this.state;
    return (
      <Collapse
        activeKey={activeKey.length ? activeKey : this.getDefaultExpanded(mode, [...parentIssueArr.values(), otherIssueWithoutParent])}
        onChange={this.panelOnChange}
        bordered={false}
        forceRender
      >
        {Array.from(parentIssueArr).map(([key, value]) => this.getPanelItem(key, value))}
        {otherIssueWithoutParent.length && this.getPanelItem('other', otherIssueWithoutParent, 'fromOther')}
      </Collapse>
    );
  }
}

export default SwimLaneContext;
