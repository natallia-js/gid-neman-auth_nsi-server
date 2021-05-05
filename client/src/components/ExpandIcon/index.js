import { DownSquareTwoTone, RightSquareTwoTone } from '@ant-design/icons';
import { InterfaceDesign } from '../../constants';

// Наименования параметров менять нельзя!!! (antd-table не поймет)
const expandIcon = ({ expanded, onExpand, record }) =>
  expanded ? (
    <DownSquareTwoTone
      onClick={e => onExpand(record, e)}
      style={{ fontSize: InterfaceDesign.EXPANDED_ICON_SIZE }}
    />
  ) : (
    <RightSquareTwoTone
      onClick={e => onExpand(record, e)}
      style={{ fontSize: InterfaceDesign.EXPANDED_ICON_SIZE }}
    />
  );

export default expandIcon;
