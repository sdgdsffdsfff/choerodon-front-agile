import React, { Component } from 'react';
import './PriorityTag.scss';

const PRIORITY_MAP = {
  medium: {
    color: '#3575df',
    bgColor: 'rgba(77, 144, 254, 0.2)',
    name: '中',
  },
  high: {
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.2)',
    name: '高',
  },
  low: {
    color: 'rgba(0, 0, 0, 0.36)',
    bgColor: 'rgba(0, 0, 0, 0.08)',
    name: '低',
  },
  default: {
    color: 'transparent',
    bgColor: 'transparent',
    name: '',
  },
};

class PriorityTag extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.priority === this.props.priority) {
      return false;
    }
    return true;
  }

  render() {
    const { priority } = this.props;
    const currentPriority = PRIORITY_MAP[priority] || PRIORITY_MAP.default;
    return (
      <div
        className="c7n-priorityTag"
        style={{
          backgroundColor: currentPriority.bgColor,
          color: currentPriority.color,
        }}
      >
        {currentPriority.name}
      </div>
    );
  }
}

export default PriorityTag;
