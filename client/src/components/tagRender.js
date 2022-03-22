import { Tag } from 'antd';

function tagRender(props) {
  const { label, closable, onClose } = props;
  const labelToDisplay = label && label.props && label.props.children ? label.props.children : '';
  return (
    <Tag
      closable={closable}
      onClose={onClose}
      className="tag"
    >
      <span>{labelToDisplay}</span>
    </Tag>
  );
}

export default tagRender;

